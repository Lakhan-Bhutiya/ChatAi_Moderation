
// using native fetch
// Node 18+ has fetch. 
// I'll use native fetch

const TIMEZONE_INDIA = 'Asia/Kolkata';

async function run() {
    try {
        // 1. Guest Login
        console.log('Logging in as guest...');
        const loginRes = await fetch('http://localhost:3001/auth/guest', {
            method: 'POST',
        });
        if (!loginRes.ok) throw new Error('Login failed');
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Token received.');

        // 2. Post a message (using HTTP to ensure we create one)
        // Actually the app uses Socket to send, but let's see if there is an HTTP endpoint for sending?
        // Looking at app.js: socket.emit('sendMessage', ...)
        // There might NOT be a POST /messages endpoint for creation, usually it's websocket.
        // However, I can try to find if there is a controller method.
        // But I can mostly rely on reading EXISTING messages if any.
        // Or I can use a simple socket client script.

        // Let's try to just READ messages from 'general' room or similar.
        const room = 'debug-room-' + Date.now();
        console.log(`Checking room: ${room}`);

        // Wait, if I cannot send a message via HTTP, passing an empty room might return empty list.
        // I need to send a message via Socket.IO to really test "creation time".
        // Or I can manually insert into DB? No, I don't have DB access credentials handy (env file).

        // I'll try to just FETCH existing messages from proper room "general" if it exists, or just any room.
        // But I'll stick to my plan: use socket-io-client to send.

        const { io } = require('socket.io-client');
        const socket = io('http://localhost:3001', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Socket connected. Joining room...');
            socket.emit('joinRoom', { roomId: room });

            // Send message
            setTimeout(() => {
                console.log('Sending message...');
                socket.emit('sendMessage', { roomId: room, content: 'Time test' });
            }, 1000);
        });

        socket.on('newMessage', (msg) => {
            console.log('Received message via socket:', msg);
            console.log('Raw createdAt:', msg.createdAt);

            // Helper to mimic frontend
            const date = new Date(msg.createdAt);
            console.log('Date object:', date.toString());
            console.log('Date ISO:', date.toISOString());

            const timeStr = new Intl.DateTimeFormat('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: TIMEZONE_INDIA,
            }).format(date);

            console.log('Formatted Time (India):', timeStr);

            socket.disconnect();
            process.exit(0);
        });

        setTimeout(() => {
            console.log('Timeout waiting for message');
            socket.disconnect();
            process.exit(1);
        }, 5000);

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
