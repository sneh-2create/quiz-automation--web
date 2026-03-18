# QuizAI Platform - AI-Powered Smart Quiz & Learning Analytics

A modern, full-stack quiz and learning analytics platform designed for college environments. Featuring AI-powered question generation, real-time analytics, gamification, and anti-cheat measures.

##  Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons), Recharts (Analytics), Framer Motion (Animations), Axios.
- **Backend**: FastAPI, SQLAlchemy (PostgreSQL/SQLite), JWT Auth, Pydantic.
- **AI**: Gemini API (Google Generative AI).
- **Orchestration**: Docker & Docker Compose.

##  Key Features

- **For Teachers**:
  -  **AI Question Generation**: Generate high-quality MCQs from topics, text content, or PDF uploads.
  -  **Question Bank**: Manage a central repository of questions with bulk CSV/Excel import.
  -  **Rich Analytics**: Visual distribution of scores, question difficulty analysis, and class leaderboards.
  -  **Quiz Engine**: Flexible configuration (timers, negative marking, randomized options).

- **For Students**:
  -  **Gamified Dashboard**: XP points, levels, and achievement progress.
  -  **Leaderboards**: Competitive ranking across the platform.
  -  **Smart Quiz Engine**: Fullscreen mode, tab-switch detection, and automatic timer submission.
  - **AI Explanations**: "Explain my mistake" feature for deep learning insights.

- **For Admins**:
  - **User Management**: Approve teacher accounts and monitor system performance.
  - **Platform Stats**: Global overview of users, quizzes, and attempts.

##  Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- [Gemini API Key](https://aistudio.google.com/app/apikey)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Docker Setup
Run the entire platform with a single command:
```bash
docker-compose up --build
```

## Default Accounts (for testing)
- **Admin**: `admin@quizplatform.com` / `Admin@123`
- **Teacher**: `teacher@quizplatform.com` / `Teacher@123`
- **Student**: `student@quizplatform.com` / `Student@123`

# Anti-Cheat Measures
The platform includes:
1. **Visibility Detection**: Detects if a student switches tabs or minimizes the window.
2. **Warning System**: Logs violations and auto-submits after 3 warnings.
3. **Fullscreen Encouragement**: Advised mode for secure attempts.
