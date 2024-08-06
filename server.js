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
let clients = new Map(); // Kullanıcı adlarını WebSocket bağlantılarıyla eşle

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);

    if (data.type === 'login') {
      if (!activeUsers.includes(data.username)) {
        activeUsers.push(data.username);
      }
      clients.set(data.username, ws); // Kullanıcı adını WebSocket ile eşle
      ws.username = data.username;
    } else if (data.type === 'logout') {
      activeUsers = activeUsers.filter(user => user !== data.username);
      clients.delete(data.username); // Kullanıcıyı eşlemeden çıkar
    } else if (data.type === 'message') {
      // Mesajı tüm kullanıcılara ilet
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } else if (data.type === 'list') {
      // /list komutu gönderildiğinde
      const listMessage = {
        type: 'message',
        username: 'System',
        message: `Active users: ${activeUsers.join(', ')}`
      };
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(listMessage));
        }
      });
    }

    // Aktif kullanıcı sayısını güncelle
    const activeUsersMessage = JSON.stringify({ type: 'activeUsers', count: activeUsers.length });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(activeUsersMessage);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Bir kullanıcı bağlantıyı kapattığında aktif kullanıcı listesinden çıkarın
    if (ws.username) {
      activeUsers = activeUsers.filter(user => user !== ws.username);
      clients.delete(ws.username); // Kullanıcıyı eşlemeden çıkar
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
