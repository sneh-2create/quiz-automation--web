import json
from typing import Optional
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, TokenResponse, UserOut
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.role_utils import role_str
from app.core.student_identity import (
    normalize_registration_id,
    student_internal_email,
    normalize_mobile_digits,
)
from app.core.participant_code import assign_unique_participant_code

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _find_user_for_login(db: Session, username: str) -> Optional[User]:
    raw = username.strip()
    if not raw:
        return None
    rid = normalize_registration_id(raw)
    user = db.query(User).filter(User.registration_id == rid).first()
    if user:
        return user
    email_norm = raw.lower()
    user = db.query(User).filter(func.lower(User.email) == email_norm).first()
    if user:
        return user
    md = normalize_mobile_digits(raw)
    if md:
        user = db.query(User).filter(User.mobile_digits == md).first()
        if user:
            return user
    return None


def _enforce_login_portal(user: User, portal: Optional[str]) -> None:
    """
    student portal → only students.
    staff portal → teacher + admin only (not students).
    """
    if not portal:
        return
    r = role_str(user)
    p = str(portal).strip().lower()
    if p == "student":
        if r != "student":
            raise HTTPException(
                status_code=403,
                detail="This account is not a student. Use the Teacher / Admin login page.",
            )
    elif p in ("staff", "teacher", "teacher_admin"):
        if r == "student":
            raise HTTPException(
                status_code=403,
                detail="This is a student account. Use the Student login page.",
            )


@router.post("/register", response_model=UserOut)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if data.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot self-register as admin")
    if data.role not in ("student", "teacher"):
        raise HTTPException(status_code=400, detail="Invalid role")
    role_enum = UserRole(data.role)
    is_approved = True

    if role_enum == UserRole.student:
        rid = normalize_registration_id(data.registration_id)
        if db.query(User).filter(User.registration_id == rid).first():
            raise HTTPException(status_code=400, detail="Registration ID already registered")
        email_norm = str(data.email).strip().lower()
        if db.query(User).filter(func.lower(User.email) == email_norm).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        md = normalize_mobile_digits(data.mobile_no)
        if md and db.query(User).filter(User.mobile_digits == md).first():
            raise HTTPException(status_code=400, detail="Mobile number already registered")
        user = User(
            email=email_norm,
            registration_id=rid,
            participant_code=assign_unique_participant_code(db),
            full_name=data.full_name.strip(),
            father_name=(data.father_name.strip() if data.father_name else None),
            college_area=(data.college_area.strip() if data.college_area else None),
            state_region=(data.state_region.strip() if data.state_region else None),
            institution_name=(data.institution_name.strip() if data.institution_name else None),
            competition_category=(data.competition_category.strip() if data.competition_category else None),
            stream=(data.stream.strip() if data.stream else None),
            mobile_no=(data.mobile_no.strip() if data.mobile_no else None),
            mobile_digits=md,
            password_hash=get_password_hash(data.password),
            role=role_enum,
            is_approved=is_approved,
        )
    else:
        email_norm = str(data.email).strip().lower()
        if db.query(User).filter(User.email == email_norm).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        user = User(
            email=email_norm,
            registration_id=None,
            full_name=data.full_name.strip(),
            father_name=(data.father_name.strip() if data.father_name else None),
            college_area=(data.college_area.strip() if data.college_area else None),
            stream=(data.stream.strip() if data.stream else None),
            mobile_no=(data.mobile_no.strip() if data.mobile_no else None),
            mobile_digits=normalize_mobile_digits(data.mobile_no),
            password_hash=get_password_hash(data.password),
            role=role_enum,
            is_approved=is_approved,
        )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    raw = await request.body()
    ct = (request.headers.get("content-type") or "").lower()

    payload: dict = {}
    if not raw:
        raise HTTPException(
            status_code=422,
            detail="Send JSON {username, password, portal?} — portal: student | staff",
        )
    if "application/x-www-form-urlencoded" in ct:
        flat = {k: (v[0] if v else "") for k, v in parse_qs(raw.decode("utf-8", errors="replace")).items()}
        payload = flat
    else:
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="Login body must be valid JSON or urlencoded form.")

    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Login body must be a JSON object or form fields.")

    u_raw = payload.get("username") or payload.get("email") or ""
    username = str(u_raw).strip() if u_raw is not None else ""
    pw_raw = payload.get("password")
    password = "" if pw_raw is None else str(pw_raw)
    portal = payload.get("portal")

    user = _find_user_for_login(db, username)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email, registration ID, mobile, or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    _enforce_login_portal(user, portal)

    token = create_access_token({"sub": str(user.id), "role": role_str(user)})
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
