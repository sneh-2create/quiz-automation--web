import { useContext } from "react";
import { PlatformContext } from "./platformContextBase";

export function usePlatform() {
    return useContext(PlatformContext);
}
