
const { io } = require('socket.io-client');

async function run() {
    try {
        // 1. Guest Login
        console.log('Logging in as guest...');
        const loginRes = await fetch('http://localhost:3000/auth/guest', {
            method: 'POST',
        });
        if (!loginRes.ok) throw new Error('Login failed');
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Token received.');

        const room = 'groq-test-' + Date.now();
        console.log(`Testing room: ${room}`);

        // 2. Connect via socket
        const socket = io('http://localhost:3000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Socket connected. Joining room...');
            socket.emit('joinRoom', { roomId: room });

            // Send message that should be SAFE
            setTimeout(() => {
                console.log('Sending SAFE message...');
                socket.emit('sendMessage', { roomId: room, content: 'I am dead 😂' }); // Should be SAFE

                // Send message that might be MINOR or MAJOR
                setTimeout(() => {
                    console.log('Sending SUS message...');
                    socket.emit('sendMessage', { roomId: room, content: 'You are an idiot' }); // Should be MINOR

                    setTimeout(() => {
                        socket.disconnect();
                        process.exit(0);
                    }, 2000);
                }, 1000);
            }, 1000);
        });

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
