
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'chatai',
    password: 'postgres',
    port: 5433,
});

async function run() {
    try {
        await client.connect();
        console.log('Running ALTER TABLE...');
        await client.query('ALTER TABLE messages ALTER COLUMN "createdAt" TYPE timestamptz');
        console.log('ALTER TABLE success.');
        const res = await client.query('SELECT NOW() as db_time');
        console.log('🔴 DB TIME:', res.rows[0].db_time);
        console.log('🔴 DB TIME (String):', res.rows[0].db_time.toString());
        console.log('🔴 DB TIME (ISO):', res.rows[0].db_time.toISOString());
        console.log('🔴 Client Date:', new Date().toString());
        await client.end();
    } catch (e) {
        console.error(e);
    }
}

run();
