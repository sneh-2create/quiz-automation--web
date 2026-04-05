import io

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate
from app.core.dependencies import get_current_user, get_teacher
from app.core.security import get_password_hash
from app.core.student_identity import normalize_mobile_digits, normalize_registration_id
from app.core.participant_code import assign_unique_participant_code

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
        try:
            q = q.filter(User.role == UserRole(role))
        except ValueError:
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
    if data.father_name is not None:
        current_user.father_name = data.father_name.strip() or None
    if data.college_area is not None:
        current_user.college_area = data.college_area.strip() or None
    if data.state_region is not None:
        current_user.state_region = data.state_region.strip() or None
    if data.institution_name is not None:
        current_user.institution_name = data.institution_name.strip() or None
    if data.competition_category is not None:
        current_user.competition_category = data.competition_category.strip() or None
    if data.stream is not None:
        current_user.stream = data.stream.strip() or None
    if data.mobile_no is not None:
        current_user.mobile_no = data.mobile_no.strip() or None
        current_user.mobile_digits = normalize_mobile_digits(current_user.mobile_no)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/leaderboard", response_model=List[UserOut])
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(User)
        .filter(User.role == UserRole.student, User.is_active == True)
        .order_by(User.xp_points.desc())
        .limit(limit)
        .all()
    )


@router.get("/stats", tags=["Teacher"])
def get_platform_stats(db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    from app.models.quiz import Quiz
    from app.models.attempt import QuizAttempt
    
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == UserRole.student).count()
    total_teachers = db.query(User).filter(User.role == UserRole.teacher).count()
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


def _norm_col(name: str) -> str:
    return str(name).strip().lower().replace(" ", "_")


@router.post("/bulk-import-students", tags=["Teacher"])
async def bulk_import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    """Create student accounts from Excel/CSV (live events). Required columns: registration_id, email, full_name,
    mobile_no, password, father_name, college_area, stream. Optional: state_region, institution_name, competition_category.
    """
    contents = await file.read()
    try:
        if file.filename and file.filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    df.columns = [_norm_col(c) for c in df.columns]
    required = {
        "registration_id",
        "email",
        "full_name",
        "mobile_no",
        "password",
        "father_name",
        "college_area",
        "stream",
    }
    if not required.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns. Required: {sorted(required)}. Found: {list(df.columns)}",
        )

    imported = 0
    errors: List[str] = []
    seen_rid: set[str] = set()
    seen_email: set[str] = set()
    seen_mobile: set[str] = set()

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            rid = normalize_registration_id(str(row["registration_id"]))
            email_norm = str(row["email"]).strip().lower()
            mobile_raw = str(row["mobile_no"]).strip()
            md = normalize_mobile_digits(mobile_raw)
            pw = str(row["password"]).strip()
            fn = str(row["full_name"]).strip()
            father = str(row["father_name"]).strip()
            area = str(row["college_area"]).strip()
            stream = str(row["stream"]).strip()

            if not rid or not email_norm or not fn or not pw or not father or not area or not stream:
                raise ValueError("Empty required field")
            if not md:
                raise ValueError("Invalid mobile_no (need at least 8 digits)")

            if rid in seen_rid:
                raise ValueError("Duplicate registration_id in file")
            if email_norm in seen_email:
                raise ValueError("Duplicate email in file")
            if md in seen_mobile:
                raise ValueError("Duplicate mobile in file")
            seen_rid.add(rid)
            seen_email.add(email_norm)
            seen_mobile.add(md)

            if db.query(User).filter(User.registration_id == rid).first():
                raise ValueError("registration_id already in database")
            if db.query(User).filter(func.lower(User.email) == email_norm).first():
                raise ValueError("email already in database")
            if db.query(User).filter(User.mobile_digits == md).first():
                raise ValueError("mobile already in database")

            sr = row.get("state_region")
            inst = row.get("institution_name")
            cat = row.get("competition_category")
            user = User(
                email=email_norm,
                registration_id=rid,
                participant_code=assign_unique_participant_code(db),
                full_name=fn,
                father_name=father,
                college_area=area,
                state_region=(str(sr).strip() if sr is not None and str(sr).strip() else None),
                institution_name=(str(inst).strip() if inst is not None and str(inst).strip() else None),
                competition_category=(str(cat).strip() if cat is not None and str(cat).strip() else None),
                stream=stream,
                mobile_no=mobile_raw,
                mobile_digits=md,
                password_hash=get_password_hash(pw),
                role=UserRole.student,
                is_active=True,
                is_approved=True,
            )
            db.add(user)
            imported += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {e}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during import: {e}")

    return {"imported": imported, "errors": errors}
