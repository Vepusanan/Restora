import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({ maxInstances: 20 });

export { generateContent } from './gemini/generateContent';
export { askAiAssistant } from './ai/askAiAssistant';
export { deactivateStaff } from './auth/deactivateStaff';
export { evaluateInventoryExpiry } from './expiry/evaluateInventoryExpiry';
export { cleanupInvalidFCMTokens } from './messaging/cleanupInvalidFCMTokens';
export { sendRestaurantNotification } from './messaging/sendRestaurantNotification';
export { createWasteLog } from './waste/createWasteLog';
export { voidWasteEntry } from './waste/voidWasteEntry';
export { createUsageLog } from './consumption/createUsageLog';
export { voidUsageEntry } from './consumption/voidUsageEntry';
