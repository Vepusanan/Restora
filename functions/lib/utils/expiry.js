"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPRESSION_MS = exports.DEFAULT_AMBER_DAYS = void 0;
exports.startOfDay = startOfDay;
exports.parseDateOnly = parseDateOnly;
exports.daysUntilExpiry = daysUntilExpiry;
exports.clampExpiryThreshold = clampExpiryThreshold;
exports.getExpiryTone = getExpiryTone;
exports.isExpiryTransition = isExpiryTransition;
exports.shouldSuppressDuplicate = shouldSuppressDuplicate;
exports.buildExpiryNotificationCopy = buildExpiryNotificationCopy;
const DAY_MS = 24 * 60 * 60 * 1000;
exports.DEFAULT_AMBER_DAYS = 3;
exports.SUPPRESSION_MS = 24 * 60 * 60 * 1000;
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function parseDateOnly(value) {
    const datePart = String(value).slice(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day)
        return new Date(NaN);
    return new Date(year, month - 1, day);
}
function daysUntilExpiry(expiryDate, now = new Date()) {
    const expiry = startOfDay(parseDateOnly(expiryDate));
    const today = startOfDay(now);
    return Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
}
function clampExpiryThreshold(value) {
    if (!Number.isFinite(value))
        return exports.DEFAULT_AMBER_DAYS;
    return Math.max(1, Math.min(30, Math.floor(value)));
}
function getExpiryTone(expiryDate, now = new Date(), amberDays = exports.DEFAULT_AMBER_DAYS) {
    const threshold = clampExpiryThreshold(amberDays);
    const days = daysUntilExpiry(expiryDate, now);
    if (days < 0)
        return 'red';
    if (days <= threshold)
        return 'amber';
    return 'green';
}
function isExpiryTransition(previous, next) {
    if (next !== 'amber' && next !== 'red')
        return false;
    const prev = previous ?? 'green';
    return ((prev === 'green' && next === 'amber') ||
        (prev === 'amber' && next === 'red') ||
        (prev === 'green' && next === 'red'));
}
function shouldSuppressDuplicate(input) {
    if (input.lastNotifiedTone !== input.nextTone || !input.lastNotifiedAt)
        return false;
    const now = input.now ?? new Date();
    return now.getTime() - input.lastNotifiedAt.getTime() < exports.SUPPRESSION_MS;
}
function buildExpiryNotificationCopy(input) {
    const qty = `${input.quantity}${input.unit}`;
    const title = 'Inventory Expiry Alert';
    if (input.status === 'red') {
        const overdue = Math.abs(input.daysRemaining);
        const body = overdue === 0
            ? `${input.ingredientName} (${qty}) expired today.`
            : `${input.ingredientName} (${qty}) expired ${overdue} day${overdue === 1 ? '' : 's'} ago.`;
        return { title, body };
    }
    const days = input.daysRemaining;
    const body = days === 0
        ? `${input.ingredientName} (${qty}) expires today.`
        : `${input.ingredientName} (${qty}) will expire in ${days} day${days === 1 ? '' : 's'}.`;
    return { title, body };
}
//# sourceMappingURL=expiry.js.map