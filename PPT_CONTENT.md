# Quiz Automation Platform – PPT Content

## AI-Based Question Generation and Quiz Management System

**Theme:** Green + White (Modern SaaS)  
**Total Slides:** 15  
**Design Style:** Minimal text, bullet points, clean layout, green/white palette with subtle dark accents.

---

## Slide 1 — Title Slide

**Title:** Quiz Automation Platform  
**Subtitle:** AI-Based Question Generation and Quiz Management System

**Content:**
- Project Team: [Team Member Names]
- Guide: [Faculty Guide Name]
- College: [College Name]
- Course: Master of Computer Applications (MCA)
- Academic Year: 2025–2026

**Design Note:** Green gradient background. White text. Platform logo or AI/quiz icon centred. Clean sans-serif font (Inter or Outfit).

---

## Slide 2 — Introduction

**Title:** What is Quiz Automation?

**Content:**
- Automating quiz creation, evaluation, and analytics using AI
- Replaces manual question drafting with intelligent generation
- Provides instant evaluation and personalised feedback
- Gamified learning experience for students

**Design Note:** Icon-based layout. Four icons in a row: 🤖 AI Generation → 📝 Quiz → ✅ Evaluation → 📊 Analytics.

---

## Slide 3 — Problem Statement

**Title:** The Problem

**Content:**
- Manual quiz creation takes **hours** of teacher effort
- Repetitive questions across semesters
- No personalised feedback for students
- Limited analytics on student strengths and weaknesses
- Paper-based systems are hard to scale
- No mechanism for detecting malpractice in online quizzes

**Design Note:** Red/orange accent for pain points. "Before" scenario illustration. List with ✗ icons.

---

## Slide 4 — Objective

**Title:** Our Objective

**Content:**
- Automate MCQ generation using Google Gemini AI
- Enable instant, unbiased quiz evaluation
- Provide AI-powered explanations for wrong answers
- Build rich analytics dashboards for teachers and students
- Introduce gamification (XP, badges, streaks) to boost engagement
- Implement anti-cheating safeguards

**Design Note:** Green checkmark bullets. Clean two-column layout.

---

## Slide 5 — Proposed Solution

**Title:** Proposed Solution

**Content:**
- **For Teachers:**
  - Enter a topic → AI generates MCQs instantly
  - Upload PDF notes → Questions auto-generated from content
  - One-click quiz publishing with detailed analytics

- **For Students:**
  - Attempt live quizzes with a built-in timer
  - Get instant scores and performance categories
  - Request AI explanations for any mistake
  - Earn XP, level up, and compete on the leaderboard

**Design Note:** Split layout – Teacher side (left, green) | Student side (right, green-tinted white).

---

## Slide 6 — Technology Stack

**Title:** Tech Stack

| Layer          | Technology                    |
|---------------|-------------------------------|
| Frontend      | React.js (Vite)               |
| Styling       | Tailwind CSS, Framer Motion   |
| Backend       | Python – FastAPI              |
| Database      | SQLite (SQLAlchemy ORM)       |
| AI Engine     | Google Gemini API             |
| PDF Parser    | PyPDF2                        |
| Authentication| JWT + bcrypt                  |
| API Docs      | Swagger UI (auto-generated)   |

**Design Note:** Icon grid layout. Each technology with its logo. Green-tinted card backgrounds.

---

## Slide 7 — System Architecture

**Title:** System Architecture

**Content (Diagram):**

```
React Frontend (Vite)
      │  Axios + JWT
      ▼
FastAPI Backend (Uvicorn)
      │
  ┌───┼───────────┐
  ▼   ▼           ▼
Routes  Services   Security
  │     │           │
  │  ┌──┴──┐       JWT
  │  │ AI  │     + bcrypt
  │  │Svc  │
  │  └──┬──┘
  │     │
  ▼     ▼
SQLAlchemy ──► SQLite DB
  │
  ▼
Google Gemini API
```

**Design Note:** Flowchart with green arrows. Rounded rectangles. Light green boxes on white background.

---

## Slide 8 — Key Features

**Title:** Key Features

**Content:**
- 🤖 AI-generated MCQs (topic, content, or PDF)
- ✅ Instant automatic evaluation
- 💡 AI-powered mistake explanations
- 📊 Student & teacher analytics dashboards
- 🏆 Gamification – XP, levels, badges, streaks
- 🔒 Anti-cheating (tab switch, fullscreen exit detection)
- 📄 Bulk question import (Excel/CSV)
- 🔀 Question & option randomisation
- 📡 Live quiz dashboard with real-time indicators

**Design Note:** 3×3 icon grid. Each feature in a small green card with an icon and 2–3 word title.

---

## Slide 9 — Teacher Workflow

**Title:** Teacher Workflow

**Content (Step Flow):**

```
Login → Create Quiz → Choose AI Method
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     Topic-Based    Content-Based    PDF Upload
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              AI Generates MCQs
                          ▼
              Review & Approve
                          ▼
              Publish Quiz
                          ▼
              Monitor Analytics
```

**Design Note:** Horizontal step flow with green arrows and numbered circles.

---

## Slide 10 — Student Workflow

**Title:** Student Workflow

**Content (Step Flow):**

```
Login → Browse Live Quizzes → Start Attempt
                                    │
                                    ▼
                            Answer Questions
                           (Auto-saved, Timer)
                                    │
                                    ▼
                            Submit Quiz
                                    │
                                    ▼
                       Instant Results + XP Earned
                                    │
                          ┌─────────┼─────────┐
                          ▼                   ▼
                 View Detailed          Request AI
                   Results           Mistake Explanation
                          │
                          ▼
                  Analytics Dashboard
              (Topics, Trends, Rankings)
```

**Design Note:** Vertical step flow. Highlight the "Instant Results + XP" step with a green badge.

---

## Slide 11 — Data Flow

**Title:** Data Flow Diagram

**Content:**

**Level 0 – Context:**
- Teacher → System → Gemini AI
- Student → System → Database
- System returns results, analytics, and generated questions

**Level 1 – Processes:**
1. Authentication Module (Register, Login, JWT)
2. Quiz Management (CRUD, Publish)
3. AI Engine (Generate, Parse, Save)
4. Attempt & Evaluation (Start, Answer, Submit, Score)
5. Analytics Module (Student & Teacher Dashboards)

**Design Note:** Simple DFD boxes with green borders and arrows.

---

## Slide 12 — Database Design

**Title:** Database Schema

**Content (Table Overview):**

| Table             | Key Fields                       | Purpose             |
|-------------------|----------------------------------|----------------------|
| users             | id, email, role, xp_points       | User accounts        |
| quizzes           | id, title, teacher_id, is_published | Quiz definitions  |
| questions         | id, quiz_id, text, correct_option | MCQ storage         |
| quiz_attempts     | id, quiz_id, student_id, score   | Attempt records      |
| attempt_answers   | id, attempt_id, selected_option  | Individual answers   |
| anticheat_logs    | id, attempt_id, event_type       | Cheat detection      |
| badges            | id, name, condition_type         | Achievement badges   |
| student_badges    | student_id, badge_id, earned_at  | Earned badges        |
| daily_challenges  | quiz_id, date, is_active         | Daily quiz feature   |

**Relationships:** User→Quizzes, Quiz→Questions, Quiz→Attempts, Attempt→Answers

**Design Note:** ER diagram style. Tables as green boxes connected with relationship lines.

---

## Slide 13 — UI Screenshots

**Title:** User Interface

**Content (Placeholder Descriptions):**

1. **Student Dashboard** – Welcome banner, XP progress, live quizzes, leaderboard
2. **Quiz Attempt Page** – Question card, option buttons, timer, progress bar
3. **Result Page** – Score breakdown, performance category, per-question review
4. **Teacher Dashboard** – Quiz list, analytics overview, create quiz button
5. **AI Question Generator** – Topic input, difficulty selector, generated preview

**Design Note:** Screenshot carousel or 2×3 grid with rounded corners and subtle drop shadows. Use actual app screenshots.

---

## Slide 14 — Advantages

**Title:** Why This System?

**Content:**
- ⏱️ **Saves Time** – AI generates quizzes in seconds, not hours
- 📈 **Scalable** – Supports unlimited quizzes and students
- 🎯 **Accurate Evaluation** – Instant, unbiased, consistent scoring
- 🧠 **Smart Feedback** – AI explains every mistake
- 🏅 **Engaging** – XP, badges, and streaks keep students motivated
- 🔐 **Secure** – JWT authentication + anti-cheat monitoring
- 📊 **Data-Driven** – Topic-wise analytics guide teaching focus

**Design Note:** Two-column layout with large icons. Green gradient accent bar at the top.

---

## Slide 15 — Future Scope & Thank You

**Title:** Future Scope

**Content:**
- 🎯 Adaptive quizzes (adjust difficulty in real time)
- 📱 Mobile application (Android/iOS)
- 🌐 Multi-language question generation
- 🎥 Webcam-based proctoring
- 🔗 LMS integration (Google Classroom, Moodle)
- 📊 Advanced analytics with AI-predicted performance

---

**Thank You!**

Questions?

**Design Note:** Clean closing slide. Green gradient background. Team member names and contact details. College logo.

---

## Design Guidelines Summary

| Element        | Specification                         |
|---------------|---------------------------------------|
| Primary Color | Green (#10B981 or similar)            |
| Secondary     | White (#FFFFFF)                       |
| Accent        | Dark Green (#064E3B)                  |
| Background    | White or very light green tint        |
| Font          | Inter, Outfit, or Poppins (Google)    |
| Style         | Minimal, modern SaaS aesthetic        |
| Icons         | Lucide or Heroicons (line style)      |
| Layout        | Max 5–6 bullet points per slide       |
| Transitions   | Subtle fade or slide (no flashy fx)   |
