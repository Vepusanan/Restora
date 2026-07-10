import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({ maxInstances: 20 });

export { generateContent } from './gemini/generateContent';
export { deactivateStaff } from './auth/deactivateStaff';
