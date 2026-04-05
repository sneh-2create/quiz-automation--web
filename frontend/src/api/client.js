/**
 * API client — native fetch only (no axios).
 * Same shape as before: methods return Promise<{ data }>, errors have err.response.{ status, data }.
 */

function resolveApiBase() {
    const raw = import.meta.env.VITE_API_URL?.trim();
    if (raw) {
        let b = raw.replace(/\/+$/, "");
        if (!b.endsWith("/api")) {
            b = `${b}/api`;
        }
        return b;
    }
    if (import.meta.env.DEV) {
        return "/api";
    }
    return "http://localhost:8000/api";
}

const API_BASE_PRIMARY = resolveApiBase();
const API_BASE_FALLBACK =
    API_BASE_PRIMARY.startsWith("http") && API_BASE_PRIMARY.includes(":8000")
        ? API_BASE_PRIMARY.replace(":8000", ":8001")
        : "http://localhost:8001/api";

export function getApiBaseUrl() {
    return API_BASE_PRIMARY;
}

function buildRequestUrl(base, path, params) {
    const baseClean = base.replace(/\/$/, "");
    const pathPart = path.startsWith("/") ? path : `/${path}`;
    const pathWithQuery = pathPart;
    let full;
    if (baseClean.startsWith("http")) {
        full = new URL(baseClean + pathWithQuery);
    } else {
        full = new URL(baseClean + pathWithQuery, window.location.origin);
    }
    if (params && typeof params === "object") {
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) {
                full.searchParams.append(k, String(v));
            }
        }
    }
    return full.toString();
}

async function readBody(res) {
    const text = await res.text();
    if (!text) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
            return JSON.parse(text);
        } catch {
            return { detail: text };
        }
    }
    return { detail: text };
}

function makeHttpError(status, data, path) {
    const detail = data?.detail;
    const msg =
        typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((x) => x.msg || JSON.stringify(x)).join(" · ")
              : `HTTP ${status}`;
    const err = new Error(msg);
    err.response = { status, data: data ?? {} };
    err.config = { url: path };
    return err;
}

/**
 * @param {string} method
 * @param {string} path
 * @param {{ params?: object, data?: unknown, headers?: Record<string, string>, skipAuth?: boolean, __retryFallback?: boolean, __retryRelative?: boolean }} options
 * @param {string} [baseOverride]
 */
async function coreRequest(method, path, options = {}, baseOverride = null) {
    const base = (baseOverride ?? API_BASE_PRIMARY).replace(/\/$/, "");
    const url = buildRequestUrl(base, path, options.params);
    const headers = new Headers();
    headers.set("Accept", "application/json");

    if (!options.skipAuth) {
        const token = localStorage.getItem("access_token");
        if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const extra = options.headers || {};
    let body = undefined;

    if (options.data instanceof FormData) {
        body = options.data;
        for (const [k, v] of Object.entries(extra)) {
            if (String(k).toLowerCase() !== "content-type") headers.set(k, v);
        }
    } else if (options.data !== undefined && options.data !== null && method !== "GET" && method !== "HEAD") {
        headers.set("Content-Type", "application/json");
        for (const [k, v] of Object.entries(extra)) {
            headers.set(k, v);
        }
        body = JSON.stringify(options.data);
    } else {
        for (const [k, v] of Object.entries(extra)) {
            headers.set(k, v);
        }
    }

    let res;
    try {
        res = await fetch(url, {
            method,
            headers,
            body,
            mode: "cors",
            credentials: "omit",
            cache: "no-store",
        });
    } catch (networkErr) {
        if (
            !options.__retryFallback &&
            base.startsWith("http") &&
            base.includes(":8000")
        ) {
            return coreRequest(method, path, { ...options, __retryFallback: true }, API_BASE_FALLBACK);
        }
        if (
            !options.__retryRelative &&
            (API_BASE_PRIMARY === "/api" || (API_BASE_PRIMARY.startsWith("/") && !API_BASE_PRIMARY.startsWith("//")))
        ) {
            try {
                return await coreRequest(method, path, { ...options, __retryRelative: true }, "http://127.0.0.1:8000/api");
            } catch (e2) {
                const netFail =
                    e2?.code === "ERR_NETWORK" ||
                    (typeof e2?.message === "string" && e2.message.includes("Failed to fetch"));
                if (netFail) {
                    return await coreRequest(
                        method,
                        path,
                        { ...options, __retryRelative: true, __triedLocalhost: true },
                        "http://localhost:8000/api"
                    );
                }
                throw e2;
            }
        }
        const err = new Error(networkErr?.message || "Network error — is the API running on port 8000?");
        err.response = { status: 0, data: { detail: err.message } };
        err.code = "ERR_NETWORK";
        err.config = { url: path };
        throw err;
    }

    const data = await readBody(res);

    if (res.status === 401) {
        const p = String(path);
        if (!p.includes("auth/login") && !p.includes("auth/register")) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        throw makeHttpError(401, data, path);
    }

    if (!res.ok) {
        throw makeHttpError(res.status, data, path);
    }

    return { data };
}

const api = {
    get(path, config = {}) {
        return coreRequest("GET", path, { params: config.params, skipAuth: config.skipAuth });
    },
    post(path, data, config = {}) {
        return coreRequest("POST", path, {
            data,
            params: config.params,
            headers: config.headers,
            skipAuth: config.skipAuth,
        });
    },
    patch(path, data, config = {}) {
        return coreRequest("PATCH", path, {
            data,
            params: config.params,
            headers: config.headers,
            skipAuth: config.skipAuth,
        });
    },
    delete(path, config = {}) {
        return coreRequest("DELETE", path, { params: config.params, skipAuth: config.skipAuth });
    },
};

export default api;

/**
 * Sign-in: dedicated flow with JSON + form fallback and multiple bases (proxy / direct :8000).
 */
export async function loginWithCredentials(username, password, portal = null) {
    const primary = getApiBaseUrl().replace(/\/$/, "");
    const fallbacks = [primary];
    if (primary === "/api" || primary.endsWith("/api")) {
        fallbacks.push("http://127.0.0.1:8000/api", "http://localhost:8000/api");
    }
    const tried = new Set();
    const loginPayload = {
        username: String(username ?? "").trim(),
        password: password ?? "",
    };
    if (portal) {
        loginPayload.portal = portal;
    }
    const bodyStr = JSON.stringify(loginPayload);

    let lastNetworkError = null;
    for (const base of fallbacks) {
        if (tried.has(base)) continue;
        tried.add(base);
        const url = `${base.replace(/\/$/, "")}/auth/login`;
        let res;
        try {
            res = await fetch(url, {
                method: "POST",
                mode: "cors",
                credentials: "omit",
                cache: "no-store",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: bodyStr,
            });
        } catch (e) {
            lastNetworkError = e;
            continue;
        }

        let data = await readBody(res);

        if (!res.ok && res.status === 422 && base === primary) {
            try {
                const fd = new URLSearchParams();
                fd.set("username", String(username ?? "").trim());
                fd.set("password", password ?? "");
                if (portal) fd.set("portal", portal);
                res = await fetch(url, {
                    method: "POST",
                    mode: "cors",
                    credentials: "omit",
                    cache: "no-store",
                    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
                    body: fd.toString(),
                });
                data = await readBody(res);
            } catch {
                /* keep first */
            }
        }

        if (!res.ok) {
            const detail = data?.detail;
            const msg =
                typeof detail === "string"
                    ? detail
                    : Array.isArray(detail)
                      ? detail.map((x) => x.msg || JSON.stringify(x)).join(" · ")
                      : res.status >= 500
                        ? `Server error (${res.status}). Is the API running on port 8000?`
                        : "Login failed";
            const err = new Error(msg);
            err.response = { status: res.status, data };
            throw err;
        }
        return data;
    }

    const hint =
        "Cannot reach the API. From the backend folder run: uvicorn main:app --reload --host 0.0.0.0 --port 8000";
    const err = new Error(hint);
    err.response = { status: 0, data: { detail: hint } };
    throw err;
}

// ─── Auth ──────────────────────────────────────────────────────────────
export const settingsAPI = {
    public: () => api.get("/settings/public"),
};

export const adminAPI = {
    getSettings: () => api.get("/admin/settings"),
    patchSettings: (data) => api.patch("/admin/settings", data),
    getAnalyticsOverview: () => api.get("/admin/analytics/overview"),
};

export const authAPI = {
    register: (data) => api.post("/auth/register", data),
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
    bulkImportStudents: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return api.post("/users/bulk-import-students", fd);
    },
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
        return api.post(`/questions/bulk-import?quiz_id=${quizId}`, fd);
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
    teacherInsights: () => api.get("/analytics/teacher/insights"),
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
        return api.post(`/ai/generate-from-pdf?${params}`, fd);
    },
};
