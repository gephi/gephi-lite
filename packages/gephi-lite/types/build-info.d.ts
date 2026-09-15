// Injected at build time by vite.config.mts (git commit hash / build timestamp), so the "About"
// popup can show exactly which commit is running - useful to confirm a deployment actually updated.
declare const __GIT_COMMIT_HASH__: string | null;
declare const __BUILD_DATE__: string;
