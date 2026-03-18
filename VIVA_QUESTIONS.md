# Quiz Automation Platform — Viva Questions & Answers

---

## Section A: General / Overview Questions

---

### Q1. What is your project about? Explain in brief.

**Answer:**  
Our project is an **AI-powered Quiz Automation Platform** that automates quiz creation, evaluation, and feedback. Teachers can generate MCQs instantly by entering a topic, pasting content, or uploading a PDF — the system uses **Google Gemini AI** to produce high-quality questions. Students attempt quizzes through a live, timed interface and receive **instant evaluation** with scores, performance categories, and AI-generated explanations for wrong answers. The platform also includes **gamification** (XP, levels, badges) and **anti-cheating** mechanisms.

---

### Q2. Why did you choose this project?

**Answer:**  
Traditional quiz creation is extremely time-consuming — a teacher may spend 2–3 hours creating a single 20-question quiz. We wanted to solve this problem using AI. With the rise of generative AI models like Google Gemini, we saw an opportunity to reduce that time from hours to **seconds** while also adding features like instant evaluation, personalized feedback, and analytics that paper-based or basic digital systems cannot offer.

---

### Q3. What problem does your project solve?

**Answer:**  
1. **Manual quiz creation** is slow, repetitive, and error-prone.
2. **Delayed evaluation** — students wait days for results in traditional systems.
3. **No personalised feedback** — students don't know *why* their answer was wrong.
4. **Lack of analytics** — teachers cannot easily identify weak topics at individual or class level.
5. **No engagement mechanism** — students lack motivation to attempt quizzes regularly.

Our system solves all five problems through AI generation, instant scoring, AI explanations, rich dashboards, and gamification.

---

### Q4. What is the scope of this project?

**Answer:**  
The scope includes:
- AI-based MCQ generation (topic, content, and PDF-based)
- Role-based access (Teacher and Student)
- Quiz management with publish/unpublish, negative marking, randomisation
- Timed quiz attempts with auto-save
- Automatic evaluation with performance categorisation
- AI-powered mistake explanations
- Gamification (XP, levels, badges, streaks)
- Anti-cheating detection (tab switch, fullscreen exit, copy attempt)
- Student and Teacher analytics dashboards
- Question bank with approval workflow

---

### Q5. What are the modules of your project?

**Answer:**  
1. **Authentication & Authorisation** — Registration, login, JWT-based access control
2. **Quiz Management** — Create, edit, delete, publish quizzes
3. **AI Question Generation** — Topic-based, content-based, PDF-based using Gemini API
4. **Quiz Attempt System** — Start, answer, submit quizzes with timer
5. **Evaluation & Feedback** — Instant scoring, negative marking, AI explanations
6. **Analytics & Reporting** — Student and teacher dashboards with topic analysis
7. **Gamification** — XP, levels, badges, streaks, leaderboard
8. **Anti-Cheating** — Tab switch, fullscreen exit, copy attempt detection

---

## Section B: Technology / Architecture Questions

---

### Q6. What technologies have you used and why?

**Answer:**

| Technology | Why |
|-----------|-----|
| **React.js** | Component-based UI, fast rendering with Virtual DOM, rich ecosystem |
| **FastAPI** | High-performance Python framework, async support, auto-generated Swagger docs |
| **SQLite** | Lightweight, zero-config, file-based database — ideal for development and small deployments |
| **SQLAlchemy** | Pythonic ORM — abstracts SQL, supports migrations, works with multiple databases |
| **Google Gemini AI** | State-of-the-art LLM for generating contextually accurate MCQs |
| **JWT** | Stateless authentication — no server-side session storage needed |
| **Tailwind CSS** | Utility-first CSS for rapid, consistent UI development |
| **Axios** | Promise-based HTTP client with interceptors for JWT attachment |

---

### Q7. Why did you choose FastAPI over Django or Flask?

**Answer:**  
1. **Performance** — FastAPI is one of the fastest Python web frameworks (based on Starlette and Pydantic).
2. **Async support** — Native `async/await` for AI API calls (Gemini requests can take 2–5 seconds).
3. **Auto-generated docs** — Swagger UI is generated automatically from type hints — no manual documentation.
4. **Type safety** — Pydantic schemas validate request/response data at the framework level.
5. **Lightweight** — Less boilerplate than Django; more structured than Flask.

---

### Q8. Explain the architecture of your project.

**Answer:**  
Our system follows a **4-layer architecture**:

1. **Presentation Layer** — React.js frontend (Vite). Pages for teachers and students. Communicates with backend via Axios HTTP calls.
2. **API Layer** — FastAPI backend. 7 route modules (auth, users, quizzes, questions, attempts, analytics, ai). All endpoints prefixed with `/api`.
3. **Service Layer** — Business logic. `AIService` (Gemini integration) and `GamificationService` (XP, badges). Separated from routes for clean architecture.
4. **Data Layer** — SQLAlchemy ORM → SQLite database. 9 tables covering users, quizzes, questions, attempts, answers, anti-cheat logs, badges.

---

### Q9. How does JWT authentication work in your project?

**Answer:**  
1. User sends email + password to `POST /api/auth/login`.
2. Server verifies the password using **bcrypt** hash comparison.
3. If valid, server creates a **JWT token** containing `{ sub: user_id, role: user_role }`, signed with **HS256** algorithm, with a **60-minute expiry**.
4. Token is returned to the frontend and stored in `localStorage`.
5. Every subsequent API request includes the token in the `Authorization: Bearer <token>` header.
6. On the server, the `get_current_user` dependency decodes the token, extracts the user ID, and fetches the user from the database.
7. If the token is expired or invalid, the server returns **401 Unauthorized**, and the frontend redirects to `/login`.

---

### Q10. Why SQLite? Can it handle production load?

**Answer:**  
We chose SQLite for **development simplicity** — it's zero-config, file-based, and requires no external database server. For a small-to-medium deployment (up to ~100 concurrent users), SQLite works well.

For **production with 500+ concurrent users**, we would switch to **PostgreSQL** by simply changing the `DATABASE_URL` in the `.env` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/quiz_platform
```
Our SQLAlchemy ORM code **does not need any changes** — the same models work with PostgreSQL, MySQL, or any supported database.

---

## Section C: AI Integration Questions

---

### Q11. How does the AI generate questions?

**Answer:**  
1. Teacher provides a **topic**, **difficulty**, and **number of questions**.
2. We construct a **structured prompt** instructing Gemini to return a JSON array of MCQs with text, 4 options, correct answer, and explanation.
3. The prompt is sent to **Google Gemini API** (model: `gemini-2.5-flash`) using the `google-genai` SDK.
4. Gemini returns a text response containing a JSON array.
5. We **parse** the response using regex to extract the JSON array and `json.loads()` to deserialise it.
6. Each question is saved to the database with `is_ai_generated = True` and `is_approved = False`.
7. The teacher reviews and approves the questions before publishing.

---

### Q12. What happens if the Gemini API is unavailable or the API key is missing?

**Answer:**  
We have a **graceful fallback mechanism**. If the Gemini client cannot be initialised (no API key or network error), the `_generate_dummy_questions()` method generates **placeholder questions** with a message instructing the teacher to configure the API key. This ensures the system never crashes — it degrades gracefully.

---

### Q13. How do you handle AI response parsing errors?

**Answer:**  
Our `_parse_questions_from_response()` method uses a **multi-step parsing strategy**:
1. First, it uses **regex** (`\[\s*\{.*?\}\s*\]`) to extract a JSON array from the response text.
2. If that fails, it **strips markdown code fences** (` ```json ... ``` `) and tries `json.loads()` again.
3. If all parsing fails, it returns an **empty list**, and the system falls back to dummy questions.

This makes the system robust against varied Gemini response formats.

---

### Q14. What is the "explain mistake" feature?

**Answer:**  
When a student gets a wrong answer, they can click an "Explain" button. The system sends the question text, the student's wrong answer, and the correct answer to Gemini via `POST /api/ai/explain-mistake`. Gemini returns a **2–3 sentence explanation** covering:
1. Why the student's answer is incorrect
2. Why the correct answer is right
3. A helpful study tip

This provides **personalised, AI-driven feedback** for every single question.

---

## Section D: Database Questions

---

### Q15. How many tables are in your database? Explain the main ones.

**Answer:**  
There are **9 tables**:
1. **users** — Stores email, name, hashed password, role, XP, level, streak.
2. **quizzes** — Quiz metadata: title, subject, duration, difficulty, publish status.
3. **questions** — MCQs with 4 options, correct answer, explanation, difficulty, topic.
4. **quiz_attempts** — Records each student attempt with score, percentage, status.
5. **attempt_answers** — Each individual answer within an attempt.
6. **anticheat_logs** — Logs tab switches, fullscreen exits, copy attempts.
7. **badges** — Configurable achievement badges.
8. **student_badges** — Maps students to earned badges.
9. **daily_challenges** — Features a quiz-of-the-day.

---

### Q16. Explain the relationship between tables.

**Answer:**
- A **User (teacher)** creates many **Quizzes** → `quizzes.teacher_id → users.id`
- A **Quiz** contains many **Questions** → `questions.quiz_id → quizzes.id`
- A **Student** makes many **QuizAttempts** → `quiz_attempts.student_id → users.id`
- A **QuizAttempt** has many **AttemptAnswers** → `attempt_answers.attempt_id → quiz_attempts.id`
- A **Question** has many **AttemptAnswers** → `attempt_answers.question_id → questions.id`
- A **Student** earns many **Badges** → `student_badges.student_id → users.id`

---

## Section E: Security / Anti-Cheating Questions

---

### Q17. How do you prevent cheating?

**Answer:**  
We have an **anti-cheating module** that monitors:
1. **Tab switching** — If the student switches to another tab, the frontend detects it via the `visibilitychange` event and sends a log to the server.
2. **Fullscreen exit** — If the student exits fullscreen during a quiz, it's logged.
3. **Copy attempt** — If the student tries to copy question text, it's detected and logged.

Each event is stored in the `anticheat_logs` table with the attempt ID, student ID, event type, and timestamp. Teachers can review these logs when evaluating results.

---

### Q18. How do you store passwords?

**Answer:**  
Passwords are **never stored in plain text**. We use the **bcrypt** hashing algorithm via the `passlib` library. During registration, the password is hashed using `get_password_hash()` and stored as `password_hash`. During login, the entered password is verified using `verify_password()` which compares the plain text against the stored bcrypt hash. Even if the database is compromised, passwords cannot be reversed.

---

## Section F: Scalability & Concurrency Questions

---

### Q19. How can 500 concurrent users access the project?

**Answer:**  

This is a critical scalability question. Here's how our architecture supports 500+ concurrent users:

#### 1. FastAPI's Async Architecture
FastAPI runs on **Uvicorn (ASGI server)**, which is asynchronous and event-driven. Unlike traditional WSGI servers (Flask/Django), it doesn't block on I/O operations. A single Uvicorn process can handle **hundreds of concurrent connections** using Python's `asyncio`.

#### 2. Deploy with Multiple Workers
For production, we run Uvicorn with **multiple worker processes**:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
With 4 workers on a 4-core server, the system can handle **500–1,000 concurrent users** easily.

#### 3. Switch from SQLite to PostgreSQL
SQLite supports only **one writer at a time** (it uses file-level locking). For 500+ users, we switch to **PostgreSQL**, which supports **thousands of concurrent connections** with row-level locking. The change requires only updating one environment variable:
```
DATABASE_URL=postgresql://user:password@localhost:5432/quiz_platform
```
No code changes needed — SQLAlchemy ORM handles the abstraction.

#### 4. Connection Pooling
SQLAlchemy automatically manages a **connection pool**. For PostgreSQL, we configure:
```python
engine = create_engine(DATABASE_URL, pool_size=20, max_overflow=10)
```
This maintains 20 persistent connections and allows 10 overflow connections, efficiently handling concurrent database access.

#### 5. Stateless JWT Authentication
Our JWT-based authentication is **stateless** — the server doesn't store sessions. Each request carries its own token. This means any worker/server can handle any request, making **horizontal scaling** trivial.

#### 6. Frontend is Static (CDN-Ready)
The React frontend is a **static build** (HTML/JS/CSS). In production:
```bash
npm run build
```
The output can be served via **Nginx** or **a CDN (Cloudflare, AWS CloudFront)**. Static assets scale infinitely — they don't hit the backend.

#### 7. Load Balancer (For Higher Scale)
For 1,000+ users, we add a **reverse proxy / load balancer** (Nginx) in front of multiple backend instances:
```
  Client Requests
        │
        ▼
   ┌──────────┐
   │  Nginx   │  (Load Balancer)
   │  (Reverse│
   │   Proxy) │
   └────┬─────┘
        │
   ┌────┼────────────┐
   ▼    ▼            ▼
Server1  Server2   Server3
(Uvicorn)(Uvicorn) (Uvicorn)
   │      │          │
   └──────┼──────────┘
          ▼
     PostgreSQL
     (Shared DB)
```

#### 8. Caching (Optional Enhancement)
For read-heavy operations (leaderboard, quiz lists), we can add **Redis caching** to reduce database load:
- Cache leaderboard for 60 seconds
- Cache published quiz list for 30 seconds

#### Summary: Deployment for 500 Users

| Component | Development | Production (500 users) |
|-----------|------------|------------------------|
| Backend | `uvicorn main:app --reload` | `uvicorn main:app --workers 4` |
| Database | SQLite (file) | PostgreSQL (server) |
| Frontend | `npm run dev` (Vite) | `npm run build` → Nginx/CDN |
| Auth | JWT (same) | JWT (same, stateless) |
| Server | Localhost | Cloud VM (AWS/GCP/Azure) |
| Connections | Single user | Connection pool (20+10) |

---

### Q20. Have you done any load testing?

**Answer:**  
Yes, we have a `load_test.py` file in the backend that can simulate concurrent users. We can use tools like **Locust** or **Apache JMeter** to send hundreds of simultaneous requests to endpoints like `/api/quizzes/`, `/api/attempts/start`, and `/api/attempts/submit` to measure response times, throughput, and error rates under load.

---

## Section G: Feature-Specific Questions

---

### Q21. How does the quiz attempt system work?

**Answer:**  
1. Student clicks "Start Quiz" → `POST /api/attempts/start` creates a `QuizAttempt` with status `in_progress`.
2. Frontend fetches questions (without correct answers) → `GET /api/attempts/{id}/questions`.
3. A timer starts based on `duration_minutes`.
4. Each answer is **auto-saved** to the server → `POST /api/attempts/save-answer`.
5. On submit → `POST /api/attempts/submit`:
   - Server compares each answer against `correct_option`
   - Calculates score, applies negative marking if enabled
   - Computes percentage and performance category
   - Awards XP via GamificationService
6. Student views detailed results → `GET /api/attempts/{id}/result`.

---

### Q22. What is the gamification system?

**Answer:**  
- **XP (Experience Points)** — Awarded on every quiz submission based on correct answers and overall percentage.
- **Levels** — Students level up as they accumulate XP.
- **Streaks** — Consecutive days of activity are tracked.
- **Badges** — Configurable achievements: e.g., "Complete 5 quizzes", "Score 100%", "7-day streak".
- **Leaderboard** — All students are ranked by XP. Top 5 are displayed on the dashboard.

---

### Q23. How does negative marking work?

**Answer:**  
When a teacher creates a quiz, they can enable **negative marking** and set a `negative_marks_value` (default: 0.25). During evaluation:
- Correct answer → `score += question.marks` (default 1.0)
- Wrong answer → `score -= quiz.negative_marks_value` (e.g., 0.25)
- Unattempted → no change

The final percentage is capped at a minimum of **0%** (it cannot go negative).

---

### Q24. How does PDF-based question generation work?

**Answer:**  
1. Teacher uploads a PDF file via `POST /api/ai/generate-from-pdf`.
2. Server validates it's a `.pdf` file.
3. **PyPDF2** reads the PDF bytes and extracts text from every page.
4. The text is **truncated to 4,000 characters** (to stay within Gemini's token limits).
5. The extracted text is passed as `content` to the same AI generation pipeline.
6. Gemini generates MCQs based on the actual content of the PDF.
7. Questions are saved with `is_ai_generated = True`.

---

### Q25. What is the question bank and approval workflow?

**Answer:**  
- Questions can exist **without a quiz** (`quiz_id = NULL`), forming a reusable question bank.
- AI-generated questions are saved with `is_approved = False`.
- Teachers review them in the Question Bank UI and approve or reject each question.
- Only **approved questions** (`is_approved = True`) are served to students during a quiz attempt.
- This ensures quality control over AI-generated content.

---

## Section H: Advanced / Edge-Case Questions

---

### Q26. What happens if a student loses internet during a quiz?

**Answer:**  
Each answer is **auto-saved individually** via `/api/attempts/save-answer`. So if the student has answered 15 out of 20 questions and loses connection, those 15 answers are already persisted on the server. When they reconnect, the system checks for an existing `in_progress` attempt and allows them to resume from where they left off.

---

### Q27. Can a student attempt a quiz multiple times?

**Answer:**  
The teacher configures `max_attempts` per quiz (default: 1). Before starting a new attempt, the system checks:
```python
existing = db.query(QuizAttempt).filter(
    quiz_id == quiz_id,
    student_id == student.id,
    status == "submitted"
).count()
if existing >= quiz.max_attempts:
    raise HTTPException(400, "Maximum attempts reached")
```
If the limit is reached, the student receives an error. The teacher can set this to any value (e.g., 3 attempts for practice quizzes, 1 for exams).

---

### Q28. How do you ensure questions are not repeated in the same order?

**Answer:**  
Each quiz has `randomize_questions` and `randomize_options` flags (both default `True`). When a student fetches questions:
```python
if quiz.randomize_questions:
    random.shuffle(questions)
```
This means every student sees questions in a **different order**, reducing the chance of copying. Option randomisation can be similarly implemented.

---

### Q29. What if two students submit at the exact same time?

**Answer:**  
Each attempt is **independent** — every student has their own `QuizAttempt` record with a separate `attempt_id`. Submissions are processed per-attempt, so two students submitting simultaneously are handled by **separate database transactions**. With PostgreSQL's row-level locking, there is **no conflict or data corruption**.

---

### Q30. What are the limitations of your project?

**Answer:**  
1. **SQLite** in development limits concurrent write operations (production needs PostgreSQL).
2. **AI dependency** — If Gemini API is down, the system falls back to dummy questions.
3. **No webcam proctoring** — Anti-cheat is limited to browser events, not visual monitoring.
4. **No real-time multiplayer** — Quizzes are individual, not live-competitive.
5. **No offline support** — Students need an active internet connection.
6. **Token limit** — PDF extraction is truncated to 4,000 characters, so very long documents may lose content.

---

### Q31. What is the future scope?

**Answer:**  
1. **Adaptive quizzes** — Dynamically adjust difficulty based on real-time student performance.
2. **Webcam proctoring** — Facial recognition and eye-tracking for high-stakes exams.
3. **Mobile app** — Native Android/iOS application with offline quiz support.
4. **Multi-language** — Generate questions in Hindi, Marathi, and other regional languages.
5. **LMS integration** — Connect with Google Classroom, Moodle, or Canvas.
6. **Advanced analytics** — AI-predicted performance trajectories and personalised study plans.
7. **Real-time competitive quizzes** — WebSocket-based live quiz battles.

---

*Prepared for MCA viva preparation. All answers are based on the actual project implementation.*
