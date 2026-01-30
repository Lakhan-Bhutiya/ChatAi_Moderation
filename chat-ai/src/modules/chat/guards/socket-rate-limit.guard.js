"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketRateLimiter = void 0;
var SocketRateLimiter = /** @class */ (function () {
    function SocketRateLimiter() {
        this.buckets = new Map();
        this.LIMIT = 5;
        this.WINDOW_MS = 10000;
    }
    SocketRateLimiter.prototype.allow = function (userId) {
        var now = Date.now();
        var bucket = this.buckets.get(userId);
        if (!bucket || bucket.resetAt < now) {
            this.buckets.set(userId, {
                count: 1,
                resetAt: now + this.WINDOW_MS,
            });
            return true;
        }
        if (bucket.count >= this.LIMIT) {
            return false;
        }
        bucket.count += 1;
        return true;
    };
    return SocketRateLimiter;
}());
exports.SocketRateLimiter = SocketRateLimiter;
