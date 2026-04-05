import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { PlatformContext } from "./platformContextBase";
import { settingsAPI } from "../api/client";

export function PlatformProvider({ children }) {
    const location = useLocation();
    const [studentAnalyticsEnabled, setStudentAnalyticsEnabled] = useState(true);

    const refreshPlatform = useCallback(async () => {
        try {
            const r = await settingsAPI.public();
            setStudentAnalyticsEnabled(!!r.data?.student_analytics_enabled);
        } catch {
            setStudentAnalyticsEnabled(true);
        }
    }, []);

    useEffect(() => {
        refreshPlatform();
    }, [refreshPlatform]);

    // Pick up admin changes without requiring a full page reload (e.g. student already logged in).
    useEffect(() => {
        if (location.pathname.startsWith("/student")) {
            refreshPlatform();
        }
    }, [location.pathname, refreshPlatform]);

    return (
        <PlatformContext.Provider value={{ studentAnalyticsEnabled, refreshPlatform }}>
            {children}
        </PlatformContext.Provider>
    );
}
