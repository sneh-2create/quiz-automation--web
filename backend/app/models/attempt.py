import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Index
from app.db.database import Base


class AttemptStatus(str, enum.Enum):
    in_progress = "in_progress"
    submitted = "submitted"
    timed_out = "timed_out"


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (Index("ix_quiz_attempts_student_quiz", "student_id", "quiz_id"),)

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="in_progress")
    score = Column(Float, nullable=True)
    total_marks = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    unattempted_count = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    # JSON list of question IDs for this attempt (per-student subset from pool).
    assigned_question_ids = Column(Text, nullable=True)


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option = Column(String, nullable=True)  # None if unattempted
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
