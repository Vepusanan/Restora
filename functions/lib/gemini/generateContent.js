"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = void 0;
const generative_ai_1 = require("@google/generative-ai");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const config_1 = require("./config");
const geminiApiKey = (0, params_1.defineSecret)('GEMINI_API_KEY');
/** Simple per-instance rate limiter (best-effort; use Redis/App Check in production). */
const requestLog = new Map();
function assertRateLimit(uid) {
    const now = Date.now();
    const windowStart = now - config_1.geminiConfig.rateLimit.windowMs;
    const recent = (requestLog.get(uid) ?? []).filter((ts) => ts > windowStart);
    if (recent.length >= config_1.geminiConfig.rateLimit.maxRequests) {
        throw new https_1.HttpsError('resource-exhausted', 'Too many AI requests. Please wait a moment and try again.');
    }
    recent.push(now);
    requestLog.set(uid, recent);
}
function validatePrompt(prompt) {
    if (typeof prompt !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'prompt must be a string');
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
        throw new https_1.HttpsError('invalid-argument', 'prompt is required');
    }
    if (trimmed.length > config_1.geminiConfig.maxPromptLength) {
        throw new https_1.HttpsError('invalid-argument', `prompt must be ${config_1.geminiConfig.maxPromptLength} characters or fewer`);
    }
    return trimmed;
}
/**
 * Authenticated callable that proxies prompts to Gemini.
 * Mobile clients must never call Gemini directly.
 */
exports.generateContent = (0, https_1.onCall)({
    secrets: [geminiApiKey],
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required to use AI features');
    }
    assertRateLimit(request.auth.uid);
    const prompt = validatePrompt(request.data?.prompt);
    const modelName = config_1.geminiConfig.defaultModel;
    try {
        // Prefer secret binding; fall back to process.env for local emulator.
        process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || geminiApiKey.value();
        const genAI = new generative_ai_1.GoogleGenerativeAI((0, config_1.getGeminiApiKey)());
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim();
        if (!text) {
            throw new https_1.HttpsError('internal', 'Gemini returned an empty response');
        }
        return { text, model: modelName };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        console.error('generateContent failed', error);
        throw new https_1.HttpsError('internal', 'Failed to generate AI response');
    }
});
//# sourceMappingURL=generateContent.js.map