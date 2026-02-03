// DOM Elements
const API_URL = `http://${window.location.hostname}:3000`;
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const joinBtn = document.getElementById('joinBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const roomInput = document.getElementById('roomInput');
const roomSelector = document.getElementById('roomSelector');
const chatArea = document.getElementById('chatArea');
const currentRoomEl = document.getElementById('currentRoom');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = connectionStatus.querySelector('.status-text');
const loadingMessages = document.getElementById('loadingMessages');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const usernameDisplay = document.getElementById('usernameDisplay');
const tierDisplay = document.getElementById('tierDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authModalTitle = document.getElementById('authModalTitle');
const authError = document.getElementById('authError');

let socket;
let token;
let userId;
let username;
let userTier = 'neutral';
let reputationScore = 50;
let currentRoom = null;
let messageMap = new Map();

const STORAGE_KEY = 'chatai_auth';

function saveAuthToStorage() {
  if (token && userId) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        token,
        userId,
        username: username || '',
        userTier: userTier || 'neutral',
        reputationScore: reputationScore ?? 50,
      }));
    } catch (e) { /* ignore */ }
  }
}

function loadAuthFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.token && data.userId) {
      token = data.token;
      userId = data.userId;
      username = data.username || `guest_${(data.userId || '').substring(0, 6)}`;
      userTier = data.userTier || 'neutral';
      reputationScore = data.reputationScore ?? 50;
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function clearAuthStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* ignore */ }
}

// 1️⃣ Authentication
async function guestLogin() {
  try {
    const res = await fetch(`${API_URL}/auth/guest`, {
      method: 'POST',
    });
    const data = await res.json();
    token = data.token;
    userId = data.userId;
    username = data.username || `guest_${userId.substring(0, 6)}`;
    userTier = data.tier || 'neutral';
    reputationScore = data.reputationScore || 50;
    saveAuthToStorage();
    updateUserUI();
    return true;
  } catch (error) {
    console.error('Guest login failed:', error);
    showError('Failed to connect to server');
    return false;
  }
}

async function login(usernameInput, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    token = data.token;
    userId = data.userId;
    username = data.username;
    userTier = data.tier || 'neutral';
    reputationScore = data.reputationScore || 50;
    saveAuthToStorage();
    updateUserUI();
    closeAuthModal();
    showNotification('Logged in successfully!', 'info');
    return true;
  } catch (error) {
    showAuthError(error.message || 'Login failed');
    return false;
  }
}

async function signup(usernameInput, password) {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Signup failed');
    }

    const data = await res.json();
    token = data.token;
    userId = data.userId;
    username = data.username;
    userTier = data.tier || 'neutral';
    reputationScore = data.reputationScore || 50;
    saveAuthToStorage();
    updateUserUI();
    closeAuthModal();
    showNotification('Account created successfully!', 'info');
    return true;
  } catch (error) {
    showAuthError(error.message || 'Signup failed');
    return false;
  }
}

async function logout() {
  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Logout API failed', e);
    }
  }

  token = null;
  userId = null;
  username = null;
  userTier = 'neutral';
  reputationScore = 50;
  clearAuthStorage();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentRoom = null;
  messagesEl.innerHTML = '';
  messageMap.clear();
  chatArea.classList.add('hidden');
  roomSelector.classList.remove('hidden');
  updateUserUI();
  showNotification('Logged out', 'info');
}

function updateUserUI() {
  if (token && username) {
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    usernameDisplay.textContent = username;

    // Update tier display
    const tierColors = {
      trusted: '#10b981', // green
      neutral: '#f59e0b', // amber
      suspect: '#ef4444', // red
    };

    const tierLabels = {
      trusted: '⭐ Trusted',
      neutral: '⚖️ Neutral',
      suspect: '⚠️ Suspect',
    };

    tierDisplay.textContent = tierLabels[userTier] || tierLabels.neutral;
    tierDisplay.style.color = tierColors[userTier] || tierColors.neutral;
    tierDisplay.title = `Reputation Score: ${reputationScore}/100`;
  } else {
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

async function refreshUserInfo() {
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      userTier = data.tier || 'neutral';
      reputationScore = data.reputationScore || 50;
      updateUserUI();
    }
  } catch (error) {
    console.error('Failed to refresh user info:', error);
  }
}

function showAuthModal(isSignup = false) {
  authModal.classList.remove('hidden');
  if (isSignup) {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authModalTitle.textContent = 'Sign Up';
  } else {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authModalTitle.textContent = 'Login';
  }
  authError.classList.add('hidden');
}

function closeAuthModal() {
  authModal.classList.add('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('signupUsername').value = '';
  document.getElementById('signupPassword').value = '';
  authError.classList.add('hidden');
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

// 2️⃣ Socket Connection
function connectSocket() {
  if (!token) {
    showError('Not logged in');
    return;
  }

  socket = io(API_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Connected', socket.id);
    updateConnectionStatus(true);
    if (currentRoom) {
      socket.emit('joinRoom', { roomId: currentRoom });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected');
    updateConnectionStatus(false);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    updateConnectionStatus(false);
  });

  socket.on('error', (data) => {
    console.error('Socket error:', data);
    showNotification(data.message || 'An error occurred', 'error');
  });

  socket.on('newMessage', (msg) => {
    console.log('📨 New message:', msg);
    const msgUsername = msg.user?.username || 'Unknown';
    addMessage(
      msg.content,
      msg.status || 'pending',
      msg.id,
      msg.createdAt,
      msg.userId,
      msgUsername,
      true
    );
  });

  socket.on('messageApproved', (event) => {
    console.log('✅ Message approved:', event);
    updateMessageStatus(event.messageId, 'approved');
    // Refresh user info to update tier/reputation
    refreshUserInfo();
  });

  socket.on('messageRemoved', (event) => {
    console.log('🗑️ Message removed:', event);
    const messageId = event.messageId || event;
    updateMessageStatus(messageId, 'removed');
  });

  socket.on('rateLimit', (data) => {
    showNotification(data.message || 'Rate limit exceeded. Please wait.');
  });
}

// 3️⃣ Room Management
// History: loaded once via HTTP on join. New/updated messages only via WebSocket (no refetch) to keep WS efficient.
async function joinRoom(roomId) {
  if (!token) {
    showError('Please login first');
    return;
  }

  if (!roomId || !roomId.trim()) {
    showError('Please enter a room ID');
    return;
  }

  currentRoom = roomId.trim();
  currentRoomEl.textContent = currentRoom;
  messageMap.clear();

  // Show loading state (re-insert loading div so it's visible)
  messagesEl.innerHTML = '<div id="loadingMessages" class="loading">Loading messages...</div>';

  if (socket && socket.connected) {
    socket.emit('joinRoom', { roomId: currentRoom });
  }

  // Load saved messages from DB once (approved + pending). No refetch on socket events to preserve WebSocket efficiency.
  async function fetchMessages(retryOn401 = true) {
    if (!token) {
      messagesEl.innerHTML = '<div class="empty-state">Please log in first.</div>';
      return;
    }
    const res = await fetch(
      `${API_URL}/messages?roomId=${encodeURIComponent(currentRoom)}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await res.json().catch(() => ({}));

    if (res.ok && Array.isArray(data)) {
      const messages = data;
      messagesEl.innerHTML = '';

      if (messages.length === 0) {
        messagesEl.innerHTML = '<div class="empty-state">No messages yet. Be the first to say something!</div>';
      } else {
        messages.forEach(msg => {
          const msgUsername = (msg.user && msg.user.username) ? msg.user.username : 'Unknown';
          addMessage(
            msg.content,
            msg.status || 'approved',
            msg.id,
            msg.createdAt,
            msg.userId,
            msgUsername,
            false
          );
        });
        scrollToBottom();
      }
      return;
    }

    if (res.status === 401 && retryOn401) {
      clearAuthStorage();
      const refreshed = await guestLogin();
      if (refreshed) {
        saveAuthToStorage();
        connectSocket();
        return fetchMessages(false);
      }
    }

    const errMsg = data.message || (res.status === 401 ? 'Please log in again' : res.status === 403 ? 'Access denied' : 'Failed to load messages');
    messagesEl.innerHTML = `<div class="empty-state">${errMsg}</div>`;
  }

  try {
    await fetchMessages();
  } catch (error) {
    console.error('Failed to load messages:', error);
    messagesEl.innerHTML = '<div class="empty-state">Failed to load messages. Check your connection and that the server is running.</div>';
  }

  roomSelector.classList.add('hidden');
  chatArea.classList.remove('hidden');
}

function leaveRoom() {
  const roomToLeave = currentRoom;
  currentRoom = null;
  messagesEl.innerHTML = '';
  messageMap.clear();
  chatArea.classList.add('hidden');
  roomSelector.classList.remove('hidden');
  if (socket && roomToLeave) {
    socket.emit('leaveRoom', { roomId: roomToLeave });
  }
}

// 4️⃣ Message Management
function addMessage(text, status, id, createdAt, msgUserId, msgUsername, shouldScroll = true) {
  if (messageMap.has(id)) {
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${status}`;
  messageDiv.dataset.id = id;
  messageDiv.dataset.status = status;

  const isOwnMessage = msgUserId === userId;
  const timeStr = createdAt ? formatMessageTime(new Date(createdAt)) : formatMessageTime(new Date());

  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="message-status">${getStatusIcon(status)}</span>
      <span class="message-username ${isOwnMessage ? 'own-message' : ''}">${escapeHtml(msgUsername)}</span>
      <span class="message-time">${timeStr}</span>
      ${isOwnMessage ? '<span class="message-badge">You</span>' : ''}
    </div>
    <div class="message-content">${escapeHtml(text)}</div>
  `;

  messagesEl.appendChild(messageDiv);
  messageMap.set(id, messageDiv);

  if (shouldScroll) {
    scrollToBottom();
  }
}

function updateMessageStatus(messageId, status) {
  const messageEl = messageMap.get(messageId);
  if (!messageEl) {
    console.warn('Message not found:', messageId);
    return;
  }

  messageEl.dataset.status = status;
  messageEl.className = `message ${status}`;

  const statusIcon = messageEl.querySelector('.message-status');
  if (statusIcon) {
    statusIcon.textContent = getStatusIcon(status);
  }

  if (status === 'removed') {
    const contentEl = messageEl.querySelector('.message-content');
    if (contentEl) {
      contentEl.innerHTML = '<em>⚠️ Message removed by moderation</em>';
      contentEl.classList.add('removed-content');
    }
  } else if (status === 'approved') {
    messageEl.classList.remove('pending');
  }

  scrollToBottom();
}

function getStatusIcon(status) {
  switch (status) {
    case 'pending': return '⏳';
    case 'approved': return '✅';
    case 'removed': return '🚫';
    default: return '💬';
  }
}

// India timezone (IST - Asia/Kolkata, UTC+5:30)
const TIMEZONE_INDIA = 'Asia/Kolkata';

function formatTime(date) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE_INDIA,
  }).format(date);
}

function formatMessageTime(date) {
  const d = new Date(date);
  const now = new Date();
  const inIndia = (dt) => new Date(dt.toLocaleString('en-US', { timeZone: TIMEZONE_INDIA }));
  const dIndia = inIndia(d);
  const todayIndia = inIndia(now);
  const isToday = dIndia.toDateString() === todayIndia.toDateString();
  const timeStr = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE_INDIA,
  }).format(d);
  if (isToday) {
    return timeStr;
  }
  const dateStr = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: TIMEZONE_INDIA,
  }).format(d);
  return `${dateStr}, ${timeStr}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// 5️⃣ UI Helpers
function updateConnectionStatus(connected) {
  if (connected) {
    connectionStatus.classList.remove('disconnected');
    connectionStatus.classList.add('connected');
    statusText.textContent = 'Connected';
  } else {
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
    statusText.textContent = 'Disconnected';
  }
}

function showError(message) {
  showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 6️⃣ Event Listeners
sendBtn.onclick = () => {
  if (!currentRoom) {
    showError('Please join a room first');
    return;
  }
  if (!inputEl.value.trim()) return;

  socket.emit('sendMessage', {
    roomId: currentRoom,
    content: inputEl.value.trim(),
  });

  inputEl.value = '';
};

inputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

joinBtn.onclick = () => {
  joinRoom(roomInput.value);
};

leaveRoomBtn.onclick = () => {
  leaveRoom();
};

logoutBtn.onclick = () => {
  logout();
};

document.getElementById('showLoginBtn').onclick = () => showAuthModal(false);
document.getElementById('showSignupBtn').onclick = () => showAuthModal(true);
document.getElementById('closeAuthModal').onclick = closeAuthModal;
document.getElementById('switchToSignup').onclick = (e) => {
  e.preventDefault();
  showAuthModal(true);
};
document.getElementById('switchToLogin').onclick = (e) => {
  e.preventDefault();
  showAuthModal(false);
};

document.getElementById('loginBtn').onclick = async () => {
  const usernameInput = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!usernameInput || !password) {
    showAuthError('Please fill in all fields');
    return;
  }
  const success = await login(usernameInput, password);
  if (success) {
    connectSocket();
  }
};

document.getElementById('signupBtn').onclick = async () => {
  const usernameInput = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value;
  if (!usernameInput || !password) {
    showAuthError('Please fill in all fields');
    return;
  }
  const success = await signup(usernameInput, password);
  if (success) {
    connectSocket();
  }
};

// Quick room buttons
document.querySelectorAll('.room-btn').forEach(btn => {
  btn.onclick = () => {
    const roomId = btn.dataset.room;
    roomInput.value = roomId;
    joinRoom(roomId);
  };
});

// Close modal on outside click
authModal.onclick = (e) => {
  if (e.target === authModal) {
    closeAuthModal();
  }
};

// 7️⃣ Initialize
(async function start() {
  const restored = loadAuthFromStorage();
  if (restored && token) {
    updateUserUI();
    connectSocket();
  } else {
    const loggedIn = await guestLogin();
    if (loggedIn) {
      connectSocket();
    }
  }
})();
