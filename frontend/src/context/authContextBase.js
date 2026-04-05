import { createContext } from "react";

/** Separate file so Vite Fast Refresh does not invalidate the Provider + hook together. */
export const AuthContext = createContext(null);
