"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateContent = moderateContent;
var groq_client_1 = require("./groq.client");
function moderateContent(content) {
    return __awaiter(this, void 0, void 0, function () {
        var response, verdict;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, groq_client_1.groq.chat.completions.create({
                        model: 'meta-llama/llama-guard-4-12b',
                        temperature: 0,
                        messages: [
                            {
                                role: 'system',
                                content: "\nYou are a STRICT content moderation classifier.\n\nClassify the USER MESSAGE into EXACTLY ONE of these labels:\n- SAFE\n- MINOR\n- MAJOR\n\nDefinitions:\nSAFE:\n- Normal conversation\n- Neutral statements\n- Polite language\n\nMINOR:\n- Insults\n- Harassment\n- Profanity\n- Abusive language\n\nMAJOR:\n- Threats\n- Violence\n- Hate speech\n- Sexual violence\n- Terrorism\n\nRules:\n- Respond with ONLY one word: SAFE, MINOR, or MAJOR\n- No punctuation\n- No explanation\n- No extra text\n\nExamples:\n\"hello\" -> SAFE\n\"you are stupid\" -> MINOR\n\"fuck you\" -> MINOR\n\"I will kill you\" -> MAJOR\n        ".trim(),
                            },
                            {
                                role: 'user',
                                content: content,
                            },
                        ],
                    })];
                case 1:
                    response = _d.sent();
                    verdict = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim().toUpperCase();
                    if (verdict === 'SAFE') {
                        return [2 /*return*/, { flagged: false, severity: 'none' }];
                    }
                    if (verdict === 'MAJOR') {
                        return [2 /*return*/, { flagged: true, severity: 'major' }];
                    }
                    // default = MINOR
                    return [2 /*return*/, { flagged: true, severity: 'minor' }];
            }
        });
    });
}
