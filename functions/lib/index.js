"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupInvalidFCMTokens = exports.evaluateInventoryExpiry = exports.deactivateStaff = exports.generateContent = void 0;
const app_1 = require("firebase-admin/app");
const v2_1 = require("firebase-functions/v2");
(0, app_1.initializeApp)();
(0, v2_1.setGlobalOptions)({ maxInstances: 20 });
var generateContent_1 = require("./gemini/generateContent");
Object.defineProperty(exports, "generateContent", { enumerable: true, get: function () { return generateContent_1.generateContent; } });
var deactivateStaff_1 = require("./auth/deactivateStaff");
Object.defineProperty(exports, "deactivateStaff", { enumerable: true, get: function () { return deactivateStaff_1.deactivateStaff; } });
var evaluateInventoryExpiry_1 = require("./expiry/evaluateInventoryExpiry");
Object.defineProperty(exports, "evaluateInventoryExpiry", { enumerable: true, get: function () { return evaluateInventoryExpiry_1.evaluateInventoryExpiry; } });
var cleanupInvalidFCMTokens_1 = require("./messaging/cleanupInvalidFCMTokens");
Object.defineProperty(exports, "cleanupInvalidFCMTokens", { enumerable: true, get: function () { return cleanupInvalidFCMTokens_1.cleanupInvalidFCMTokens; } });
//# sourceMappingURL=index.js.map