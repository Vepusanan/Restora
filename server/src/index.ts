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
import { buildAiAnalyticsContext } from './services/analyticsContextBuilder';
import { generateAiAnalytics } from './services/aiAnalyticsService';

assertServerEnv();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'restora-ai' });
});

async function requireApprovedAdmin(req: express.Request, res: express.Response) {
  const authHeader = String(req.headers.authorization || '');
  const idToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!idToken) {
    res.status(401).json({
      code: 'unauthenticated',
      message: 'Sign in required to use AI features',
    });
    return null;
  }

  const authUser = await verifyFirebaseIdToken(idToken);
  const profile = await firestoreUserApi.getUserProfile(idToken, authUser.uid);
  if (!profile || profile.status !== 'approved') {
    res.status(403).json({
      code: 'permission-denied',
      message: 'Approved account required',
    });
    return null;
  }
  if (!profile.restaurantId) {
    res.status(403).json({
      code: 'permission-denied',
      message: 'Restaurant membership required',
    });
    return null;
  }
  if (profile.role !== 'admin') {
    res.status(403).json({
      code: 'permission-denied',
      message: 'AI Analytics is available to restaurant admins only.',
    });
    return null;
  }

  return { idToken, profile };
}

function sendAiError(res: express.Response, error: unknown, label: string) {
  const message = error instanceof Error ? error.message : 'AI request failed';
  const lower = message.toLowerCase();
  const timedOut = lower.includes('abort') || lower.includes('timeout');
  const quota =
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('too many requests');

  console.error(label, message);

  if (timedOut) {
    res.status(504).json({
      code: 'deadline-exceeded',
      message: 'AI analytics unavailable. Please try again.',
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
    message: 'AI analytics unavailable. Please try again.',
  });
}

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

    const [batches, wasteLogs, usageLogs] = await Promise.all([
      firestoreUserApi.listInventory(idToken, profile.restaurantId),
      firestoreUserApi.listWaste(idToken, profile.restaurantId),
      firestoreUserApi.listUsage(idToken, profile.restaurantId),
    ]);

    const context = buildRestaurantContext({
      profile,
      batches,
      wasteLogs,
      usageLogs,
    });

    const result = await askGemini({ query, context });

    res.json({
      text: result.text,
      model: result.model,
      role: profile.role,
      restaurantId: profile.restaurantId,
    });
  } catch (error) {
    sendAiError(res, error, 'AI /ai/ask failed');
  }
});

/**
 * Admin-only AI Analytics — structured insights over aggregated ops data.
 * Caches result to aiAnalytics/{restaurantId} for manual refresh UX.
 */
app.post('/ai/analytics', async (req, res) => {
  try {
    const auth = await requireApprovedAdmin(req, res);
    if (!auth) return;
    const { idToken, profile } = auth;

    const startDate = String(req.body?.startDate ?? '').slice(0, 10);
    const endDate = String(req.body?.endDate ?? '').slice(0, 10);
    const range =
      /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
        ? { startDate, endDate }
        : undefined;

    const [batches, wasteLogs, usageLogs, restaurant] = await Promise.all([
      firestoreUserApi.listInventory(idToken, profile.restaurantId),
      firestoreUserApi.listWaste(idToken, profile.restaurantId),
      firestoreUserApi.listUsage(idToken, profile.restaurantId),
      firestoreUserApi.getRestaurant(idToken, profile.restaurantId),
    ]);

    const context = buildAiAnalyticsContext({
      restaurantId: profile.restaurantId,
      restaurantName: profile.restaurantName,
      batches,
      wasteLogs,
      usageLogs,
      settings: restaurant,
      range,
    });

    const generated = await generateAiAnalytics({
      context,
      timeoutMs: serverEnv.analyticsTimeoutMs,
    });

    const payload = {
      restaurantId: profile.restaurantId,
      summary: generated.summary,
      insights: generated.insights,
      recommendations: generated.recommendations,
      model: generated.model,
      generatedAt: generated.generatedAt,
      dataRange: generated.dataRange,
      createdBy: profile.uid,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      await firestoreUserApi.saveAiAnalytics(idToken, profile.restaurantId, payload);
    } catch (cacheError) {
      console.warn('AI analytics cache write failed', cacheError);
    }

    res.json(payload);
  } catch (error) {
    sendAiError(res, error, 'AI /ai/analytics failed');
  }
});

/** Admin-only cached insights read. */
app.get('/ai/analytics', async (req, res) => {
  try {
    const auth = await requireApprovedAdmin(req, res);
    if (!auth) return;
    const { idToken, profile } = auth;

    const cached = await firestoreUserApi.getAiAnalytics(idToken, profile.restaurantId);
    if (!cached) {
      res.status(404).json({
        code: 'not-found',
        message: 'No AI insights generated yet.',
      });
      return;
    }

    res.json(cached);
  } catch (error) {
    sendAiError(res, error, 'AI GET /ai/analytics failed');
  }
});

app.listen(serverEnv.port, () => {
  console.log(`Restora AI server listening on http://localhost:${serverEnv.port}`);
});
