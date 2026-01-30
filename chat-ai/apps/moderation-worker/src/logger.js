"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
var AppLogger = /** @class */ (function () {
    function AppLogger() {
    }
    AppLogger.info = function (message, meta) {
        console.log(JSON.stringify(__assign({ level: 'info', time: new Date().toISOString(), message: message }, meta)));
    };
    AppLogger.warn = function (message, meta) {
        console.warn(JSON.stringify(__assign({ level: 'warn', time: new Date().toISOString(), message: message }, meta)));
    };
    AppLogger.error = function (message, meta) {
        console.error(JSON.stringify(__assign({ level: 'error', time: new Date().toISOString(), message: message }, meta)));
    };
    return AppLogger;
}());
exports.AppLogger = AppLogger;
