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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchBuffer = void 0;
var moderation_engine_1 = require("./moderation-engine");
var reputation_constants_1 = require("./reputation.constants");
var reputation_util_1 = require("./reputation.util");
var pubsub_1 = require("./pubsub");
var logger_1 = require("./logger");
var BatchBuffer = /** @class */ (function () {
    function BatchBuffer(flushIntervalMs, messageRepo, userRepo) {
        this.flushIntervalMs = flushIntervalMs;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.buffer = [];
        this.timer = null;
    }
    BatchBuffer.prototype.add = function (message) {
        var _this = this;
        this.buffer.push(message);
        if (!this.timer) {
            this.timer = setTimeout(function () {
                _this.flush();
            }, this.flushIntervalMs);
        }
    };
    BatchBuffer.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var messages, _i, messages_1, msg, result, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.buffer.length === 0) {
                            this.timer = null;
                            return [2 /*return*/];
                        }
                        console.log("\uD83E\uDDE0 Moderation batch started (".concat(this.buffer.length, " messages)"));
                        messages = __spreadArray([], this.buffer, true);
                        this.buffer = [];
                        this.timer = null;
                        _i = 0, messages_1 = messages;
                        _a.label = 1;
                    case 1:
                        if (!(_i < messages_1.length)) return [3 /*break*/, 11];
                        msg = messages_1[_i];
                        return [4 /*yield*/, (0, moderation_engine_1.moderateContent)(msg.content)];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, this.userRepo.findOneBy({ id: msg.userId })];
                    case 3:
                        user = _a.sent();
                        if (!user)
                            return [3 /*break*/, 10];
                        if (!!result.flagged) return [3 /*break*/, 6];
                        msg.status = 'approved';
                        msg.severity = 'none';
                        msg.moderatedAt = new Date();
                        return [4 /*yield*/, this.messageRepo.save(msg)];
                    case 4:
                        _a.sent();
                        user.cleanMessageCount += 1;
                        if (user.cleanMessageCount >= reputation_constants_1.CLEAN_REWARD_THRESHOLD) {
                            user.cleanMessageCount = 0;
                            user.reputationScore = Math.min(reputation_constants_1.REPUTATION_LIMITS.MAX, user.reputationScore + 1);
                        }
                        user.tier = (0, reputation_util_1.calculateTier)(user.reputationScore);
                        return [4 /*yield*/, this.userRepo.save(user)];
                    case 5:
                        _a.sent();
                        logger_1.AppLogger.info('moderation.approved', {
                            messageId: msg.id,
                            userId: msg.userId,
                        });
                        console.log("\u2705 Clean message | user=".concat(user.id, " score=").concat(user.reputationScore));
                        return [3 /*break*/, 10];
                    case 6:
                        // 🔴 FLAGGED MESSAGE
                        msg.status = 'removed';
                        msg.deleted = true;
                        msg.severity = result.severity;
                        msg.moderatedAt = new Date();
                        return [4 /*yield*/, this.messageRepo.save(msg)];
                    case 7:
                        _a.sent();
                        if (result.severity === 'major') {
                            user.reputationScore = Math.max(reputation_constants_1.REPUTATION_LIMITS.MIN, user.reputationScore - reputation_constants_1.PENALTY.MAJOR_MIN);
                        }
                        else {
                            user.reputationScore = Math.max(reputation_constants_1.REPUTATION_LIMITS.MIN, user.reputationScore - reputation_constants_1.PENALTY.MINOR);
                        }
                        user.warningIssued = true;
                        user.cleanMessageCount = 0;
                        user.tier = (0, reputation_util_1.calculateTier)(user.reputationScore);
                        return [4 /*yield*/, this.userRepo.save(user)];
                    case 8:
                        _a.sent();
                        logger_1.AppLogger.warn('moderation.removed', {
                            messageId: msg.id,
                            userId: msg.userId,
                            severity: result.severity,
                        });
                        console.log("\uD83D\uDDD1\uFE0F Message removed [".concat(result.severity, "] | user=").concat(user.id));
                        // 🔥 Notify API via Redis
                        return [4 /*yield*/, pubsub_1.redisPub.publish('moderation.message.deleted', JSON.stringify({
                                messageId: msg.id,
                                roomId: msg.roomId,
                                severity: result.severity,
                            }))];
                    case 9:
                        // 🔥 Notify API via Redis
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 1];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return BatchBuffer;
}());
exports.BatchBuffer = BatchBuffer;
