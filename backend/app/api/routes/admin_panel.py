from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_admin
from app.models.user import User, UserRole
from app.models.platform_settings import PlatformSettings
from app.models.quiz import Quiz
from app.models.attempt import QuizAttempt

router = APIRouter(prefix="/admin", tags=["Admin"])


class PlatformSettingsPatch(BaseModel):
    student_analytics_enabled: Optional[bool] = None
    allow_quiz_retakes: Optional[bool] = None
    analytics_rank_tier_1: Optional[int] = None
    analytics_rank_tier_2: Optional[int] = None
    analytics_rank_tier_3: Optional[int] = None


@router.get("/settings")
def get_settings(_admin: User = Depends(get_admin), db: Session = Depends(get_db)):
    row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    if not row:
        row = PlatformSettings(
            id=1,
            student_analytics_enabled=True,
            allow_quiz_retakes=False,
            analytics_rank_tier_1=3,
            analytics_rank_tier_2=10,
            analytics_rank_tier_3=20,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return {
        "student_analytics_enabled": bool(row.student_analytics_enabled),
        "allow_quiz_retakes": bool(row.allow_quiz_retakes),
        "analytics_rank_tier_1": int(getattr(row, "analytics_rank_tier_1", None) or 3),
        "analytics_rank_tier_2": int(getattr(row, "analytics_rank_tier_2", None) or 10),
        "analytics_rank_tier_3": int(getattr(row, "analytics_rank_tier_3", None) or 20),
    }


@router.get("/analytics/overview")
def admin_analytics_overview(_admin: User = Depends(get_admin), db: Session = Depends(get_db)):
    """
    Platform-wide metrics (all teachers / quizzes). Separate from per-teacher analytics.
    """
    total_users = db.query(User).count()
    n_students = db.query(User).filter(User.role == UserRole.student).count()
    n_teachers = db.query(User).filter(User.role == UserRole.teacher).count()
    n_admins = db.query(User).filter(User.role == UserRole.admin).count()

    quizzes = db.query(Quiz).all()
    total_quizzes = len(quizzes)
    published_quizzes = sum(1 for q in quizzes if q.is_published)

    attempts = db.query(QuizAttempt).filter(QuizAttempt.status == "submitted").all()
    total_attempts = len(attempts)

    bands = {"0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0}
    for a in attempts:
        p = a.percentage or 0
        if p <= 40:
            bands["0-40"] += 1
        elif p <= 60:
            bands["41-60"] += 1
        elif p <= 75:
            bands["61-75"] += 1
        elif p <= 90:
            bands["76-90"] += 1
        else:
            bands["91-100"] += 1

    by_quiz = Counter(a.quiz_id for a in attempts)
    top_quizzes = []
    for qid, cnt in by_quiz.most_common(8):
        quiz = db.query(Quiz).filter(Quiz.id == qid).first()
        teacher = db.query(User).filter(User.id == quiz.teacher_id).first() if quiz else None
        top_quizzes.append(
            {
                "quiz_id": qid,
                "title": quiz.title if quiz else "?",
                "attempts": cnt,
                "is_published": quiz.is_published if quiz else False,
                "teacher_name": teacher.full_name if teacher else "?",
            }
        )

    return {
        "scope": "platform",
        "users": {
            "total": total_users,
            "students": n_students,
            "teachers": n_teachers,
            "admins": n_admins,
        },
        "quizzes": {"total": total_quizzes, "published": published_quizzes},
        "attempts": {"submitted_total": total_attempts},
        "score_band_distribution": bands,
        "top_quizzes_by_attempts": top_quizzes,
    }


@router.patch("/settings")
def patch_settings(
    data: PlatformSettingsPatch,
    _admin: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    if not row:
        row = PlatformSettings(
            id=1,
            student_analytics_enabled=data.student_analytics_enabled if data.student_analytics_enabled is not None else True,
            allow_quiz_retakes=data.allow_quiz_retakes if data.allow_quiz_retakes is not None else False,
            analytics_rank_tier_1=data.analytics_rank_tier_1 if data.analytics_rank_tier_1 is not None else 3,
            analytics_rank_tier_2=data.analytics_rank_tier_2 if data.analytics_rank_tier_2 is not None else 10,
            analytics_rank_tier_3=data.analytics_rank_tier_3 if data.analytics_rank_tier_3 is not None else 20,
        )
        db.add(row)
    else:
        if data.student_analytics_enabled is not None:
            row.student_analytics_enabled = data.student_analytics_enabled
        if data.allow_quiz_retakes is not None:
            row.allow_quiz_retakes = data.allow_quiz_retakes
        if data.analytics_rank_tier_1 is not None:
            row.analytics_rank_tier_1 = max(1, min(500, int(data.analytics_rank_tier_1)))
        if data.analytics_rank_tier_2 is not None:
            row.analytics_rank_tier_2 = max(1, min(500, int(data.analytics_rank_tier_2)))
        if data.analytics_rank_tier_3 is not None:
            row.analytics_rank_tier_3 = max(1, min(500, int(data.analytics_rank_tier_3)))
    db.commit()
    db.refresh(row)
    return {
        "student_analytics_enabled": bool(row.student_analytics_enabled),
        "allow_quiz_retakes": bool(row.allow_quiz_retakes),
        "analytics_rank_tier_1": int(getattr(row, "analytics_rank_tier_1", None) or 3),
        "analytics_rank_tier_2": int(getattr(row, "analytics_rank_tier_2", None) or 10),
        "analytics_rank_tier_3": int(getattr(row, "analytics_rank_tier_3", None) or 20),
    }
