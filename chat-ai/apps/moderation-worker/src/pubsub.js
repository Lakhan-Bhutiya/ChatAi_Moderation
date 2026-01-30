"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisPub = void 0;
var ioredis_1 = require("ioredis");
exports.redisPub = new ioredis_1.default({
    host: '127.0.0.1',
    port: 6379,
});
