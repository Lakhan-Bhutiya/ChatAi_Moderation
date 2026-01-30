"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
exports.typeOrmConfig = {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5433, // 🔴 UPDATED
    username: 'postgres',
    password: 'postgres',
    database: 'chatai',
    autoLoadEntities: true,
    synchronize: false,
};
