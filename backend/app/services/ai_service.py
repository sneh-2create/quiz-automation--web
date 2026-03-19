import json
import re
from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.question import Question


class AIServiceError(Exception):
    pass


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self._client = None

    def _get_client(self):
        if not self._client and self.api_key and self.api_key != "your-gemini-api-key-here":
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception:
                self._client = None
        return self._client

    def _parse_questions_from_response(self, text: str) -> List[dict]:
        """Parse JSON questions from AI response"""
        # Try to extract JSON array from response
        # Using a more robust regex that ignores leading/trailing markdown characters
        json_match = re.search(r'\[\s*\{.*?\}\s*\]', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Clean markdown if present
        cleaned_text = text.replace('```json', '').replace('```', '').strip()
        # Try returning the cleaned response as JSON
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            return []

    def _generate_with_gemini(self, prompt: str) -> str:
        client = self._get_client()
        if not client:
            raise AIServiceError("Gemini API key is missing or invalid. Update backend/.env and restart backend.")

        models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash"]
        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(model=model_name, contents=prompt)
                text = (response.text or "").strip()
                if not text:
                    raise AIServiceError(f"Gemini returned an empty response using {model_name}.")
                return text
            except Exception as e:
                last_error = e
                continue

        raise AIServiceError(f"Gemini request failed: {last_error}")

    async def generate_questions(
        self,
        topic: str,
        subject: Optional[str],
        difficulty: str,
        num_questions: int,
        quiz_id: Optional[int],
        teacher_id: int,
        db: Session,
    ) -> List[dict]:
        prompt = f"""Generate {num_questions} multiple choice questions about "{topic}"{f' for subject {subject}' if subject else ''}.
Difficulty level: {difficulty}

Return a JSON array with this exact structure:
[
  {{
    "text": "Question text here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_option": "a",
    "explanation": "Brief explanation of the correct answer",
    "difficulty": "{difficulty}",
    "topic": "{topic}"
  }}
]

Only respond with the JSON array, no other text."""

        response_text = self._generate_with_gemini(prompt)
        questions_data = self._parse_questions_from_response(response_text)
        if not questions_data:
            raise AIServiceError("Gemini response was not valid JSON question data.")

        return self._save_questions_data(questions_data, num_questions, quiz_id, teacher_id, db, topic, subject, difficulty)

    def _save_questions_data(self, questions_data, num_questions, quiz_id, teacher_id, db, topic, subject, difficulty):
        saved = []
        for qd in questions_data[:num_questions]:
            try:
                q = Question(
                    quiz_id=quiz_id,
                    text=qd.get("text", ""),
                    option_a=qd.get("option_a", ""),
                    option_b=qd.get("option_b", ""),
                    option_c=qd.get("option_c", ""),
                    option_d=qd.get("option_d", ""),
                    correct_option=qd.get("correct_option", "a").lower(),
                    explanation=qd.get("explanation"),
                    difficulty=qd.get("difficulty", difficulty),
                    topic=qd.get("topic", topic),
                    subject=subject,
                    is_ai_generated=True,
                    is_approved=False,
                    created_by=teacher_id,
                )
                db.add(q)
                db.flush()
                saved.append({
                    "id": q.id,
                    "text": q.text,
                    "option_a": q.option_a,
                    "option_b": q.option_b,
                    "option_c": q.option_c,
                    "option_d": q.option_d,
                    "correct_option": q.correct_option,
                    "explanation": q.explanation,
                    "difficulty": q.difficulty,
                    "topic": q.topic,
                    "is_ai_generated": True,
                    "is_approved": False,
                })
            except Exception:
                continue

        db.commit()
        return saved

    async def explain_mistake(
        self,
        question_text: str,
        correct_option: str,
        correct_answer_text: str,
        student_selected: str,
        student_answer_text: str,
    ) -> str:
        prompt = f"""A student answered a quiz question incorrectly.

Question: {question_text}

The student selected: ({student_selected}) {student_answer_text}
The correct answer: ({correct_option}) {correct_answer_text}

Please provide a clear, encouraging explanation in 2-3 sentences explaining:
1. Why the student's answer is incorrect
2. Why the correct answer is right
3. A helpful tip to remember this concept

Keep it friendly and educational for a college student."""

        try:
            return self._generate_with_gemini(prompt)
        except AIServiceError:
            pass
        
        return (
            f"The correct answer is ({correct_option}) {correct_answer_text}. "
            f"Your selection ({student_selected}) {student_answer_text} was not quite right. "
            "Review your course materials on this topic and try again!"
        )

    async def generate_from_content(
        self,
        content: str,
        topic: Optional[str],
        difficulty: str,
        num_questions: int,
        quiz_id: Optional[int],
        teacher_id: int,
        db: Session,
    ) -> List[dict]:
        content_str = content if content else ""
        truncated_content = content_str[:4000]  # type: ignore # Gemini has token limits
        prompt = f"""Based on the following educational content, generate {num_questions} multiple choice questions.
Difficulty: {difficulty}
{f'Topic: {topic}' if topic else ''}

Content:
{truncated_content}

Return a JSON array:
[
  {{
    "text": "Question?",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "a",
    "explanation": "...",
    "difficulty": "{difficulty}",
    "topic": "{topic or 'General'}"
  }}
]

Only respond with the JSON array."""

        response_text = self._generate_with_gemini(prompt)
        questions_data = self._parse_questions_from_response(response_text)
        if not questions_data:
            raise AIServiceError("Gemini response was not valid JSON question data.")

        return self._save_questions_data(
            questions_data=questions_data,
            num_questions=num_questions,
            quiz_id=quiz_id,
            teacher_id=teacher_id,
            db=db,
            topic=topic or "General",
            subject=None,
            difficulty=difficulty
        )

    def extract_pdf_text(self, pdf_bytes: bytes) -> str:
        try:
            import PyPDF2
            import io
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        except Exception:
            return ""
