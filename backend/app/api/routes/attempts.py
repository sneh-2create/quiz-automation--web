import json
import random
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer
from app.models.anticheat import AntiCheatLog
from app.models.user import User
from app.models.platform_settings import PlatformSettings
from app.schemas.attempt import (
    StartAttemptResponse,
    SaveAnswerRequest,
    SubmitAttemptRequest,
    AntiCheatEventRequest,
)
from app.schemas.quiz import QuestionOutNoAnswer
from app.core.dependencies import get_current_user, get_student
from app.core.role_utils import role_str
from app.services.gamification_service import GamificationService
from app.services.attempt_questions import (
    pick_question_ids_for_attempt,
    get_assigned_ids,
    questions_for_attempt,
)

router = APIRouter(prefix="/attempts", tags=["Attempts"])
gamification = GamificationService()

PERFORMANCE_CATEGORIES = [
    (90, "Smart"),
    (75, "Good"),
    (60, "Average"),
    (40, "Weak"),
    (0, "Poor"),
]


def get_performance_category(percentage: float) -> str:
    for threshold, label in PERFORMANCE_CATEGORIES:
        if percentage >= threshold:
            return label
    return "Poor 🔄"


def _count_attempt_questions(db: Session, quiz_id: int, attempt: Optional[QuizAttempt]) -> int:
    ids = get_assigned_ids(attempt) if attempt else None
    if ids is not None:
        return len(ids)
    return (
        db.query(Question)
        .filter(Question.quiz_id == quiz_id, Question.is_approved == True)
        .count()
    )


@router.post("/start", response_model=StartAttemptResponse)
def start_attempt(quiz_id: int, db: Session = Depends(get_db), student: User = Depends(get_student)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.is_published == True).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or not published")

    ps = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    allow_retakes = bool(ps and ps.allow_quiz_retakes)

    existing = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == student.id,
        QuizAttempt.status == "submitted",
    ).count()
    if not allow_retakes and existing >= quiz.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts reached for this quiz")

    in_progress = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == student.id,
        QuizAttempt.status == "in_progress",
    ).first()
    if in_progress:
        n = _count_attempt_questions(db, quiz_id, in_progress)
        return StartAttemptResponse(
            attempt_id=in_progress.id,
            quiz_id=quiz_id,
            started_at=in_progress.started_at,
            duration_minutes=quiz.duration_minutes,
            total_questions=n,
        )

    attempt = QuizAttempt(quiz_id=quiz_id, student_id=student.id, status="in_progress")
    db.add(attempt)
    db.flush()
    chosen = pick_question_ids_for_attempt(quiz, db)
    attempt.assigned_question_ids = json.dumps(chosen) if chosen else None
    db.commit()
    db.refresh(attempt)

    return StartAttemptResponse(
        attempt_id=attempt.id,
        quiz_id=quiz_id,
        started_at=attempt.started_at,
        duration_minutes=quiz.duration_minutes,
        total_questions=len(chosen),
    )


@router.get("/{attempt_id}/questions", response_model=List[QuestionOutNoAnswer])
def get_attempt_questions(attempt_id: int, db: Session = Depends(get_db), student: User = Depends(get_student)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id, QuizAttempt.student_id == student.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = questions_for_attempt(quiz, attempt, db)

    if quiz.randomize_questions:
        random.shuffle(questions)

    return questions


@router.post("/save-answer")
def save_answer(data: SaveAnswerRequest, db: Session = Depends(get_db), student: User = Depends(get_student)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == data.attempt_id, QuizAttempt.student_id == student.id).first()
    if not attempt or attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="No active attempt found")

    question = db.query(Question).filter(Question.id == data.question_id).first()
    if not question or question.quiz_id != attempt.quiz_id:
        raise HTTPException(status_code=404, detail="Question not found")

    allowed = get_assigned_ids(attempt)
    if allowed is not None and data.question_id not in allowed:
        raise HTTPException(status_code=400, detail="Question is not part of this attempt")

    existing = db.query(AttemptAnswer).filter(
        AttemptAnswer.attempt_id == data.attempt_id,
        AttemptAnswer.question_id == data.question_id,
    ).first()

    if existing:
        existing.selected_option = data.selected_option
        existing.time_taken_seconds = data.time_taken_seconds
    else:
        answer = AttemptAnswer(
            attempt_id=data.attempt_id,
            question_id=data.question_id,
            selected_option=data.selected_option,
            time_taken_seconds=data.time_taken_seconds,
        )
        db.add(answer)
    db.commit()

    ps = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    # Must not use "ps is None → reveal True": missing row (e.g. Postgres before seed) forced feedback on forever.
    instant_feedback = bool(ps.student_analytics_enabled) if ps is not None else False

    if not instant_feedback:
        # Exam-style: store answer but do not reveal correctness until after submit.
        return {"message": "Answer saved", "saved": True}

    is_correct = data.selected_option.lower() == question.correct_option.lower()
    correct_text = getattr(question, f"option_{question.correct_option.lower()}", "")

    if is_correct:
        message = "Smart! Perfect answer."
    else:
        message = f"Not quite! The correct answer is ({question.correct_option.upper()}) {correct_text}. Let's try the next question, you've got this!"

    return {
        "message": "Answer saved",
        "saved": True,
        "is_correct": is_correct,
        "correct_option": question.correct_option,
        "explanation": question.explanation,
        "feedback_message": message,
    }


@router.post("/submit")
def submit_attempt(data: SubmitAttemptRequest, db: Session = Depends(get_db), student: User = Depends(get_student)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == data.attempt_id, QuizAttempt.student_id == student.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "submitted":
        raise HTTPException(status_code=400, detail="Already submitted")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = questions_for_attempt(quiz, attempt, db)
    answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()

    answer_map = {a.question_id: a for a in answers}
    total_marks = sum(q.marks for q in questions)
    score = 0.0
    correct_count = 0
    wrong_count = 0
    unattempted_count = 0

    for q in questions:
        ans = answer_map.get(q.id)
        if not ans or not ans.selected_option:
            unattempted_count += 1
            continue
        if ans.selected_option.lower() == q.correct_option.lower():
            score += q.marks
            correct_count += 1
            ans.is_correct = True
            ans.marks_awarded = q.marks
        else:
            wrong_count += 1
            ans.is_correct = False
            if quiz.negative_marking:
                score -= quiz.negative_marks_value
                ans.marks_awarded = -quiz.negative_marks_value

    time_taken = int((datetime.utcnow() - attempt.started_at).total_seconds())
    percentage = (score / total_marks * 100) if total_marks > 0 else 0
    percentage = max(0, percentage)

    attempt.score = round(score, 2)
    attempt.total_marks = total_marks
    attempt.percentage = round(percentage, 2)
    attempt.correct_count = correct_count
    attempt.wrong_count = wrong_count
    attempt.unattempted_count = unattempted_count
    attempt.time_taken_seconds = time_taken
    attempt.status = "submitted"
    attempt.submitted_at = datetime.utcnow()

    xp_earned = gamification.award_xp(student, correct_count, percentage, db)
    gamification.check_and_award_badges(student, db)

    db.commit()

    quiz_title = quiz.title
    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "quiz_title": quiz_title,
        "student_id": student.id,
        "score": attempt.score,
        "total_marks": total_marks,
        "percentage": attempt.percentage,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "unattempted_count": unattempted_count,
        "time_taken_seconds": time_taken,
        "status": "submitted",
        "submitted_at": attempt.submitted_at,
        "passed": percentage >= quiz.pass_percentage,
        "xp_earned": xp_earned,
        "performance_category": get_performance_category(percentage),
    }


@router.get("/{attempt_id}/result")
def get_result(attempt_id: int, db: Session = Depends(get_db), student: User = Depends(get_current_user)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    r = role_str(student)
    if attempt.student_id != student.id and r not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt_id).all()

    detailed_answers = []
    for ans in answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if q:
            detailed_answers.append(
                {
                    "question_id": q.id,
                    "question_text": q.text,
                    "option_a": q.option_a,
                    "option_b": q.option_b,
                    "option_c": q.option_c,
                    "option_d": q.option_d,
                    "correct_option": q.correct_option,
                    "selected_option": ans.selected_option,
                    "is_correct": ans.is_correct,
                    "marks_awarded": ans.marks_awarded,
                    "explanation": q.explanation,
                }
            )

    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "quiz_title": quiz.title if quiz else "Unknown",
        "student_id": attempt.student_id,
        "score": attempt.score,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "correct_count": attempt.correct_count,
        "wrong_count": attempt.wrong_count,
        "unattempted_count": attempt.unattempted_count,
        "time_taken_seconds": attempt.time_taken_seconds,
        "status": attempt.status,
        "submitted_at": attempt.submitted_at,
        "passed": (attempt.percentage or 0) >= (quiz.pass_percentage if quiz else 40),
        "performance_category": get_performance_category(attempt.percentage or 0),
        "answers": detailed_answers,
    }


@router.post("/anticheat")
def log_anticheat(data: AntiCheatEventRequest, db: Session = Depends(get_db), student: User = Depends(get_student)):
    log = AntiCheatLog(
        attempt_id=data.attempt_id,
        student_id=student.id,
        event_type=data.event_type,
        details=data.details,
    )
    db.add(log)
    db.commit()
    return {"message": "Event logged", "warning": "Suspicious activity detected. Please stay on the quiz page."}


@router.get("/my-history")
def my_history(db: Session = Depends(get_db), student: User = Depends(get_student)):
    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.student_id == student.id,
            QuizAttempt.status == "submitted",
        )
        .order_by(QuizAttempt.submitted_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for a in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        result.append(
            {
                "attempt_id": a.id,
                "quiz_title": quiz.title if quiz else "Unknown",
                "score": a.score,
                "total_marks": a.total_marks,
                "percentage": a.percentage,
                "submitted_at": a.submitted_at,
                "performance_category": get_performance_category(a.percentage or 0),
            }
        )
    return result
