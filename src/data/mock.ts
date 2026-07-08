import type {
  AnalyticsSummary,
  AppNotification,
  DashboardStats,
  IngredientGroup,
  StaffMember,
  WasteLogEntry,
} from '@/src/types/restora';

export const MOCK_RESTAURANT = {
  id: 'rest_001',
  name: 'Spice Garden Kitchen',
  code: 'SGK-7X2M',
  currency: 'LKR',
};

export const MOCK_ADMIN_STATS: DashboardStats = {
  totalInventoryValue: 284500,
  wasteThisWeek: 12400,
  expiringItems: 7,
  activeStaff: 5,
  lowStockItems: 3,
};

export const MOCK_STAFF_STATS = {
  expiringItems: 7,
  lowStockItems: 3,
  batchesLoggedToday: 4,
  wasteLoggedToday: 2,
};

export const MOCK_INGREDIENTS: IngredientGroup[] = [
  {
    id: 'ing_1',
    name: 'Chicken Breast',
    category: 'Protein',
    unit: 'kg',
    totalQuantity: 18.5,
    batches: [
      {
        id: 'b1',
        quantity: 6,
        unit: 'kg',
        costPerUnit: 1850,
        supplier: 'Fresh Farms Ltd',
        receivedDate: '2026-07-01',
        expiryDate: '2026-07-09',
        expiryStatus: 'expiring',
        isFifo: true,
      },
      {
        id: 'b2',
        quantity: 12.5,
        unit: 'kg',
        costPerUnit: 1780,
        supplier: 'Metro Meats',
        receivedDate: '2026-07-05',
        expiryDate: '2026-07-14',
        expiryStatus: 'safe',
        isFifo: false,
      },
    ],
  },
  {
    id: 'ing_2',
    name: 'Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    totalQuantity: 9,
    batches: [
      {
        id: 'b3',
        quantity: 4,
        unit: 'kg',
        costPerUnit: 320,
        supplier: 'Green Valley',
        receivedDate: '2026-06-28',
        expiryDate: '2026-07-07',
        expiryStatus: 'expired',
        isFifo: true,
      },
      {
        id: 'b4',
        quantity: 5,
        unit: 'kg',
        costPerUnit: 340,
        supplier: 'Green Valley',
        receivedDate: '2026-07-06',
        expiryDate: '2026-07-12',
        expiryStatus: 'safe',
        isFifo: false,
      },
    ],
  },
  {
    id: 'ing_3',
    name: 'Coconut Milk',
    category: 'Dairy & Alternatives',
    unit: 'L',
    totalQuantity: 12,
    batches: [
      {
        id: 'b5',
        quantity: 12,
        unit: 'L',
        costPerUnit: 450,
        supplier: 'Island Foods',
        receivedDate: '2026-07-03',
        expiryDate: '2026-07-20',
        expiryStatus: 'safe',
        isFifo: true,
      },
    ],
  },
  {
    id: 'ing_4',
    name: 'Basmati Rice',
    category: 'Dry Goods',
    unit: 'kg',
    totalQuantity: 25,
    batches: [
      {
        id: 'b6',
        quantity: 25,
        unit: 'kg',
        costPerUnit: 280,
        supplier: 'Grain Traders',
        receivedDate: '2026-06-15',
        expiryDate: '2026-12-15',
        expiryStatus: 'safe',
        isFifo: true,
      },
    ],
  },
];

export const MOCK_WASTE_LOGS: WasteLogEntry[] = [
  {
    id: 'w1',
    ingredientName: 'Tomatoes',
    quantity: 2,
    unit: 'kg',
    reason: 'Spoilage',
    costLoss: 640,
    loggedBy: 'Kamal Perera',
    loggedAt: '2026-07-08T09:30:00',
  },
  {
    id: 'w2',
    ingredientName: 'Chicken Breast',
    quantity: 1.5,
    unit: 'kg',
    reason: 'Over-preparation',
    costLoss: 2775,
    loggedBy: 'Nimal Silva',
    loggedAt: '2026-07-07T14:15:00',
  },
];

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 's1',
    name: 'Kamal Perera',
    email: 'kamal@spicegarden.lk',
    role: 'staff',
    status: 'approved',
    joinedAt: '2026-05-10',
  },
  {
    id: 's2',
    name: 'Nimal Silva',
    email: 'nimal@spicegarden.lk',
    role: 'staff',
    status: 'approved',
    joinedAt: '2026-05-22',
  },
  {
    id: 's3',
    name: 'Priya Fernando',
    email: 'priya@spicegarden.lk',
    role: 'staff',
    status: 'pending',
    joinedAt: '2026-07-08',
  },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Chicken Breast expiring soon',
    body: '6 kg batch expires on Jul 9. Use FIFO batch first.',
    type: 'expiry',
    read: false,
    createdAt: '2026-07-08T08:00:00',
  },
  {
    id: 'n2',
    title: 'Tomatoes expired',
    body: '4 kg batch has passed expiry date. Log waste or remove.',
    type: 'expiry',
    read: false,
    createdAt: '2026-07-08T07:30:00',
  },
  {
    id: 'n3',
    title: 'New staff registration',
    body: 'Priya Fernando requested to join your restaurant.',
    type: 'staff',
    read: true,
    createdAt: '2026-07-08T06:00:00',
  },
  {
    id: 'n4',
    title: 'Weekly waste summary',
    body: 'Waste cost this week: LKR 12,400 across 8 events.',
    type: 'waste',
    read: true,
    createdAt: '2026-07-07T18:00:00',
  },
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  wasteTrend: [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 800 },
    { label: 'Wed', value: 2100 },
    { label: 'Thu', value: 1500 },
    { label: 'Fri', value: 3200 },
    { label: 'Sat', value: 2800 },
    { label: 'Sun', value: 900 },
  ],
  costByCategory: [
    { label: 'Protein', value: 45 },
    { label: 'Vegetables', value: 22 },
    { label: 'Dairy', value: 15 },
    { label: 'Dry Goods', value: 18 },
  ],
  topWasted: [
    { label: 'Chicken', value: 4200 },
    { label: 'Tomatoes', value: 2800 },
    { label: 'Lettuce', value: 1900 },
    { label: 'Cream', value: 1500 },
  ],
};

export const WASTE_REASONS = [
  'Spoilage',
  'Over-preparation',
  'Dropped/Contaminated',
  'Expired',
  'Customer return',
  'Other',
];

export const INGREDIENT_CATEGORIES = [
  'Protein',
  'Vegetables',
  'Fruits',
  'Dairy & Alternatives',
  'Dry Goods',
  'Spices & Sauces',
  'Beverages',
  'Other',
];

export function formatCurrency(amount: number, currency = 'LKR'): string {
  return `${currency} ${amount.toLocaleString('en-LK')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-LK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
