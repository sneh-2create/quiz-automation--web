import { useState, useEffect } from "react";
import { AuthContext } from "./authContextBase";
import { authAPI, loginWithCredentials } from "../api/client";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            authAPI
                .me()
                .then((res) => {
                    setUser(res.data);
                    localStorage.setItem("user", JSON.stringify(res.data));
                })
                .catch(() => {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password, portal = null) => {
        const body = await loginWithCredentials(username, password, portal);
        if (!body?.access_token || !body?.user) {
            throw Object.assign(new Error("Invalid response from server after login."), {
                response: { status: 502, data: { detail: "Server did not return a token. Is the API up to date?" } },
            });
        }
        const { access_token, user: userData } = body;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}
