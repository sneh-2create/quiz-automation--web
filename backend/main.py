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
    _seed_admin()


def _seed_admin():
    """Create default admin account on first run"""
    from app.db.database import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash

    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.email == "teacher@quizplatform.com").first()
        if not teacher:
            # Seed a demo teacher
            teacher = User(
                email="teacher@quizplatform.com",
                full_name="Demo Teacher",
                password_hash=get_password_hash("Teacher@123"),
                role="teacher",
                is_active=True,
                is_approved=True,
            )
            db.add(teacher)
            # Seed a demo student
            student = User(
                email="student@quizplatform.com",
                full_name="Demo Student",
                password_hash=get_password_hash("Student@123"),
                role="student",
                is_active=True,
                is_approved=True,
            )
            db.add(student)
            db.commit()
            print("✅ Seeded default accounts: teacher, student")
        else:
            print("✅ Database already initialized")
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
