"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAiAssistant = void 0;
const generative_ai_1 = require("@google/generative-ai");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const config_1 = require("../gemini/config");
const geminiApiKey = (0, params_1.defineSecret)('GEMINI_API_KEY');
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
/**
 * Blaze-ready callable AI assistant with server-side RBAC context filtering.
 * Prefer the local AI proxy when Cloud Functions are unavailable.
 */
exports.askAiAssistant = (0, https_1.onCall)({
    secrets: [geminiApiKey],
    region: 'us-central1',
    timeoutSeconds: 15,
    memory: '512MiB',
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required to use AI features');
    }
    const query = String(request.data?.query ?? '').trim();
    if (!query) {
        throw new https_1.HttpsError('invalid-argument', 'query is required');
    }
    if (query.length > config_1.geminiConfig.maxPromptLength) {
        throw new https_1.HttpsError('invalid-argument', 'query is too long');
    }
    assertRateLimit(request.auth.uid);
    const db = (0, firestore_1.getFirestore)();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found');
    }
    const user = userSnap.data();
    if (user.status !== 'approved') {
        throw new https_1.HttpsError('permission-denied', 'Approved account required');
    }
    const role = user.role === 'admin' ? 'admin' : 'staff';
    const restaurantId = String(user.restaurantId || '');
    if (!restaurantId) {
        throw new https_1.HttpsError('failed-precondition', 'Restaurant membership required');
    }
    if (role === 'staff') {
        const lower = query.toLowerCase();
        if (['cost', 'money', 'price', 'value', 'loss', 'expense', 'financial', 'profit', 'valuation'].some((hint) => lower.includes(hint))) {
            return {
                text: 'I can help with operational inventory and waste quantities, but cost and financial information is restricted to restaurant admins.',
                model: 'policy',
            };
        }
    }
    const [batchesSnap, wasteSnap, usageSnap] = await Promise.all([
        db.collection('inventoryBatches').where('restaurantId', '==', restaurantId).limit(100).get(),
        db.collection('wasteLogs').where('restaurantId', '==', restaurantId).limit(100).get(),
        db.collection('inventory_usage').where('restaurantId', '==', restaurantId).limit(100).get(),
    ]);
    const inventory = batchesSnap.docs.map((doc) => {
        const data = doc.data();
        const item = {
            ingredientName: data.ingredientName,
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate,
            consumed: data.consumed,
            archived: data.archived,
        };
        if (role === 'admin')
            item.unitCost = data.unitCost;
        return item;
    });
    const waste = wasteSnap.docs
        .map((doc) => doc.data())
        .filter((data) => !data.voided)
        .map((data) => {
        const item = {
            ingredientName: data.ingredientName,
            quantityWasted: data.quantityWasted,
            unit: data.unit,
            wasteReason: data.wasteReason,
            date: data.timestamp?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? '',
        };
        if (role === 'admin')
            item.costLoss = data.costLoss;
        return item;
    });
    const usage = usageSnap.docs
        .map((doc) => doc.data())
        .filter((data) => !data.voided)
        .map((data) => {
        const item = {
            ingredientName: data.ingredientName,
            quantityUsed: data.quantityUsed,
            unit: data.unit,
            category: data.category,
            date: data.usedAt?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? '',
        };
        if (role === 'admin')
            item.consumptionCost = data.consumptionCost;
        return item;
    });
    const context = {
        restaurantId,
        restaurantName: user.restaurantName,
        role,
        inventory,
        waste,
        usage,
        notes: [
            'Consumption is kitchen usage for orders/prep — not waste. Keep metrics separate.',
        ],
        financial: role === 'admin'
            ? {
                note: 'Compute valuation, waste loss, and consumption cost from provided rows only.',
            }
            : null,
    };
    try {
        process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || geminiApiKey.value();
        const genAI = new generative_ai_1.GoogleGenerativeAI((0, config_1.getGeminiApiKey)());
        const model = genAI.getGenerativeModel({
            model: config_1.geminiConfig.defaultModel,
            systemInstruction: 'Answer only from restaurantContext. Read-only. Never invent data. Staff must not receive financial answers. Treat waste and consumption as separate processes.',
        });
        const result = await model.generateContent(JSON.stringify({ userQuery: query, role, restaurantContext: context }));
        const text = result.response.text()?.trim();
        if (!text) {
            throw new https_1.HttpsError('internal', 'Empty AI response');
        }
        return { text, model: config_1.geminiConfig.defaultModel };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        console.error('askAiAssistant failed', error);
        throw new https_1.HttpsError('internal', 'AI Assistant is currently unavailable. Please try again.');
    }
});
//# sourceMappingURL=askAiAssistant.js.map