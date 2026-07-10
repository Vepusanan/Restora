import express from 'express';
import cors from 'cors';
import { assertServerEnv, serverEnv } from './config';
import { verifyFirebaseIdToken } from './services/authVerify';
import { firestoreUserApi } from './services/firestoreClient';
import {
  buildRestaurantContext,
  staffFinancialRefusal,
} from './services/permissionFilter';
import { askGemini } from './services/geminiService';

assertServerEnv();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'restora-ai' });
});

/**
 * FR-042–046 — authenticated AI ask endpoint.
 * Never writes business data. Context is role-filtered before Gemini.
 */
app.post('/ai/ask', async (req, res) => {
  try {
    const authHeader = String(req.headers.authorization || '');
    const idToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (!idToken) {
      res.status(401).json({
        code: 'unauthenticated',
        message: 'Sign in required to use AI features',
      });
      return;
    }

    const query = String(req.body?.query ?? '').trim();
    if (!query) {
      res.status(400).json({ code: 'invalid-argument', message: 'query is required' });
      return;
    }
    if (query.length > serverEnv.maxQueryLength) {
      res.status(400).json({
        code: 'invalid-argument',
        message: `query must be ${serverEnv.maxQueryLength} characters or fewer`,
      });
      return;
    }

    const authUser = await verifyFirebaseIdToken(idToken);
    const profile = await firestoreUserApi.getUserProfile(idToken, authUser.uid);
    if (!profile || profile.status !== 'approved') {
      res.status(403).json({
        code: 'permission-denied',
        message: 'Approved account required',
      });
      return;
    }
    if (!profile.restaurantId) {
      res.status(403).json({
        code: 'permission-denied',
        message: 'Restaurant membership required',
      });
      return;
    }

    // Hard refuse staff financial questions before calling Gemini (FR-045).
    if (profile.role === 'staff') {
      const refusal = staffFinancialRefusal(query);
      if (refusal) {
        res.json({
          text: refusal,
          model: 'policy',
          role: profile.role,
          restaurantId: profile.restaurantId,
        });
        return;
      }
    }

    const [batches, wasteLogs] = await Promise.all([
      firestoreUserApi.listInventory(idToken, profile.restaurantId),
      firestoreUserApi.listWaste(idToken, profile.restaurantId),
    ]);

    const context = buildRestaurantContext({
      profile,
      batches,
      wasteLogs,
    });

    const result = await askGemini({ query, context });

    // FR-044 — response only; no Firestore business writes performed.
    res.json({
      text: result.text,
      model: result.model,
      role: profile.role,
      restaurantId: profile.restaurantId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed';
    const lower = message.toLowerCase();
    const timedOut = lower.includes('abort') || lower.includes('timeout');
    const quota =
      lower.includes('429') ||
      lower.includes('quota') ||
      lower.includes('resource_exhausted') ||
      lower.includes('too many requests');

    console.error('AI /ai/ask failed', message);

    if (timedOut) {
      res.status(504).json({
        code: 'deadline-exceeded',
        message: 'AI Assistant is currently unavailable. Please try again.',
      });
      return;
    }

    if (quota) {
      res.status(429).json({
        code: 'resource-exhausted',
        message:
          'Gemini API quota exceeded for this key. Wait for the quota reset or create a new key in Google AI Studio, then update server/.env (GEMINI_API_KEY).',
      });
      return;
    }

    res.status(500).json({
      code: 'internal',
      message: 'AI Assistant is currently unavailable. Please try again.',
    });
  }
});

app.listen(serverEnv.port, () => {
  console.log(`Restora AI server listening on http://localhost:${serverEnv.port}`);
});
