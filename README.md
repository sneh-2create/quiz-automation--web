# Quiz Automation Platform

A full-stack quiz platform for teachers and students with AI-assisted question generation, quiz management, and learning analytics.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Axios
- Backend: FastAPI, SQLAlchemy, JWT authentication
- Database: SQLite (local development)
- AI: Gemini API

## Features

- Teacher quiz creation and publishing flow
- Manual question creation and bulk question management
- AI-based question generation from topic/text/PDF
- Student quiz attempts and results
- Dashboard analytics and leaderboard

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- Gemini API key (optional, for AI generation)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Backend URL: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend URL: `http://localhost:5173`

## Demo Accounts

- Teacher: `teacher@quizplatform.com` / `Teacher@123`
- Student: `student@quizplatform.com` / `Student@123`

These accounts are auto-created/updated on backend startup for local testing.

## Docker (Optional)

```bash
docker-compose up --build
```
