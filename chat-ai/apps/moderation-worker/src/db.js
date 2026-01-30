"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerDataSource = void 0;
require("reflect-metadata");
var typeorm_1 = require("typeorm");
var message_entity_1 = require("./message.entity");
var user_entity_1 = require("./user.entity");
exports.WorkerDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433, // ✅ matches your Docker mapping
    username: 'postgres',
    password: 'postgres',
    database: 'chatai',
    entities: [message_entity_1.Message, user_entity_1.User], // ✅ BOTH entities registered
    synchronize: false,
});
