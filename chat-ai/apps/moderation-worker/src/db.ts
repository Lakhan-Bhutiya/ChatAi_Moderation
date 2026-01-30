import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';

export const WorkerDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,               // ✅ matches your Docker mapping
  username: 'postgres',
  password: 'postgres',
  database: 'chatai',
  entities: [Message, User], // ✅ BOTH entities registered
  synchronize: false,
});
