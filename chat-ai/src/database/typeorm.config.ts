import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: '127.0.0.1',
  port: 5433, // 🔴 UPDATED
  username: 'postgres',
  password: 'postgres',
  database: 'chatai',
  autoLoadEntities: true,
  synchronize: true,
};
