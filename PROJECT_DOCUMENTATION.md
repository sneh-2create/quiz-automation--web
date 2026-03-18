# Quiz Automation Platform

## AI-Based Question Generation and Quiz Management System

### PROJECT DOCUMENTATION

**Academic Year:** 2025–2026  
**Course:** Master of Computer Applications (MCA)  
**Technology Stack:** React.js · Python (FastAPI) · SQLite · Google Gemini AI

---

## Table of Contents

1. [Project Synopsis](#1-project-synopsis)
2. [System Overview](#2-system-overview)
3. [Detailed System Walkthrough](#3-detailed-system-walkthrough)
4. [AI Integration](#4-ai-integration)
5. [Data Flow Explanation](#5-data-flow-explanation)
6. [Database Design](#6-database-design)
7. [System Architecture](#7-system-architecture)
8. [Key Features](#8-key-features)
9. [Conclusion](#9-conclusion)

---

## 1. Project Synopsis

### 1.1 Title

**Quiz Automation Platform – AI-Based Question Generation and Quiz Management System**

### 1.2 Objective

To design and develop an intelligent, web-based quiz automation platform that leverages Google Gemini AI to automatically generate high-quality multiple-choice questions (MCQs), enables teachers to efficiently manage quizzes and question banks, and provides students with a seamless, gamified assessment experience complete with instant evaluation, detailed feedback, and performance analytics.

### 1.3 Problem Statement

Traditional quiz creation in academic institutions is a labour-intensive process. Educators must manually draft questions, frame multiple options, write explanations, and organise quizzes across multiple difficulty levels and topics. This process is:

- **Time-consuming** – Creating even a modest 20-question quiz can take several hours.
- **Error-prone** – Manual compilation may include duplicate or poorly framed questions.
- **Lacking personalisation** – Static quizzes do not adapt to individual student strengths and weaknesses.
- **Difficult to analyse** – Paper-based or basic digital quizzes offer limited insight into per-topic performance, accuracy trends, or cohort-level analytics.

There is a clear need for an automated, AI-driven system that can generate, manage, and evaluate quizzes while providing actionable learning analytics.

### 1.4 Proposed Solution

The Quiz Automation Platform addresses these challenges through:

1. **AI-Powered Question Generation** – Teachers provide a topic, subject, difficulty level, or upload a PDF document. The Google Gemini API generates contextually accurate MCQs with four options, a correct answer, and a detailed explanation.
2. **Automated Evaluation Engine** – Student submissions are evaluated instantly. Scores, percentages, correct/wrong/unattempted counts, and performance categories (Smart, Good, Average, Weak, Poor) are computed in real time.
3. **Learning Analytics Dashboard** – Both teachers and students have access to rich analytics: topic-wise accuracy, performance trends over time, score distributions, and per-question success rates.
4. **Gamification Layer** – Experience points (XP), levels, streak tracking, and a badge system motivate students and encourage consistent participation.
5. **Anti-Cheating Module** – Tab-switch detection, fullscreen-exit monitoring, and copy-attempt logging deter unfair practices during live quizzes.

### 1.5 Technologies Used

| Layer              | Technology                         |
|--------------------|------------------------------------|
| Frontend           | React.js (Vite), Framer Motion     |
| HTTP Client        | Axios                              |
| Backend Framework  | Python 3 – FastAPI                 |
| ORM / Database     | SQLAlchemy – SQLite                |
| Authentication     | JWT (python-jose), bcrypt, OAuth2  |
| AI Engine          | Google Gemini API (google-genai)   |
| PDF Processing     | PyPDF2                             |
| Styling            | Tailwind CSS                       |
| API Documentation  | Swagger UI (auto-generated)        |

### 1.6 Key Features

1. AI-generated MCQs from topic, pasted content, or uploaded PDF.
2. Role-based access control (Teacher / Student).
3. Real-time quiz attempt with auto-save and timer.
4. Instant evaluation with score, percentage, and performance category.
5. AI-powered mistake explanations for wrong answers.
6. Question bank management with approval workflow.
7. Negative marking support (configurable per quiz).
8. Question and option randomisation.
9. Gamification – XP, levels, streaks, badges.
10. Anti-cheating – tab switch, fullscreen exit, copy detection.
11. Student analytics – topic-wise accuracy, performance trends.
12. Teacher analytics – score distribution, per-question stats, leaderboard.
13. Bulk question import via Excel/CSV.
14. Live quiz dashboard with a pulsing "LIVE" indicator.
15. Global leaderboard ranked by XP.

### 1.7 Advantages

- **Time Efficiency** – AI generates quiz content in seconds, not hours.
- **Consistency** – Uniform question quality and formatting.
- **Scalability** – Supports unlimited quizzes, questions, and concurrent students.
- **Transparency** – Immediate, bias-free evaluation with explanations.
- **Data-Driven Teaching** – Analytics help teachers identify weak topics at both individual and cohort levels.
- **Student Engagement** – Gamification drives regular participation.
- **Academic Integrity** – Built-in anti-cheat logging and monitoring.

---

## 2. System Overview

### 2.1 High-Level Explanation

The Quiz Automation Platform is a client-server web application. The React.js frontend communicates with a FastAPI backend via RESTful APIs. Teachers interact with the system to create quizzes—either manually or with AI assistance—and students attempt those quizzes through a timed, interactive interface. All data is persisted in a SQLite database managed by SQLAlchemy ORM. The Google Gemini API serves as the intelligence layer for question generation and mistake explanation.

### 2.2 User Roles

| Role        | Capabilities                                                                                                 |
|-------------|--------------------------------------------------------------------------------------------------------------|
| **Teacher** | Create/edit/delete quizzes, generate AI questions, manage question bank, publish/unpublish quizzes, view quiz analytics, view leaderboard. |
| **Student** | Browse live quizzes, attempt quizzes, view instant results with explanations, track performance analytics, earn XP/badges, view leaderboard. |

### 2.3 Core Modules

#### Module 1: Authentication & Authorisation

- User registration with role selection (teacher or student).
- Login via email and password; server returns a JWT access token.
- Token-based route protection: every API call includes the JWT in the `Authorization` header.
- Role-based middleware (`get_teacher`, `get_current_user`) restricts endpoints.

#### Module 2: Quiz Management

- Teachers create quizzes with title, subject, topic, duration, difficulty, pass percentage, negative marking settings, and attempt limits.
- Quizzes support question and option randomisation.
- Publish/unpublish toggle controls student visibility.

#### Module 3: AI-Based Question Generation

- **Topic-based generation** – Teacher enters a topic and difficulty; Gemini generates MCQs.
- **Content-based generation** – Teacher pastes text content; Gemini extracts MCQs from it.
- **PDF-based generation** – Teacher uploads a PDF; text is extracted via PyPDF2, then sent to Gemini.
- Generated questions are saved to the database with `is_ai_generated = True` and `is_approved = False`, requiring teacher review.

#### Module 4: Quiz Attempt System

- Student starts an attempt; a `QuizAttempt` record is created with status `in_progress`.
- Questions are served without the correct answer (using `QuestionOutNoAnswer` schema).
- Each answer is saved individually via the `/save-answer` endpoint.
- On submission, the system evaluates all answers, calculates score, percentage, and performance category, and awards XP.

#### Module 5: Evaluation & Feedback

- Instant score computation with correct/wrong/unattempted breakdown.
- Negative marking applied when enabled.
- Performance categorisation: Smart (≥90%), Good (≥75%), Average (≥60%), Weak (≥40%), Poor (<40%).
- AI-powered mistake explanations via the `/ai/explain-mistake` endpoint.

#### Module 6: Analytics & Reporting

- **Student analytics:** total attempts, average and best percentages, accuracy, topic-wise analysis (Strong/Weak), performance trend (last 10 attempts).
- **Teacher analytics per quiz:** total attempts, average/highest/lowest scores, pass rate, score distribution (5 bins), per-question success rate, student leaderboard.
- **Teacher overview:** total quizzes, published count, total attempts across all quizzes.

#### Module 7: Gamification

- XP awarded on quiz submission (based on correct answers and percentage).
- Level progression system.
- Streak tracking (consecutive-day participation).
- Badge system with configurable conditions (quiz count, perfect score, streak milestones).

#### Module 8: Anti-Cheating

- Logs suspicious events: `tab_switch`, `fullscreen_exit`, `copy_attempt`.
- Each event is persisted in the `anticheat_logs` table with a warning counter.
- Frontend detects events and sends them to `/attempts/anticheat`.

---

## 3. Detailed System Walkthrough

### 3.1 Teacher Flow

```
Step 1 → Register / Login
         │  POST /api/auth/register  (full_name, email, password, role="teacher")
         │  POST /api/auth/login     → JWT Token returned
         ▼
Step 2 → Teacher Dashboard
         │  Dashboard shows: total quizzes, published quizzes, total attempts.
         │  GET /api/analytics/teacher/overview
         ▼
Step 3 → Create a New Quiz
         │  POST /api/quizzes/
         │  Fields: title, subject, topic, duration_minutes, difficulty,
         │          negative_marking, pass_percentage, max_attempts.
         ▼
Step 4 → Add Questions (Choose One Path)
         │
         ├── (A) Manual Entry
         │       POST /api/questions/  with text, options, correct_option.
         │
         ├── (B) AI – Topic-Based
         │       POST /api/ai/generate-questions
         │       Body: { topic, subject, difficulty, num_questions, quiz_id }
         │       → Gemini API generates MCQs → saved to DB (is_approved=False).
         │
         ├── (C) AI – Content-Based
         │       POST /api/ai/generate-from-content
         │       Body: { content (pasted text), topic, difficulty, num_questions }
         │
         ├── (D) AI – PDF Upload
         │       POST /api/ai/generate-from-pdf
         │       Multipart form: PDF file + difficulty, num_questions.
         │       → PyPDF2 extracts text → sent to Gemini.
         │
         └── (E) Bulk Import
                 POST /api/questions/bulk-import
                 Multipart form: Excel/CSV file.
         ▼
Step 5 → Review & Approve AI Questions
         │  Teacher reviews generated questions in the Question Bank.
         │  PATCH /api/questions/{id} → { is_approved: true }
         ▼
Step 6 → Publish Quiz
         │  POST /api/quizzes/{quiz_id}/publish  → toggles is_published.
         │  Quiz becomes visible to students on the "Live Quizzes" feed.
         ▼
Step 7 → Monitor Results
         │  GET /api/analytics/teacher/quiz/{quiz_id}
         │  → Score distribution, per-question stats, student leaderboard.
```

### 3.2 Student Flow

```
Step 1 → Register / Login
         │  POST /api/auth/register  (role="student")
         │  POST /api/auth/login     → JWT Token returned
         ▼
Step 2 → Student Dashboard
         │  Displays: XP, level, streak, stats, live quizzes, leaderboard.
         │  GET /api/quizzes/?published_only=true
         │  GET /api/users/leaderboard
         │  GET /api/attempts/my-history
         ▼
Step 3 → Browse Live Quizzes
         │  Student sees published quizzes with title, subject, difficulty,
         │  duration, and a "LIVE" badge indicator.
         ▼
Step 4 → Start Quiz Attempt
         │  POST /api/attempts/start?quiz_id={id}
         │  → Returns attempt_id, duration, total_questions.
         │  Timer begins on the frontend.
         ▼
Step 5 → Answer Questions
         │  GET /api/attempts/{attempt_id}/questions
         │  → Questions served WITHOUT correct answers.
         │  Student selects an option → POST /api/attempts/save-answer
         │  → Server saves answer, returns instant feedback.
         ▼
Step 6 → Submit Attempt
         │  POST /api/attempts/submit  { attempt_id }
         │  → Server evaluates all answers:
         │     • Computes score, percentage, correct/wrong/unattempted.
         │     • Applies negative marking if enabled.
         │     • Awards XP via GamificationService.
         │     • Returns performance_category.
         ▼
Step 7 → View Results
         │  GET /api/attempts/{attempt_id}/result
         │  → Detailed breakdown: per-question result, explanations.
         │  Student can request AI explanation for wrong answers:
         │     POST /api/ai/explain-mistake
         ▼
Step 8 → View Analytics
         │  GET /api/analytics/student/me
         │  → Topic-wise accuracy, strong/weak topics, performance trend.
```

---

## 4. AI Integration

### 4.1 Overview

The system uses the **Google Gemini API** (model: `gemini-2.5-flash`) via the `google-genai` Python SDK. AI capabilities are encapsulated in the `AIService` class (`app/services/ai_service.py`).

### 4.2 AI Service Architecture

```
┌──────────────────────────────────────────────────┐
│                    AIService                     │
├──────────────────────────────────────────────────┤
│  _get_client()          → Initialises Gemini     │
│  generate_questions()   → Topic-based MCQs       │
│  generate_from_content()→ Content-based MCQs      │
│  extract_pdf_text()     → PDF → plain text       │
│  explain_mistake()      → Wrong answer feedback  │
│  _parse_questions_from_response()  → JSON parse  │
│  _save_questions_data() → Persist to DB          │
│  _generate_dummy_questions() → Fallback          │
└──────────────────────────────────────────────────┘
```

### 4.3 Question Generation Flow

```
Teacher Input (topic / content / PDF)
        │
        ▼
 Construct Prompt ──────────────────────────────────────┐
   "Generate N MCQs about {topic}, difficulty: {level}" │
   "Return JSON array with text, options, correct,      │
    explanation, difficulty, topic."                     │
        │                                                │
        ▼                                                │
 Send to Gemini API ◄──────────────────────────────────┘
   client.models.generate_content(
       model='gemini-2.5-flash',
       contents=prompt
   )
        │
        ▼
 Receive Raw Response (text)
        │
        ▼
 Parse JSON ──────────────────────────────────────────────┐
   1. Regex: extract JSON array from response text.       │
   2. Strip markdown code fences (```json ... ```).       │
   3. json.loads() → List[dict]                           │
   4. If parsing fails → fallback dummy questions.        │
        │                                                  │
        ▼                                                  │
 Save to Database ◄──────────────────────────────────────┘
   For each question dict:
     → Create Question ORM object
     → Set is_ai_generated = True
     → Set is_approved = False
     → Link to quiz_id (optional)
     → Link to teacher_id (created_by)
   db.commit()
        │
        ▼
 Return Saved Questions (JSON response to frontend)
```

### 4.4 Mistake Explanation Flow

```
Student views wrong answer
        │
        ▼
 POST /api/ai/explain-mistake
   Body: question_text, correct_option, correct_answer_text,
         student_selected, student_answer_text
        │
        ▼
 Prompt to Gemini:
   "A student answered incorrectly.
    Question: ...
    Student selected: (b) ...
    Correct answer: (a) ...
    Explain in 2–3 sentences: why wrong, why right, study tip."
        │
        ▼
 Return AI explanation string → displayed in Result Page
```

### 4.5 PDF Processing

When a teacher uploads a PDF:

1. The file is read as bytes on the server.
2. `PyPDF2.PdfReader` extracts text from each page.
3. Extracted text is truncated to 4,000 characters (Gemini token limit safeguard).
4. The text is passed to `generate_from_content()` as content, following the same prompt → response → parse → save pipeline.

---

## 5. Data Flow Explanation

### 5.1 Frontend → Backend → Database

```
React Frontend (Vite, port 5173)
        │
        │  Axios HTTP requests (JSON / multipart)
        │  Authorization: Bearer <JWT>
        ▼
FastAPI Backend (Uvicorn, port 8000)
        │
        │  Pydantic schema validation
        │  Dependency injection (get_db, get_current_user)
        ▼
SQLAlchemy ORM
        │
        │  SQL queries
        ▼
SQLite Database (quiz_platform.db)
```

### 5.2 API Request / Response Lifecycle

1. **Client** constructs a request using the Axios instance (`api/client.js`).
2. **Interceptor** attaches the JWT token from `localStorage` to `Authorization` header.
3. **FastAPI** receives the request; the router directs it to the appropriate endpoint.
4. **Dependency injection** resolves `get_db` (database session) and `get_current_user` (JWT decode → User lookup).
5. **Business logic** executes (query/insert/update via SQLAlchemy).
6. **Pydantic** serialises the response model.
7. **Client** receives JSON; React state updates trigger UI re-render.
8. On **401 Unauthorized**, the response interceptor clears tokens and redirects to `/login`.

### 5.3 Quiz Generation Flow (Detailed)

```
Teacher fills form (topic, difficulty, num_questions)
        │
        ▼
POST /api/ai/generate-questions ──── JWT verified ───► get_teacher()
        │
        ▼
AIService.generate_questions()
        │
        ├── Gemini API available? ──── YES ──► Send prompt → Parse JSON
        │                              NO  ──► Generate dummy questions
        │
        ▼
_save_questions_data() → INSERT INTO questions (...) → COMMIT
        │
        ▼
Return { generated: N, questions: [...] } → 200 OK
```

### 5.4 Answer Evaluation Flow

```
Student clicks "Submit Quiz"
        │
        ▼
POST /api/attempts/submit { attempt_id }
        │
        ▼
Load all Questions for the quiz (is_approved = True)
Load all AttemptAnswers for this attempt
        │
        ▼
For each question:
   ├── No answer saved? → unattempted_count++
   ├── Answer matches correct_option? → score += marks, correct_count++
   └── Answer incorrect?
         ├── wrong_count++
         └── negative_marking enabled? → score -= negative_marks_value
        │
        ▼
Calculate: percentage = (score / total_marks) × 100
Determine: performance_category (Smart/Good/Average/Weak/Poor)
        │
        ▼
GamificationService.award_xp(student, correct_count, percentage)
GamificationService.check_and_award_badges(student)
        │
        ▼
UPDATE quiz_attempts SET status='submitted', score, percentage, ...
COMMIT
        │
        ▼
Return result JSON with xp_earned, performance_category, passed
```

### 5.5 Authentication Flow (JWT)

```
POST /api/auth/login { email, password }
        │
        ▼
Verify password (bcrypt hash comparison)
        │
        ├── Invalid? → 401 "Invalid email or password"
        │
        ▼
create_access_token({ sub: user_id, role: user_role })
   │  Algorithm: HS256
   │  Expiry: 60 minutes
   ▼
Return { access_token, user: { id, email, full_name, role, ... } }
        │
        ▼
Frontend stores token in localStorage
Every subsequent request includes:
   Authorization: Bearer <token>
        │
        ▼
get_current_user dependency:
   Decode token → extract user_id → query User from DB
   Token expired or invalid → 401 → frontend redirects to /login
```

### 5.6 Data Flow Diagrams

#### DFD Level 0 (Context Diagram)

```
                          ┌───────────────────────┐
   ┌─────────┐            │                       │           ┌──────────┐
   │ Teacher │───────────►│   Quiz Automation     │◄──────────│ Student  │
   │         │◄───────────│     Platform          │──────────►│          │
   └─────────┘            │                       │           └──────────┘
                          │                       │
                          └───────────┬───────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  Google Gemini AI API  │
                          └───────────────────────┘
```

**Description:**

- **Teacher** sends quiz configuration, content, or PDF → System generates questions and returns quiz data.
- **Student** requests available quizzes, submits answers → System returns evaluation results and analytics.
- **Google Gemini AI API** receives prompts from the system → returns generated MCQs and mistake explanations.

#### DFD Level 1 (Detailed)

```
┌──────────┐                                              ┌──────────┐
│ Teacher  │                                              │ Student  │
└────┬─────┘                                              └────┬─────┘
     │                                                         │
     │  1.0 Register/Login                                     │  1.0 Register/Login
     ├────────────► ┌──────────────┐ ◄─────────────────────────┤
     │              │ 1.0 Auth     │                           │
     │              │   Module     │                           │
     │              └──────┬───────┘                           │
     │                     │ JWT Token                         │
     │                     ▼                                   │
     │  2.0 Create Quiz  ┌──────────────┐                     │
     ├───────────────────►│ 2.0 Quiz     │                     │
     │                    │  Management  │                     │
     │                    └──────┬───────┘                     │
     │                           │                             │
     │  3.0 Generate Questions  ┌▼─────────────┐              │
     ├─────────────────────────►│ 3.0 AI       │              │
     │                          │  Engine      │              │
     │                          │  (Gemini)    │              │
     │                          └──────┬───────┘              │
     │                                 │ Questions            │
     │                                 ▼                      │
     │                          ┌──────────────┐              │
     │                          │    D1        │              │
     │                          │  DATABASE    │              │
     │                          │ (SQLite)     │              │
     │                          └──────┬───────┘              │
     │                                 │                      │
     │                                 │  4.0 Attempt Quiz    │
     │                                 ├──────────────────────┤
     │                                 │                      │
     │                          ┌──────▼───────┐              │
     │                          │ 4.0 Attempt  │◄─────────────┤
     │                          │   & Evaluate │──────────────┤
     │                          └──────┬───────┘   Results    │
     │                                 │                      │
     │  5.0 View Analytics      ┌──────▼───────┐             │
     ├─────────────────────────►│ 5.0 Analytics│◄────────────┤
     │◄─────────────────────────│   Module     │─────────────►│
     │   Reports & Stats        └──────────────┘  Trends      │
```

**Process Descriptions:**

| Process | Description |
|---------|-------------|
| 1.0 Auth Module | Handles registration, login, JWT generation and validation. |
| 2.0 Quiz Management | CRUD operations for quizzes; publish/unpublish control. |
| 3.0 AI Engine | Interfaces with Google Gemini API; generates, parses, and stores questions. |
| 4.0 Attempt & Evaluate | Manages quiz attempts; saves answers; evaluates on submission; awards XP. |
| 5.0 Analytics Module | Aggregates performance data for students and teachers. |

---

## 6. Database Design

### 6.1 Entity-Relationship Overview

The system uses **SQLite** as the relational database, accessed through **SQLAlchemy ORM**. The schema consists of seven primary tables and two gamification tables.

### 6.2 Table Definitions

#### Table: `users`

| Column         | Type      | Constraints              | Description                    |
|---------------|-----------|--------------------------|--------------------------------|
| id            | Integer   | PK, Auto-increment       | Unique user identifier         |
| email         | String    | Unique, Not Null, Indexed | User email address             |
| full_name     | String    | Not Null                 | Display name                   |
| password_hash | String    | Not Null                 | Bcrypt-hashed password         |
| role          | Enum      | Not Null (teacher/student)| User role                     |
| is_active     | Boolean   | Default: True            | Account active status          |
| is_approved   | Boolean   | Default: True            | Account approval status        |
| avatar_url    | String    | Nullable                 | Profile image URL              |
| xp_points     | Integer   | Default: 0               | Experience points              |
| level         | Integer   | Default: 1               | Current level                  |
| streak_days   | Integer   | Default: 0               | Consecutive active days        |
| created_at    | DateTime  | Auto                     | Registration timestamp         |
| updated_at    | DateTime  | Auto (on update)         | Last modification timestamp    |

#### Table: `quizzes`

| Column               | Type      | Constraints           | Description                     |
|----------------------|-----------|----------------------|---------------------------------|
| id                   | Integer   | PK                   | Unique quiz identifier          |
| title                | String    | Not Null             | Quiz title                      |
| description          | Text      | Nullable             | Quiz description                |
| teacher_id           | Integer   | FK → users.id        | Creator teacher                 |
| subject              | String    | Nullable             | Subject area                    |
| topic                | String    | Nullable             | Specific topic                  |
| duration_minutes     | Integer   | Default: 30          | Time limit in minutes           |
| difficulty           | Enum      | Default: medium      | easy / medium / hard            |
| negative_marking     | Boolean   | Default: False       | Enable negative marking         |
| negative_marks_value | Float     | Default: 0.25        | Deduction per wrong answer      |
| is_published         | Boolean   | Default: False       | Visibility to students          |
| randomize_questions  | Boolean   | Default: True        | Shuffle question order          |
| randomize_options    | Boolean   | Default: True        | Shuffle option order            |
| pass_percentage      | Float     | Default: 40.0        | Minimum passing percentage      |
| max_attempts         | Integer   | Default: 1           | Maximum allowed attempts        |
| created_at           | DateTime  | Auto                 | Creation timestamp              |
| updated_at           | DateTime  | Auto (on update)     | Last update timestamp           |

#### Table: `questions`

| Column          | Type      | Constraints           | Description                      |
|----------------|-----------|----------------------|----------------------------------|
| id             | Integer   | PK                   | Unique question identifier       |
| quiz_id        | Integer   | FK → quizzes.id, Nullable | Linked quiz (null = bank only)|
| text           | Text      | Not Null             | Question text                    |
| option_a       | String    | Not Null             | Option A text                    |
| option_b       | String    | Not Null             | Option B text                    |
| option_c       | String    | Not Null             | Option C text                    |
| option_d       | String    | Not Null             | Option D text                    |
| correct_option | String    | Not Null             | Correct option ("a"/"b"/"c"/"d") |
| explanation    | Text      | Nullable             | Answer explanation               |
| difficulty     | String    | Default: "medium"    | Difficulty level                 |
| topic          | String    | Nullable             | Question topic                   |
| subject        | String    | Nullable             | Subject area                     |
| marks          | Float     | Default: 1.0         | Marks for correct answer         |
| is_ai_generated| Boolean   | Default: False       | Generated by Gemini AI           |
| is_approved    | Boolean   | Default: True        | Approved for use in quizzes      |
| created_by     | Integer   | FK → users.id        | Teacher who created/generated    |
| approved_by    | Integer   | FK → users.id        | Teacher who approved             |
| created_at     | DateTime  | Auto                 | Creation timestamp               |

#### Table: `quiz_attempts`

| Column              | Type     | Constraints        | Description                |
|--------------------|----------|--------------------|----------------------------|
| id                 | Integer  | PK                 | Unique attempt identifier  |
| quiz_id            | Integer  | FK → quizzes.id    | Attempted quiz             |
| student_id         | Integer  | FK → users.id      | Student who attempted      |
| status             | String   | Default: "in_progress" | in_progress / submitted / timed_out |
| score              | Float    | Nullable           | Achieved score             |
| total_marks        | Float    | Nullable           | Maximum possible marks     |
| percentage         | Float    | Nullable           | Score percentage           |
| correct_count      | Integer  | Default: 0         | Number correct             |
| wrong_count        | Integer  | Default: 0         | Number wrong               |
| unattempted_count  | Integer  | Default: 0         | Number unattempted         |
| time_taken_seconds | Integer  | Nullable           | Total time in seconds      |
| started_at         | DateTime | Auto               | Attempt start time         |
| submitted_at       | DateTime | Nullable           | Submission time            |

#### Table: `attempt_answers`

| Column            | Type    | Constraints              | Description              |
|------------------|---------|--------------------------|--------------------------|
| id               | Integer | PK                       | Unique answer identifier |
| attempt_id       | Integer | FK → quiz_attempts.id    | Parent attempt           |
| question_id      | Integer | FK → questions.id        | Answered question        |
| selected_option  | String  | Nullable                 | Student's selection      |
| is_correct       | Boolean | Nullable                 | Correctness flag         |
| marks_awarded    | Float   | Default: 0.0             | Marks given/deducted     |
| time_taken_seconds| Integer| Default: 0               | Time on this question    |

#### Table: `anticheat_logs`

| Column        | Type     | Constraints              | Description                 |
|--------------|----------|--------------------------|-----------------------------|
| id           | Integer  | PK                       | Log identifier              |
| attempt_id   | Integer  | FK → quiz_attempts.id    | Related attempt             |
| student_id   | Integer  | FK → users.id            | Flagged student             |
| event_type   | String   | Not Null                 | tab_switch / fullscreen_exit / copy_attempt |
| details      | String   | Nullable                 | Additional information      |
| timestamp    | DateTime | Auto                     | Event time                  |
| warning_count| Integer  | Default: 1               | Cumulative warnings         |

#### Table: `badges`

| Column          | Type    | Constraints    | Description                    |
|----------------|---------|----------------|--------------------------------|
| id             | Integer | PK             | Badge identifier               |
| name           | String  | Unique         | Badge name                     |
| description    | String  | Not Null       | Badge description              |
| icon           | String  | Default: "🏆"  | Display icon                   |
| xp_required    | Integer | Default: 0     | XP needed to earn              |
| condition_type | String  | Nullable       | quiz_count / perfect_score / streak |
| condition_value| Integer | Default: 0     | Threshold value                |

#### Table: `student_badges`

| Column     | Type     | Constraints        | Description         |
|-----------|----------|--------------------|---------------------|
| id        | Integer  | PK                 | Record identifier   |
| student_id| Integer  | FK → users.id      | Student             |
| badge_id  | Integer  | FK → badges.id     | Earned badge        |
| earned_at | DateTime | Auto               | Date earned         |

#### Table: `daily_challenges`

| Column   | Type    | Constraints        | Description            |
|---------|---------|--------------------|------------------------|
| id      | Integer | PK                 | Challenge identifier   |
| quiz_id | Integer | FK → quizzes.id    | Featured quiz          |
| date    | String  | Not Null           | Challenge date (YYYY-MM-DD) |
| is_active| Boolean| Default: True      | Active status          |

### 6.3 Relationships

```
users (1) ──────── (N) quizzes          Teacher creates many quizzes
users (1) ──────── (N) quiz_attempts    Student makes many attempts
quizzes (1) ────── (N) questions        Quiz contains many questions
quizzes (1) ────── (N) quiz_attempts    Quiz has many attempts
quiz_attempts (1) ─ (N) attempt_answers Attempt has many answers
questions (1) ──── (N) attempt_answers  Question has many answers
users (1) ──────── (N) student_badges   Student earns many badges
badges (1) ────── (N) student_badges    Badge earned by many students
quizzes (1) ────── (N) daily_challenges Quiz featured in challenges
users (1) ──────── (N) anticheat_logs   Student triggers many events
quiz_attempts (1) ─ (N) anticheat_logs  Attempt has many cheat logs
```

---

## 7. System Architecture

### 7.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                         │
│          React.js (Vite) + Tailwind CSS + Framer Motion        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Auth Pages │ │ Teacher    │ │ Student    │ │ Components  │ │
│  │ Login      │ │ Dashboard  │ │ Dashboard  │ │ Sidebar     │ │
│  │ Register   │ │ CreateQuiz │ │ QuizAttempt│ │ StatCard    │ │
│  │            │ │ QuestionBk │ │ Result     │ │ Navbar      │ │
│  │            │ │            │ │ Analytics  │ │ Layout      │ │
│  │            │ │            │ │ Leaderboard│ │             │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘ │
│                         │  Axios (HTTP)                        │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                               │
│                  FastAPI (Python 3, Uvicorn)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ /auth    │ │ /quizzes │ │ /attempts│ │ /ai      │          │
│  │ /users   │ │/questions│ │/analytics│ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                         │                                      │
│           ┌─────────────┼─────────────┐                        │
│           ▼             ▼             ▼                        │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐               │
│  │ Dependencies │ │ Schemas  │ │ Security     │               │
│  │ get_db       │ │ Pydantic │ │ JWT, bcrypt  │               │
│  │ get_current  │ │ models   │ │ OAuth2       │               │
│  │ _user        │ │          │ │              │               │
│  └──────────────┘ └──────────┘ └──────────────┘               │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                              │
│  ┌───────────────────┐  ┌────────────────────────┐             │
│  │   AIService       │  │ GamificationService    │             │
│  │ (Gemini API)      │  │ (XP, Badges, Streaks)  │             │
│  └────────┬──────────┘  └────────────────────────┘             │
│           │                                                    │
│           ▼                                                    │
│  ┌───────────────────┐                                         │
│  │ Google Gemini API │  (External)                             │
│  └───────────────────┘                                         │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
│              SQLAlchemy ORM → SQLite Database                  │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐ │
│  │ users   │ │ quizzes │ │questions│ │ attempts │ │ badges  │ │
│  └─────────┘ └─────────┘ └────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Frontend–Backend Interaction

| Aspect       | Detail                                               |
|-------------|------------------------------------------------------|
| Protocol    | HTTP/HTTPS                                           |
| Data Format | JSON (application/json), Multipart for file uploads  |
| Auth Header | `Authorization: Bearer <JWT>`                        |
| CORS        | Enabled for `localhost:5173`, `localhost:5174`, `localhost:3000` |
| API Prefix  | All endpoints prefixed with `/api`                   |
| Docs        | Auto-generated Swagger UI at `/docs`                 |

### 7.3 REST API Structure

| Method   | Endpoint                              | Module        | Auth Required |
|----------|---------------------------------------|---------------|:------------:|
| POST     | /api/auth/register                    | Auth          | ✗            |
| POST     | /api/auth/login                       | Auth          | ✗            |
| GET      | /api/auth/me                          | Auth          | ✓            |
| GET      | /api/users/                           | Users         | ✓            |
| PATCH    | /api/users/{id}/approve               | Users         | Teacher      |
| PATCH    | /api/users/{id}/toggle-active         | Users         | Teacher      |
| PATCH    | /api/users/me                         | Users         | ✓            |
| GET      | /api/users/leaderboard                | Users         | ✓            |
| GET      | /api/users/stats                      | Users         | ✓            |
| POST     | /api/quizzes/                         | Quizzes       | Teacher      |
| GET      | /api/quizzes/                         | Quizzes       | ✓            |
| GET      | /api/quizzes/{id}                     | Quizzes       | ✓            |
| PATCH    | /api/quizzes/{id}                     | Quizzes       | Teacher      |
| DELETE   | /api/quizzes/{id}                     | Quizzes       | Teacher      |
| POST     | /api/quizzes/{id}/publish             | Quizzes       | Teacher      |
| POST     | /api/quizzes/generate                 | Quizzes       | Teacher      |
| POST     | /api/questions/                       | Questions     | Teacher      |
| GET      | /api/questions/                       | Questions     | ✓            |
| PATCH    | /api/questions/{id}                   | Questions     | Teacher      |
| DELETE   | /api/questions/{id}                   | Questions     | Teacher      |
| POST     | /api/questions/bulk-import            | Questions     | Teacher      |
| POST     | /api/attempts/start                   | Attempts      | ✓            |
| GET      | /api/attempts/{id}/questions          | Attempts      | ✓            |
| POST     | /api/attempts/save-answer             | Attempts      | ✓            |
| POST     | /api/attempts/submit                  | Attempts      | ✓            |
| GET      | /api/attempts/{id}/result             | Attempts      | ✓            |
| GET      | /api/attempts/my-history              | Attempts      | ✓            |
| POST     | /api/attempts/anticheat               | Attempts      | ✓            |
| GET      | /api/analytics/student/me             | Analytics     | ✓            |
| GET      | /api/analytics/teacher/quiz/{id}      | Analytics     | Teacher      |
| GET      | /api/analytics/teacher/overview       | Analytics     | Teacher      |
| POST     | /api/ai/generate-questions            | AI            | Teacher      |
| POST     | /api/ai/explain-mistake               | AI            | ✓            |
| POST     | /api/ai/generate-from-content         | AI            | Teacher      |
| POST     | /api/ai/generate-from-pdf             | AI            | Teacher      |

---

## 8. Key Features

### 8.1 AI-Generated MCQs

Teachers can generate high-quality MCQs by specifying a topic and difficulty level. The Google Gemini API produces questions with four options, a correct answer, and explanations—ready for review and deployment.

### 8.2 Automatic Evaluation

Upon quiz submission, the backend instantly computes the student's score, applying positive marks for correct answers and optional negative marks for incorrect ones. Results include detailed breakdowns and a performance category.

### 8.3 AI-Powered Mistake Explanations

Students can request an AI-generated explanation for any wrong answer. The explanation covers why the selected answer is incorrect, why the correct answer is right, and a memorable study tip.

### 8.4 PDF Content Extraction

Teachers can upload PDF documents (lecture notes, textbooks). PyPDF2 extracts the text, and Gemini generates context-aware questions based on the content.

### 8.5 Gamification System

Experience points, a level progression system, daily streaks, and configurable badges keep students motivated. XP is awarded on every quiz submission, with bonuses for high accuracy.

### 8.6 Anti-Cheating Module

The system monitors and logs tab switches, fullscreen exits, and copy attempts during quiz sessions. These events are stored in the `anticheat_logs` table for teacher review.

### 8.7 Rich Analytics

- **Students** see topic-wise accuracy, strong/weak area identification, and a 10-attempt performance trend line.
- **Teachers** see score distributions (5-bin histogram), per-question success rates, pass rates, and a per-quiz student leaderboard.

### 8.8 Question Bank

Questions can exist independently of quizzes (`quiz_id = NULL`), forming a reusable question bank. AI-generated questions require teacher approval before being used.

### 8.9 Live Quiz Dashboard

The student dashboard features a "Live Quizzes" section with pulsing red "LIVE" badges, showing all currently published quizzes with their title, subject, difficulty, and duration.

### 8.10 Global Leaderboard

All students are ranked by XP on a public leaderboard, fostering healthy competition and consistent engagement.

---

## 9. Conclusion

### 9.1 Summary

The **Quiz Automation Platform** successfully demonstrates how artificial intelligence can transform the traditional quiz creation and assessment workflow. By integrating Google Gemini AI with a modern web architecture (React.js + FastAPI), the system automates question generation, evaluation, and feedback—reducing teacher workload from hours to seconds.

### 9.2 Benefits

| Benefit                  | Description                                                |
|--------------------------|------------------------------------------------------------|
| Time Saving              | AI generates quiz content instantly; no manual drafting.   |
| Consistent Quality       | Uniform question format with explanations for every MCQ.   |
| Immediate Feedback       | Students receive scores and explanations the moment they submit. |
| Data-Driven Insights     | Topic-wise analytics help both students and teachers.      |
| Scalability              | Supports unlimited quizzes, questions, and concurrent users.|
| Engagement               | Gamification (XP, badges, streaks) drives regular participation. |
| Academic Integrity       | Anti-cheat monitoring deters unfair practices.             |

### 9.3 Real-World Usability

This platform is suitable for:

- **Educational institutions** conducting internal assessments.
- **Coaching centres** creating practice tests at scale.
- **Corporate training** teams evaluating employee skill levels.
- **Self-learners** generating practice quizzes from their own study material (PDFs, notes).

### 9.4 Future Scope

1. **Adaptive Quiz Engine** – Dynamically adjust difficulty based on student performance.
2. **Detailed Answer Analytics** – Per-option selection heatmaps.
3. **Multi-language Support** – Generate questions in regional languages.
4. **Real-time Collaborative Quizzes** – Live multiplayer quiz sessions.
5. **LMS Integration** – Connect with Google Classroom, Moodle, or Canvas.
6. **Mobile Application** – Native Android/iOS app with offline quiz support.
7. **Proctoring** – Webcam-based monitoring during high-stakes exams.

---

*This document was prepared for academic submission as part of the MCA programme.*
