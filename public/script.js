const loginContainer = document.getElementById('login-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-button');
const chatContainer = document.getElementById('chat-container');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const logoutButton = document.getElementById('logout-button');
const activeUsersSpan = document.getElementById('active-users');
const currentTimeSpan = document.getElementById('current-time');
const listButton = document.getElementById('list-button'); // /list komutu için buton
const userListButton = document.getElementById('user-list-button'); // User List butonu

let username = '';

// WebSocket bağlantısı oluştur
const socket = new WebSocket(`wss://${window.location.host}`);

socket.addEventListener('open', () => {
    console.log('WebSocket sunucusuna bağlanıldı');
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'message') {
        const message = document.createElement('div');
        message.textContent = `${data.username}: ${data.message}`;
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight; // En alta kaydır
    } else if (data.type === 'activeUsers') {
        updateActiveUsers(data.count);
    } else if (data.type === 'error') {
        alert(data.message);
    } else if (data.type === 'loginSuccess') {
        username = data.username;
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }
});

loginButton.addEventListener('click', function () {
    username = usernameInput.value.trim();
    if (username) {
        socket.send(JSON.stringify({ type: 'login', username: username }));
    }
});

logoutButton.addEventListener('click', function () {
    socket.send(JSON.stringify({ type: 'logout', username: username }));
    username = '';
    chatBox.innerHTML = '';
    loginContainer.style.display = 'flex';
    chatContainer.style.display = 'none';
});

messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && messageInput.value.trim() !== '' && username !== '') {
        const message = {
            type: 'message',
            username: username,
            message: messageInput.value
        };
        console.log('Mesaj gönderiliyor:', message);
        socket.send(JSON.stringify(message));
        messageInput.value = '';
    }
});

// /list komutunu gönderme işlevi
listButton.addEventListener('click', function () {
    const listCommand = {
        type: 'list'
    };
    socket.send(JSON.stringify(listCommand));
});

// User List butonunu işleme
userListButton.addEventListener('click', function () {
    const userListCommand = {
        type: 'list'
    };
    socket.send(JSON.stringify(userListCommand));
});

function updateActiveUsers(count) {
    activeUsersSpan.textContent = `Active users: ${count}`;
    currentTimeSpan.textContent = `Current time: ${getCurrentTime()}`;
}

function getCurrentTime() {
    const now = new Date();
    const options = {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return now.toLocaleTimeString('en-US', options);
}

// Saati güncellemeyi belirli aralıklarla yap
setInterval(() => {
    currentTimeSpan.textContent = `Current time: ${getCurrentTime()}`;
}, 1000);
