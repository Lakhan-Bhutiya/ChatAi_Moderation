"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisConnection = void 0;
var createRedisConnection = function (configService) { return ({
    host: configService.get('REDIS_HOST'),
    port: Number(configService.get('REDIS_PORT')),
    maxRetriesPerRequest: null,
}); };
exports.createRedisConnection = createRedisConnection;
