import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default api;

// ─── Auth ──────────────────────────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post("/auth/register", data),
    login: (data) => {
        const params = new URLSearchParams();
        params.append("username", data.email);
        params.append("password", data.password);
        return api.post("/auth/login", params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
    },
    me: () => api.get("/auth/me"),
};

// ─── Users ─────────────────────────────────────────────────────────────
export const usersAPI = {
    list: (params) => api.get("/users/", { params }),
    approve: (id) => api.patch(`/users/${id}/approve`),
    toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
    updateProfile: (data) => api.patch("/users/me", data),
    leaderboard: (limit = 10) => api.get("/users/leaderboard", { params: { limit } }),
    stats: () => api.get("/users/stats"),
};

// ─── Quizzes ───────────────────────────────────────────────────────────
export const quizzesAPI = {
    list: (params) => api.get("/quizzes/", { params }),
    get: (id) => api.get(`/quizzes/${id}`),
    create: (data) => api.post("/quizzes/", data),
    update: (id, data) => api.patch(`/quizzes/${id}`, data),
    delete: (id) => api.delete(`/quizzes/${id}`),
    publish: (id) => api.post(`/quizzes/${id}/publish`),
};

// ─── Questions ─────────────────────────────────────────────────────────
export const questionsAPI = {
    list: (params) => api.get("/questions/", { params }),
    create: (data) => api.post("/questions/", data),
    update: (id, data) => api.patch(`/questions/${id}`, data),
    delete: (id) => api.delete(`/questions/${id}`),
    bulkImport: (quizId, file) => {
        const fd = new FormData();
        fd.append("file", file);
        return api.post(`/questions/bulk-import?quiz_id=${quizId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

// ─── Attempts ──────────────────────────────────────────────────────────
export const attemptsAPI = {
    start: (quizId) => api.post(`/attempts/start?quiz_id=${quizId}`),
    getQuestions: (attemptId) => api.get(`/attempts/${attemptId}/questions`),
    saveAnswer: (data) => api.post("/attempts/save-answer", data),
    submit: (attemptId) => api.post("/attempts/submit", { attempt_id: attemptId }),
    result: (attemptId) => api.get(`/attempts/${attemptId}/result`),
    history: () => api.get("/attempts/my-history"),
    logAntiCheat: (data) => api.post("/attempts/anticheat", data),
};

// ─── Analytics ─────────────────────────────────────────────────────────
export const analyticsAPI = {
    studentMe: () => api.get("/analytics/student/me"),
    quizStats: (quizId) => api.get(`/analytics/teacher/quiz/${quizId}`),
    teacherOverview: () => api.get("/analytics/teacher/overview"),
};

// ─── AI ────────────────────────────────────────────────────────────────
export const aiAPI = {
    generateQuestions: (data) => api.post("/ai/generate-questions", data),
    explainMistake: (data) => api.post("/ai/explain-mistake", data),
    generateFromContent: (data) => api.post("/ai/generate-from-content", data),
    generateFromPdf: (quizId, difficulty, numQuestions, file) => {
        const fd = new FormData();
        fd.append("file", file);
        const params = new URLSearchParams({ difficulty, num_questions: numQuestions });
        if (quizId) params.append("quiz_id", quizId);
        return api.post(`/ai/generate-from-pdf?${params}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
