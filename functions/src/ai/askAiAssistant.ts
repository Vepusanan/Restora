import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { geminiConfig, getGeminiApiKey } from '../gemini/config';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const requestLog = new Map<string, number[]>();

function assertRateLimit(uid: string): void {
  const now = Date.now();
  const windowStart = now - geminiConfig.rateLimit.windowMs;
  const recent = (requestLog.get(uid) ?? []).filter((ts) => ts > windowStart);
  if (recent.length >= geminiConfig.rateLimit.maxRequests) {
    throw new HttpsError(
      'resource-exhausted',
      'Too many AI requests. Please wait a moment and try again.',
    );
  }
  recent.push(now);
  requestLog.set(uid, recent);
}

/**
 * Blaze-ready callable AI assistant with server-side RBAC context filtering.
 * Prefer the local AI proxy when Cloud Functions are unavailable.
 */
export const askAiAssistant = onCall(
  {
    secrets: [geminiApiKey],
    region: 'us-central1',
    timeoutSeconds: 15,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required to use AI features');
    }

    const query = String(request.data?.query ?? '').trim();
    if (!query) {
      throw new HttpsError('invalid-argument', 'query is required');
    }
    if (query.length > geminiConfig.maxPromptLength) {
      throw new HttpsError('invalid-argument', 'query is too long');
    }

    assertRateLimit(request.auth.uid);
    const db = getFirestore();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'User profile not found');
    }
    const user = userSnap.data()!;
    if (user.status !== 'approved') {
      throw new HttpsError('permission-denied', 'Approved account required');
    }

    const role = user.role === 'admin' ? 'admin' : 'staff';
    const restaurantId = String(user.restaurantId || '');
    if (!restaurantId) {
      throw new HttpsError('failed-precondition', 'Restaurant membership required');
    }

    if (role === 'staff') {
      const lower = query.toLowerCase();
      if (
        ['cost', 'money', 'price', 'value', 'loss', 'expense', 'financial', 'profit', 'valuation'].some(
          (hint) => lower.includes(hint),
        )
      ) {
        return {
          text:
            'I can help with operational inventory and waste quantities, but cost and financial information is restricted to restaurant admins.',
          model: 'policy',
        };
      }
    }

    const [batchesSnap, wasteSnap] = await Promise.all([
      db.collection('inventoryBatches').where('restaurantId', '==', restaurantId).limit(100).get(),
      db.collection('wasteLogs').where('restaurantId', '==', restaurantId).limit(100).get(),
    ]);

    const inventory = batchesSnap.docs.map((doc) => {
      const data = doc.data();
      const item: Record<string, unknown> = {
        ingredientName: data.ingredientName,
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiryDate,
        consumed: data.consumed,
        archived: data.archived,
      };
      if (role === 'admin') item.unitCost = data.unitCost;
      return item;
    });

    const waste = wasteSnap.docs
      .map((doc) => doc.data())
      .filter((data) => !data.voided)
      .map((data) => {
        const item: Record<string, unknown> = {
          ingredientName: data.ingredientName,
          quantityWasted: data.quantityWasted,
          unit: data.unit,
          wasteReason: data.wasteReason,
          date: data.timestamp?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? '',
        };
        if (role === 'admin') item.costLoss = data.costLoss;
        return item;
      });

    const context = {
      restaurantId,
      restaurantName: user.restaurantName,
      role,
      inventory,
      waste,
      financial:
        role === 'admin'
          ? {
              note: 'Compute valuation and waste loss from provided inventory/waste rows only.',
            }
          : null,
    };

    try {
      process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || geminiApiKey.value();
      const genAI = new GoogleGenerativeAI(getGeminiApiKey());
      const model = genAI.getGenerativeModel({
        model: geminiConfig.defaultModel,
        systemInstruction:
          'Answer only from restaurantContext. Read-only. Never invent data. Staff must not receive financial answers.',
      });
      const result = await model.generateContent(
        JSON.stringify({ userQuery: query, role, restaurantContext: context }),
      );
      const text = result.response.text()?.trim();
      if (!text) {
        throw new HttpsError('internal', 'Empty AI response');
      }
      return { text, model: geminiConfig.defaultModel };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('askAiAssistant failed', error);
      throw new HttpsError(
        'internal',
        'AI Assistant is currently unavailable. Please try again.',
      );
    }
  },
);
