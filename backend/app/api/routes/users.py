from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.core.dependencies import get_current_user, get_teacher

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def list_users(
    role: Optional[str] = Query(None),
    is_approved: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if is_approved is not None:
        q = q.filter(User.is_approved == is_approved)
    return q.offset(skip).limit(limit).all()


@router.patch("/me", response_model=UserOut)
def update_profile(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.full_name:
        current_user.full_name = data.full_name
    if data.avatar_url:
        current_user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/leaderboard", response_model=List[UserOut])
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(User)
        .filter(User.role == "student", User.is_active == True)
        .order_by(User.xp_points.desc())
        .limit(limit)
        .all()
    )


@router.get("/stats", tags=["Teacher"])
def get_platform_stats(db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    from app.models.quiz import Quiz
    from app.models.attempt import QuizAttempt
    
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_quizzes = db.query(Quiz).count()
    published_quizzes = db.query(Quiz).filter(Quiz.is_published == True).count()
    total_attempts = db.query(QuizAttempt).count()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_quizzes": total_quizzes,
        "published_quizzes": published_quizzes,
        "total_attempts": total_attempts,
    }
