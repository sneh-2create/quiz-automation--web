import { createContext } from "react";

export const PlatformContext = createContext({
    studentAnalyticsEnabled: true,
    refreshPlatform: async () => {},
});
