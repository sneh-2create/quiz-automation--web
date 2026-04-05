from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    duration_minutes: int = 30
    difficulty: str = "medium"
    negative_marking: bool = False
    negative_marks_value: float = 0.25
    randomize_questions: bool = True
    randomize_options: bool = True
    pass_percentage: float = 40.0
    max_attempts: int = 1
    # Pool: e.g. 100 AI questions → deliver first 30, last 30, or random 30 per attempt.
    question_pool_mode: str = "all"  # all | first_n | last_n | random_n
    questions_per_attempt: int = 0  # 0 = all questions in pool


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    duration_minutes: Optional[int] = None
    difficulty: Optional[str] = None
    negative_marking: Optional[bool] = None
    negative_marks_value: Optional[float] = None
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    pass_percentage: Optional[float] = None
    is_published: Optional[bool] = None
    max_attempts: Optional[int] = None
    question_pool_mode: Optional[str] = None
    questions_per_attempt: Optional[int] = None


class QuizOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: Optional[str]
    topic: Optional[str]
    duration_minutes: int
    difficulty: str
    negative_marking: bool
    negative_marks_value: float
    is_published: bool
    randomize_questions: bool
    randomize_options: bool
    pass_percentage: float
    max_attempts: int
    question_pool_mode: str
    questions_per_attempt: int
    teacher_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # "a", "b", "c", "d"
    explanation: Optional[str] = None
    difficulty: str = "medium"
    topic: Optional[str] = None
    subject: Optional[str] = None
    marks: float = 1.0
    quiz_id: Optional[int] = None
    # If false (default), same normalized question text on the same quiz returns 409.
    allow_duplicate: bool = False


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    subject: Optional[str] = None
    marks: Optional[float] = None
    is_approved: Optional[bool] = None


class QuestionOut(BaseModel):
    id: int
    quiz_id: Optional[int]
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str]
    difficulty: str
    topic: Optional[str]
    subject: Optional[str]
    marks: float
    is_ai_generated: bool
    is_approved: bool
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionOutNoAnswer(BaseModel):
    """For student quiz attempts - hides correct answer"""
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: str
    topic: Optional[str]
    marks: float

    class Config:
        from_attributes = True
