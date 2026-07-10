"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiConfig = void 0;
exports.getGeminiApiKey = getGeminiApiKey;
/**
 * Gemini configuration for Cloud Functions.
 * Keys are read from environment / Secret Manager — never from the mobile client.
 */
exports.geminiConfig = {
    /** Max prompt length accepted by the callable */
    maxPromptLength: 4000,
    /** Soft rate-limit window (per uid) in memory of a warm instance */
    rateLimit: {
        windowMs: 60_000,
        maxRequests: 20,
    },
    defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
};
function getGeminiApiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error('GEMINI_API_KEY is not configured on Cloud Functions');
    }
    return key;
}
//# sourceMappingURL=config.js.map