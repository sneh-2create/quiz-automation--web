from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import create_tables
from app.api.routes import auth, users, quizzes, questions, attempts, analytics, ai

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

# Include all routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(attempts.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    create_tables()
    _ensure_demo_accounts()


def _ensure_demo_accounts():
    """Create/update demo teacher and student accounts for local testing."""
    from app.db.database import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash

    db = SessionLocal()
    try:
        demo_accounts = [
            {
                "email": "teacher@quizplatform.com",
                "full_name": "Demo Teacher",
                "password": "Teacher@123",
                "role": "teacher",
            },
            {
                "email": "student@quizplatform.com",
                "full_name": "Demo Student",
                "password": "Student@123",
                "role": "student",
            },
        ]

        for acct in demo_accounts:
            user = db.query(User).filter(User.email == acct["email"]).first()
            if not user:
                user = User(
                    email=acct["email"],
                    full_name=acct["full_name"],
                    password_hash=get_password_hash(acct["password"]),
                    role=acct["role"],
                    is_active=True,
                    is_approved=True,
                )
                db.add(user)
            else:
                # Keep local demo logins reliable across schema/hash changes.
                user.full_name = acct["full_name"]
                user.password_hash = get_password_hash(acct["password"])
                user.is_active = True
                user.is_approved = True
                user.role = acct["role"]

        db.commit()
        print("✅ Demo accounts ready: teacher@quizplatform.com, student@quizplatform.com")
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
