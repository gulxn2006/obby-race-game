const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
const players = {};
io.on('connection', socket => {
  players[socket.id] = { id: socket.id, name: 'Runner', x: 0, y: 1, z: 8, color: `hsl(${Math.floor(Math.random()*360)},75%,60%)`, finished: false };
  socket.emit('welcome', { id: socket.id, players });
  socket.broadcast.emit('playerJoined', players[socket.id]);
  socket.on('name', name => { if (players[socket.id]) { players[socket.id].name = String(name).slice(0,16) || 'Runner'; io.emit('playerMoved', players[socket.id]); }});
  socket.on('move', data => {
    const p = players[socket.id]; if (!p) return;
    p.x = clamp(Number(data.x)||0,-12,12); p.y = clamp(Number(data.y)||1,0,30); p.z = clamp(Number(data.z)||8,-120,20);
    p.finished = Boolean(data.finished);
    socket.broadcast.emit('playerMoved', p);
  });
  socket.on('disconnect', () => { delete players[socket.id]; io.emit('playerLeft', socket.id); });
});
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Obby Race running at http://localhost:${PORT}`));
