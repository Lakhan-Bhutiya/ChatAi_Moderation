
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

        const room = 'history-test-' + Date.now();
        console.log(`Testing room: ${room}`);

        // 2. Connect via socket to send a message
        const socket = io('http://localhost:3000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Socket connected. Joining room...');
            socket.emit('joinRoom', { roomId: room });

            // Send message
            setTimeout(() => {
                console.log('Sending message 1...');
                socket.emit('sendMessage', { roomId: room, content: 'History Test 1' });

                setTimeout(() => {
                    console.log('Sending message 2...');
                    socket.emit('sendMessage', { roomId: room, content: 'History Test 2' });

                    // 3. Fetch history via HTTP after a delay
                    setTimeout(fetchHistory, 2000);
                }, 500);
            }, 500);
        });

        async function fetchHistory() {
            console.log('Fetching history...');
            try {
                const res = await fetch(`http://localhost:3000/messages?roomId=${room}&limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('Response Status:', res.status);

                const text = await res.text();
                console.log('Response Body:', text);

                let messages;
                try {
                    messages = JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse JSON:', e);
                    return;
                }

                if (!Array.isArray(messages)) {
                    console.error('Response is not an array!');
                    return;
                }

                console.log(`Fetched ${messages.length} messages.`);
                messages.forEach(m => console.log(`- [${m.createdAt}] ${m.content}`));

                socket.disconnect();

                if (messages.length === 2) {
                    console.log('✅ History fetch SUCCESS');
                } else {
                    console.log('❌ History fetch FAILED');
                }
            } catch (e) {
                console.error('Fetch error:', e);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
