from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.schemas.attempt import AIGenerateRequest, AIExplainRequest, AIFromContentRequest
from app.core.dependencies import get_current_user, get_teacher
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])
ai_service = AIService()


@router.post("/generate-questions")
async def generate_questions(
    data: AIGenerateRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    """Generate MCQ questions using Gemini AI"""
    questions = await ai_service.generate_questions(
        topic=data.topic,
        subject=data.subject,
        difficulty=data.difficulty,
        num_questions=data.num_questions,
        quiz_id=data.quiz_id,
        teacher_id=teacher.id,
        db=db,
    )
    return {"generated": len(questions), "questions": questions}


@router.post("/explain-mistake")
async def explain_mistake(data: AIExplainRequest, current_user: User = Depends(get_current_user)):
    """Get AI explanation for a wrong answer"""
    explanation = await ai_service.explain_mistake(
        question_text=data.question_text,
        correct_option=data.correct_option,
        correct_answer_text=data.correct_answer_text,
        student_selected=data.student_selected,
        student_answer_text=data.student_answer_text,
    )
    return {"explanation": explanation}


@router.post("/generate-from-content")
async def generate_from_content(
    data: AIFromContentRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    """Generate questions from pasted text content"""
    questions = await ai_service.generate_from_content(
        content=data.content,
        topic=data.topic,
        difficulty=data.difficulty,
        num_questions=data.num_questions,
        quiz_id=data.quiz_id,
        teacher_id=teacher.id,
        db=db,
    )
    return {"generated": len(questions), "questions": questions}


@router.post("/generate-from-pdf")
async def generate_from_pdf(
    quiz_id: int = None,
    difficulty: str = "medium",
    num_questions: int = 5,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    """Extract text from PDF and generate quiz questions"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    contents = await file.read()
    text = ai_service.extract_pdf_text(contents)
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    questions = await ai_service.generate_from_content(
        content=text,
        topic=file.filename.replace(".pdf", ""),
        difficulty=difficulty,
        num_questions=num_questions,
        quiz_id=quiz_id,
        teacher_id=teacher.id,
        db=db,
    )
    return {"generated": len(questions), "questions": questions}
