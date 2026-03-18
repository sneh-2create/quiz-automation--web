from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer
from app.core.dependencies import get_current_user, get_teacher

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/student/me")
def student_analytics(db: Session = Depends(get_db), student: User = Depends(get_current_user)):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student.id,
        QuizAttempt.status == "submitted",
    ).all()

    if not attempts:
        return {
            "total_attempts": 0,
            "average_percentage": 0,
            "best_percentage": 0,
            "total_xp": student.xp_points,
            "level": student.level,
            "performance_trend": [],
            "topic_analysis": [],
            "accuracy": 0,
        }

    percentages = [a.percentage or 0 for a in attempts]
    avg_pct = round(sum(percentages) / len(percentages), 2)
    best_pct = round(max(percentages), 2)
    total_correct = sum(a.correct_count or 0 for a in attempts)
    total_answered = sum((a.correct_count or 0) + (a.wrong_count or 0) for a in attempts)
    accuracy = round((total_correct / total_answered * 100) if total_answered else 0, 2)

    # Topic analysis
    topic_stats = {}
    for attempt in attempts:
        answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()
        for ans in answers:
            q = db.query(Question).filter(Question.id == ans.question_id).first()
            if q and q.topic:
                t = q.topic
                if t not in topic_stats:
                    topic_stats[t] = {"correct": 0, "total": 0}
                topic_stats[t]["total"] += 1
                if ans.is_correct:
                    topic_stats[t]["correct"] += 1

    topic_analysis = [
        {
            "topic": t,
            "accuracy": round(v["correct"] / v["total"] * 100, 2),
            "total_questions": v["total"],
            "correct": v["correct"],
            "status": "Strong" if v["correct"] / v["total"] >= 0.7 else "Weak",
        }
        for t, v in topic_stats.items() if v["total"] > 0
    ]

    # Performance trend (last 10 attempts)
    sorted_attempts = sorted(attempts, key=lambda a: a.submitted_at or a.started_at)[-10:]
    trend = [
        {
            "attempt_id": a.id,
            "quiz_id": a.quiz_id,
            "percentage": a.percentage,
            "date": str((a.submitted_at or a.started_at).date()),
        }
        for a in sorted_attempts
    ]

    return {
        "total_attempts": len(attempts),
        "average_percentage": avg_pct,
        "best_percentage": best_pct,
        "total_xp": student.xp_points,
        "level": student.level,
        "accuracy": accuracy,
        "performance_trend": trend,
        "topic_analysis": topic_analysis,
        "strong_topics": [t for t in topic_analysis if t["status"].startswith("Strong")],
        "weak_topics": [t for t in topic_analysis if t["status"].startswith("Weak")],
    }


@router.get("/teacher/quiz/{quiz_id}")
def quiz_analytics(quiz_id: int, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        return {"error": "Quiz not found"}

    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.status == "submitted",
    ).all()

    if not attempts:
        return {"quiz_id": quiz_id, "total_attempts": 0}

    percentages = [a.percentage or 0 for a in attempts]
    avg_pct = round(sum(percentages) / len(percentages), 2)

    # Score distribution bins
    bins = {"0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0}
    for p in percentages:
        if p <= 40:
            bins["0-40"] += 1
        elif p <= 60:
            bins["41-60"] += 1
        elif p <= 75:
            bins["61-75"] += 1
        elif p <= 90:
            bins["76-90"] += 1
        else:
            bins["91-100"] += 1

    # Per-question analysis
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    question_stats = []
    for q in questions:
        answers = db.query(AttemptAnswer).filter(AttemptAnswer.question_id == q.id).all()
        total = len(answers)
        correct = sum(1 for a in answers if a.is_correct)
        question_stats.append({
            "question_id": q.id,
            "question_text": q.text[:80] + "..." if len(q.text) > 80 else q.text,
            "topic": q.topic,
            "success_rate": round(correct / total * 100, 2) if total else 0,
            "total_attempts": total,
            "correct": correct,
        })

    # Student leaderboard for this quiz
    leaderboard = sorted(attempts, key=lambda a: (a.percentage or 0), reverse=True)[:10]
    leaderboard_data = []
    for rank, a in enumerate(leaderboard, 1):
        s = db.query(User).filter(User.id == a.student_id).first()
        leaderboard_data.append({
            "rank": rank,
            "student_name": s.full_name if s else "Unknown",
            "percentage": a.percentage,
            "score": a.score,
            "time_taken_seconds": a.time_taken_seconds,
        })

    return {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "total_attempts": len(attempts),
        "average_percentage": avg_pct,
        "highest_score": max(percentages),
        "lowest_score": min(percentages),
        "pass_rate": round(sum(1 for p in percentages if p >= quiz.pass_percentage) / len(percentages) * 100, 2),
        "score_distribution": bins,
        "question_stats": sorted(question_stats, key=lambda x: x["success_rate"]),
        "leaderboard": leaderboard_data,
    }


@router.get("/teacher/overview")
def teacher_overview(db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quizzes = db.query(Quiz).filter(Quiz.teacher_id == teacher.id).all()
    quiz_ids = [q.id for q in quizzes]

    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id.in_(quiz_ids),
        QuizAttempt.status == "submitted",
    ).count() if quiz_ids else 0

    return {
        "total_quizzes": len(quizzes),
        "published_quizzes": sum(1 for q in quizzes if q.is_published),
        "total_attempts": total_attempts,
        "quiz_summary": [
            {
                "quiz_id": q.id,
                "title": q.title,
                "is_published": q.is_published,
                "subject": q.subject,
            }
            for q in quizzes
        ],
    }
