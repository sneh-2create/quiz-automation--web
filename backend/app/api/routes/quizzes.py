from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizOut
from app.core.dependencies import get_current_user, get_teacher

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("/", response_model=QuizOut)
def create_quiz(data: QuizCreate, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quiz = Quiz(**data.model_dump(), teacher_id=teacher.id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/", response_model=List[QuizOut])
def list_quizzes(
    published_only: bool = Query(False),
    subject: Optional[str] = Query(None),
    teacher_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Quiz)
    if published_only or current_user.role == "student":
        q = q.filter(Quiz.is_published == True)
    if subject:
        q = q.filter(Quiz.subject.ilike(f"%{subject}%"))
    if teacher_id:
        q = q.filter(Quiz.teacher_id == teacher_id)
    elif current_user.role == "teacher":
        q = q.filter(Quiz.teacher_id == current_user.id)
    return q.offset(skip).limit(limit).all()


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if current_user.role == "student" and not quiz.is_published:
        raise HTTPException(status_code=403, detail="Quiz not published")
    return quiz


@router.patch("/{quiz_id}", response_model=QuizOut)
def update_quiz(quiz_id: int, data: QuizUpdate, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not your quiz")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(quiz, field, val)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not your quiz")
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted"}


@router.post("/{quiz_id}/publish")
def publish_quiz(quiz_id: int, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not your quiz")
    quiz.is_published = not quiz.is_published
    db.commit()
    return {"message": f"Quiz {'published' if quiz.is_published else 'unpublished'}", "is_published": quiz.is_published}

# New endpoint: generate quick quiz using Gemini AI
@router.post("/generate", response_model=QuizOut)
def generate_quiz(subject: str = Query(...), difficulty: str = Query("medium"), num_questions: int = Query(5), db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    from app.services.gemini_service import generate_questions
    # Generate question data via Gemini
    questions_data = generate_questions(subject, difficulty, num_questions)
    # Create Quiz object
    quiz = Quiz(title=f"{subject.title()} - {difficulty.title()} Quiz", subject=subject, teacher_id=teacher.id, is_published=False)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    # Insert generated questions linked to this quiz
    from app.models.question import Question
    for q in questions_data:
        question = Question(quiz_id=quiz.id, text=q["text"], options=q.get("options"), correct_option=q.get("correct_option"), difficulty=difficulty)
        db.add(question)
    db.commit()
    return quiz
