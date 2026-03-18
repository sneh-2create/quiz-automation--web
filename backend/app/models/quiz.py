import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum as SAEnum, ForeignKey, Text
from app.db.database import Base


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    duration_minutes = Column(Integer, default=30)
    difficulty = Column(SAEnum(Difficulty), default=Difficulty.medium)
    negative_marking = Column(Boolean, default=False)
    negative_marks_value = Column(Float, default=0.25)
    is_published = Column(Boolean, default=False)
    randomize_questions = Column(Boolean, default=True)
    randomize_options = Column(Boolean, default=True)
    pass_percentage = Column(Float, default=40.0)
    max_attempts = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
