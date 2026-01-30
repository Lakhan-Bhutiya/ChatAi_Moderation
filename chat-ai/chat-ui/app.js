const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let socket;
let token;

// 1️⃣ Guest login
async function login() {
  const res = await fetch('http://localhost:3000/auth/guest', {
    method: 'POST',
  });
  const data = await res.json();
  token = data.token;
}

// 2️⃣ Connect socket
function connectSocket() {
  socket = io('http://localhost:3000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Connected', socket.id);
    socket.emit('joinRoom', { roomId: 'room-1' });
  });

  socket.on('newMessage', (msg) => {
    addMessage(msg.content, 'pending', msg.id);
  });

  socket.on('messageApproved', ({ messageId }) => {
    updateMessage(messageId, 'approved');
  });

  socket.on('messageRemoved', ({ messageId }) => {
    updateMessage(messageId, 'removed');
  });

  socket.on('rateLimit', (data) => {
    alert(data.message);
  });
}

// 3️⃣ UI helpers
function addMessage(text, status, id) {
  const div = document.createElement('div');
  div.className = `message ${status}`;
  div.textContent = text;
  div.dataset.id = id;
  messagesEl.appendChild(div);
}

function updateMessage(id, status) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  if (status === 'removed') {
    el.textContent = '⚠️ Message removed by moderation';
    el.className = 'message removed';
  } else {
    el.className = 'message';
  }
}

// 4️⃣ Send message
sendBtn.onclick = () => {
  if (!inputEl.value.trim()) return;

  socket.emit('sendMessage', {
    roomId: 'room-1',
    content: inputEl.value,
  });

  inputEl.value = '';
};

// Init
(async function start() {
  await login();
  connectSocket();
})();
