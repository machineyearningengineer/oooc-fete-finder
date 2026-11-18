import { isArchiveModeEnabled } from "./archive-mode";
export function isOffseasonPlaceholderEnabled() {
	return !isArchiveModeEnabled() && process.env.OOOC_FETE_LIVE_APP !== "true";
}
