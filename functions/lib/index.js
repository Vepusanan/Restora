"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateStaff = exports.generateContent = void 0;
const app_1 = require("firebase-admin/app");
const v2_1 = require("firebase-functions/v2");
(0, app_1.initializeApp)();
(0, v2_1.setGlobalOptions)({ maxInstances: 20 });
var generateContent_1 = require("./gemini/generateContent");
Object.defineProperty(exports, "generateContent", { enumerable: true, get: function () { return generateContent_1.generateContent; } });
var deactivateStaff_1 = require("./auth/deactivateStaff");
Object.defineProperty(exports, "deactivateStaff", { enumerable: true, get: function () { return deactivateStaff_1.deactivateStaff; } });
//# sourceMappingURL=index.js.map