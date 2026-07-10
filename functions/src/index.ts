import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({ maxInstances: 20 });

export { generateContent } from './gemini/generateContent';
export { deactivateStaff } from './auth/deactivateStaff';
export { evaluateInventoryExpiry } from './expiry/evaluateInventoryExpiry';
export { cleanupInvalidFCMTokens } from './messaging/cleanupInvalidFCMTokens';
export { createWasteLog } from './waste/createWasteLog';
export { voidWasteEntry } from './waste/voidWasteEntry';
