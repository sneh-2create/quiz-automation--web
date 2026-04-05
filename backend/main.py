from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.student_identity import student_internal_email
from app.db.database import create_tables
from app.api.routes import auth, users, quizzes, questions, attempts, analytics, ai, public_settings, admin_panel

app = FastAPI(
    title="Quiz Automation Platform API",
    description="AI-Powered Smart Quiz & Learning Analytics Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def api_health():
    """No database — for browser / dev connectivity checks."""
    return {"status": "ok"}


@app.get("/api/whoami")
def api_whoami():
    """If this 404s on port 8000, something else is bound to that port (not this FastAPI app)."""
    return {"app": "quiz-automation-platform", "api": True}


# Include all routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(attempts.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(public_settings.router, prefix="/api")
app.include_router(admin_panel.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    create_tables()
    _ensure_platform_settings_row()
    _backfill_participant_codes()
    _backfill_mobile_digits()
    if not settings.DISABLE_DEMO_SEED:
        _ensure_demo_accounts()
    print(
        "\n>>> Quiz Automation Platform API is running.\n"
        ">>> Open http://127.0.0.1:8000/docs — if that fails, this process is not serving correctly.\n"
        ">>> Quick check: http://127.0.0.1:8000/api/whoami should return JSON with app name.\n"
    )


def _ensure_platform_settings_row():
    """Singleton row id=1 for all DB backends (Postgres has no SQLite migration insert)."""
    from app.db.database import SessionLocal
    from app.models.platform_settings import PlatformSettings

    db = SessionLocal()
    try:
        if db.query(PlatformSettings).filter(PlatformSettings.id == 1).first() is None:
            db.add(
                PlatformSettings(
                    id=1,
                    student_analytics_enabled=True,
                    allow_quiz_retakes=False,
                    analytics_rank_tier_1=3,
                    analytics_rank_tier_2=10,
                    analytics_rank_tier_3=20,
                )
            )
            db.commit()
    except Exception as e:
        print(f"⚠️ platform_settings seed: {e}")
        db.rollback()
    finally:
        db.close()


def _backfill_mobile_digits():
    """Set mobile_digits for existing rows (SQLite upgrades / legacy data)."""
    from app.db.database import SessionLocal
    from app.models.user import User
    from app.core.student_identity import normalize_mobile_digits

    db = SessionLocal()
    try:
        for u in db.query(User).filter(User.mobile_no.isnot(None), User.mobile_digits.is_(None)):
            u.mobile_digits = normalize_mobile_digits(u.mobile_no)
        db.commit()
    except Exception as e:
        print(f"⚠️ mobile_digits backfill: {e}")
        db.rollback()
    finally:
        db.close()


def _backfill_participant_codes():
    """Assign participant_code to existing students (competition check-in ID)."""
    from app.db.database import SessionLocal
    from app.models.user import User, UserRole
    from app.core.participant_code import assign_unique_participant_code

    db = SessionLocal()
    try:
        for u in db.query(User).filter(User.role == UserRole.student, User.participant_code.is_(None)):
            u.participant_code = assign_unique_participant_code(db)
        db.commit()
    except Exception as e:
        print(f"⚠️ participant_code backfill: {e}")
        db.rollback()
    finally:
        db.close()


def _ensure_demo_accounts():
    """Create/update demo admin, teacher and student accounts for local testing."""
    from app.db.database import SessionLocal
    from app.models.user import User, UserRole
    from app.models.platform_settings import PlatformSettings
    from app.core.security import get_password_hash
    from app.core.student_identity import normalize_mobile_digits

    db = SessionLocal()
    try:
        row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
        if not row:
            db.add(
                PlatformSettings(
                    id=1,
                    student_analytics_enabled=True,
                    allow_quiz_retakes=False,
                    analytics_rank_tier_1=3,
                    analytics_rank_tier_2=10,
                    analytics_rank_tier_3=20,
                )
            )
            db.commit()

        demo_student_rid = "REG2026DEMO"
        demo_student_email = student_internal_email(demo_student_rid)

        demo_accounts = [
            {
                "email": "admin@quizplatform.com",
                "full_name": "Platform Admin",
                "password": "Admin@123",
                "role": UserRole.admin,
            },
            {
                "email": "teacher@quizplatform.com",
                "full_name": "Demo Teacher",
                "password": "Teacher@123",
                "role": UserRole.teacher,
            },
            {
                "registration_id": demo_student_rid,
                "email": demo_student_email,
                "legacy_email": "student@quizplatform.com",
                "full_name": "Demo Student",
                "password": "Student@123",
                "role": UserRole.student,
                "father_name": "Demo Parent",
                "college_area": "Demo City",
                "state_region": "Delhi NCR",
                "institution_name": "PIET Demo College",
                "competition_category": "UG — MCA",
                "participant_code": "PIETDEMO",
                "stream": "MCA",
                "mobile_no": "9999999999",
            },
        ]

        for acct in demo_accounts:
            if acct.get("registration_id"):
                user = db.query(User).filter(User.registration_id == acct["registration_id"]).first()
                if not user and acct.get("legacy_email"):
                    user = db.query(User).filter(User.email == acct["legacy_email"]).first()
            else:
                user = db.query(User).filter(User.email == acct["email"]).first()

            if not user:
                user = User(
                    email=acct["email"],
                    registration_id=acct.get("registration_id"),
                    full_name=acct["full_name"],
                    password_hash=get_password_hash(acct["password"]),
                    role=acct["role"],
                    is_active=True,
                    is_approved=True,
                    father_name=acct.get("father_name"),
                    college_area=acct.get("college_area"),
                    state_region=acct.get("state_region"),
                    institution_name=acct.get("institution_name"),
                    competition_category=acct.get("competition_category"),
                    participant_code=acct.get("participant_code"),
                    stream=acct.get("stream"),
                    mobile_no=acct.get("mobile_no"),
                    mobile_digits=normalize_mobile_digits(acct.get("mobile_no")),
                )
                db.add(user)
            else:
                user.full_name = acct["full_name"]
                user.password_hash = get_password_hash(acct["password"])
                user.is_active = True
                user.is_approved = True
                user.role = acct["role"]
                user.email = acct["email"]
                if acct.get("registration_id"):
                    user.registration_id = acct["registration_id"]
                if acct.get("father_name"):
                    user.father_name = acct["father_name"]
                if acct.get("college_area"):
                    user.college_area = acct["college_area"]
                if acct.get("stream"):
                    user.stream = acct["stream"]
                if acct.get("mobile_no"):
                    user.mobile_no = acct["mobile_no"]
                    user.mobile_digits = normalize_mobile_digits(acct["mobile_no"])
                if acct.get("state_region"):
                    user.state_region = acct["state_region"]
                if acct.get("institution_name"):
                    user.institution_name = acct["institution_name"]
                if acct.get("competition_category"):
                    user.competition_category = acct["competition_category"]
                if acct.get("participant_code"):
                    user.participant_code = acct["participant_code"]

        db.commit()
        print(
            "✅ Demo accounts: admin@quizplatform.com, teacher@quizplatform.com, "
            f"student: {demo_student_rid} + Student@123 · participant code PIETDEMO"
        )
    except Exception as e:
        print(f"⚠️ Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "Quiz Automation Platform API is running 🚀",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
