"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHeartbeat = startHeartbeat;
var logger_1 = require("./logger");
function startHeartbeat() {
    setInterval(function () {
        logger_1.AppLogger.info('worker.heartbeat', {
            service: 'moderation-worker',
        });
    }, 10000);
}
