const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

const wss = new WebSocket.Server({ server });

let activeUsers = [];

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);

    if (data.type === 'login') {
      if (activeUsers.includes(data.username)) {
        // Kullanıcı adı zaten kullanılıyorsa, hata mesajı gönder
        ws.send(JSON.stringify({ type: 'error', message: 'Username is already taken.' }));
      } else {
        activeUsers.push(data.username);
        ws.username = data.username;
        // Başarı mesajı gönder
        ws.send(JSON.stringify({ type: 'loginSuccess', username: data.username }));
        // Aktif kullanıcı sayısını güncelle
        const activeUsersMessage = JSON.stringify({ type: 'activeUsers', count: activeUsers.length });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(activeUsersMessage);
          }
        });
      }
    } else if (data.type === 'logout') {
      activeUsers = activeUsers.filter(user => user !== data.username);
      const activeUsersMessage = JSON.stringify({ type: 'activeUsers', count: activeUsers.length });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(activeUsersMessage);
        }
      });
    } else if (data.type === 'message') {
      // Mesajı tüm kullanıcılara ilet
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } else if (data.type === 'list') {
      // Aktif kullanıcıları listele
      const userListMessage = JSON.stringify({
        type: 'message',
        username: 'system',
        message: 'Active users: ' + activeUsers.join(', ')
      });
      ws.send(userListMessage);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Bir kullanıcı bağlantıyı kapattığında aktif kullanıcı listesinden çıkarın
    if (ws.username) {
      activeUsers = activeUsers.filter(user => user !== ws.username);
    }
    const activeUsersMessage = JSON.stringify({ type: 'activeUsers', count: activeUsers.length });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(activeUsersMessage);
      }
    });
  });
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
