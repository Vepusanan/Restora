import { serverEnv } from '../config';

type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
};

type ListResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

function docIdFromName(name?: string): string {
  if (!name) return '';
  const parts = name.split('/');
  return parts[parts.length - 1] || '';
}

function readString(fields: Record<string, FirestoreValue> | undefined, key: string): string {
  return fields?.[key]?.stringValue ?? '';
}

function readNumber(fields: Record<string, FirestoreValue> | undefined, key: string): number {
  const value = fields?.[key];
  if (!value) return 0;
  if (typeof value.doubleValue === 'number') return value.doubleValue;
  if (value.integerValue != null) return Number(value.integerValue);
  return 0;
}

function readBoolean(fields: Record<string, FirestoreValue> | undefined, key: string): boolean {
  return Boolean(fields?.[key]?.booleanValue);
}

async function firestoreGet(
  idToken: string,
  path: string,
): Promise<FirestoreDocument | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${serverEnv.firebaseProjectId}/databases/(default)/documents/${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore get failed (${response.status}): ${body}`);
  }
  return (await response.json()) as FirestoreDocument;
}

async function firestoreRunQuery(
  idToken: string,
  collectionId: string,
  field: string,
  op: string,
  value: string,
  limit = 100,
): Promise<FirestoreDocument[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${serverEnv.firebaseProjectId}/databases/(default)/documents:runQuery`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op,
            value: { stringValue: value },
          },
        },
        limit,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore query failed (${response.status}): ${body}`);
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  return rows.map((row) => row.document).filter(Boolean) as FirestoreDocument[];
}

async function firestorePatch(
  idToken: string,
  path: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const fieldPaths = Object.keys(fields);
  const url = `https://firestore.googleapis.com/v1/projects/${serverEnv.firebaseProjectId}/databases/(default)/documents/${path}?${fieldPaths
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join('&')}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreFields(fields) }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore patch failed (${response.status}): ${body}`);
  }
}

function toFirestoreFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  const out: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = toFirestoreValue(value);
  }
  return out;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value as Record<string, unknown>),
      },
    };
  }
  return { stringValue: String(value) };
}

export const firestoreUserApi = {
  async getUserProfile(idToken: string, uid: string) {
    const doc = await firestoreGet(idToken, `users/${uid}`);
    if (!doc?.fields) return null;
    return {
      uid,
      role: (readString(doc.fields, 'role') || 'staff') as 'admin' | 'staff',
      status: readString(doc.fields, 'status'),
      restaurantId: readString(doc.fields, 'restaurantId'),
      restaurantName: readString(doc.fields, 'restaurantName'),
      displayName: readString(doc.fields, 'displayName'),
    };
  },

  async getRestaurant(idToken: string, restaurantId: string) {
    const doc = await firestoreGet(idToken, `restaurants/${restaurantId}`);
    if (!doc?.fields) return null;
    return {
      id: restaurantId,
      name: readString(doc.fields, 'name'),
      currency: readString(doc.fields, 'currency') || 'USD',
      expiryAlertThreshold: readNumber(doc.fields, 'expiryAlertThreshold') || 3,
    };
  },

  async listInventory(idToken: string, restaurantId: string) {
    const docs = await firestoreRunQuery(
      idToken,
      'inventoryBatches',
      'restaurantId',
      'EQUAL',
      restaurantId,
      120,
    );
    return docs.map((doc) => {
      const fields = doc.fields || {};
      return {
        id: docIdFromName(doc.name),
        ingredientName: readString(fields, 'ingredientName'),
        quantity: readNumber(fields, 'quantity'),
        unit: readString(fields, 'unit'),
        unitCost: readNumber(fields, 'unitCost'),
        expiryDate: readString(fields, 'expiryDate').slice(0, 10),
        dateReceived: readString(fields, 'dateReceived').slice(0, 10),
        consumed: readBoolean(fields, 'consumed'),
        archived: readBoolean(fields, 'archived'),
      };
    });
  },

  async listWaste(idToken: string, restaurantId: string) {
    const docs = await firestoreRunQuery(
      idToken,
      'wasteLogs',
      'restaurantId',
      'EQUAL',
      restaurantId,
      120,
    );
    return docs.map((doc) => {
      const fields = doc.fields || {};
      const timestamp =
        fields.timestamp?.timestampValue ||
        fields.createdAt?.timestampValue ||
        '';
      return {
        id: docIdFromName(doc.name),
        ingredientName: readString(fields, 'ingredientName'),
        quantityWasted: readNumber(fields, 'quantityWasted'),
        unit: readString(fields, 'unit'),
        wasteReason: readString(fields, 'wasteReason'),
        costLoss: readNumber(fields, 'costLoss'),
        voided: readBoolean(fields, 'voided'),
        date: String(timestamp).slice(0, 10),
      };
    });
  },

  async listUsage(idToken: string, restaurantId: string) {
    const docs = await firestoreRunQuery(
      idToken,
      'inventory_usage',
      'restaurantId',
      'EQUAL',
      restaurantId,
      120,
    );
    return docs.map((doc) => {
      const fields = doc.fields || {};
      const timestamp =
        fields.usedAt?.timestampValue ||
        fields.createdAt?.timestampValue ||
        '';
      return {
        id: docIdFromName(doc.name),
        ingredientName: readString(fields, 'ingredientName'),
        quantityUsed: readNumber(fields, 'quantityUsed'),
        unit: readString(fields, 'unit'),
        category: readString(fields, 'category'),
        consumptionCost: readNumber(fields, 'consumptionCost'),
        voided: readBoolean(fields, 'voided'),
        date: String(timestamp).slice(0, 10),
      };
    });
  },

  async getAiAnalytics(idToken: string, restaurantId: string) {
    const doc = await firestoreGet(idToken, `aiAnalytics/${restaurantId}`);
    if (!doc?.fields) return null;
    return fromFirestoreDocument(doc);
  },

  async saveAiAnalytics(
    idToken: string,
    restaurantId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await firestorePatch(idToken, `aiAnalytics/${restaurantId}`, {
      ...payload,
      restaurantId,
    });
  },
};

function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return null;
  if (value.stringValue != null) return value.stringValue;
  if (value.integerValue != null) return Number(value.integerValue);
  if (typeof value.doubleValue === 'number') return value.doubleValue;
  if (value.booleanValue != null) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.timestampValue) return value.timestampValue;
  if (value.arrayValue?.values) {
    return value.arrayValue.values.map((item) => fromFirestoreValue(item));
  }
  if (value.mapValue?.fields) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value.mapValue.fields)) {
      out[key] = fromFirestoreValue(nested);
    }
    return out;
  }
  return null;
}

function fromFirestoreDocument(doc: FirestoreDocument): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc.fields || {})) {
    out[key] = fromFirestoreValue(value);
  }
  return out;
}

export type { ListResponse };
