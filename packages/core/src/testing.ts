/**
 * In-memory reference implementations, demo bundle and seed fixtures.
 *
 * Kept alongside the Supabase-backed repositories as a reference and as test
 * doubles. Import from `@handimen/core/testing`, never from the package root:
 * the seeds build timestamps at module scope, which is unsafe in a prerender.
 */

export * from "./demo/bundle";
export * from "./listings/mock-repository";
export * from "./listings/seed";
export * from "./messages/mock-store";
export * from "./messages/seed";
export * from "./requests/mock-store";
export * from "./reviews/mock-store";
export * from "./reviews/seed";
export * from "./social/mock-repository";
export * from "./social/seed";
