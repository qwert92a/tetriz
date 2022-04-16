const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Client = require('./client');
const Room = require('./room');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static directory
app.use(express.static(path.join(__dirname, '../client')));

function getRooms(io) {
  const arr = [...io.sockets.adapter.rooms];
  const filtered = arr.filter((room) => !room[1].has(room[0]));
  const res = filtered.map((i) => i[0]);
  return res;
}
const rooms = new Map();

function createID(len = 6, chars = 'abcdefghjkmnopqrstwxyz0123456789') {
  let id = '';
  while (len--) {
    id += chars[(Math.random() * chars.length) | 0];
  }
  return id;
}

// Run when client connects
io.on('connection', (socket) => {
  const client = new Client(socket, io);
  console.log(`New player connected! ( socket_ID : ${socket.id} )`);
  console.log(`Now ${io.sockets.sockets.size} players connected.`);
  console.log([...io.sockets.sockets.keys()]);
  console.log(`Now ${getRooms(io).length} rooms opend.`);
  console.log(getRooms(io));

  // socket.emit('ID', `Hi, new player! your ID is ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Player (ID: ${socket.id}) disconnected.`);
    if (client.room) {
      if (client.room.getState() === 'run') {
        const ranking = client.lose();
        client.room.ranking.unshift(client.socket.id);
        client.broadcast('lose', { id: client.socket.id, ranking });
        if (client.room.isGameEnd()) {
          client.room.resetGame();
        }
      }
      client.broadcast('leave-player', { id: client.socket.id });
      client.leave();
    }

    console.log(`Now ${io.sockets.sockets.size} players connected.`);
    console.log([...io.sockets.sockets.keys()]);
    console.log(`Now ${getRooms(io).length} rooms opend.`);
    console.log(getRooms(io));
  });

  socket.on('create-room', (data) => {
    console.log(
      `Message received from player ${
        socket.id
      } : 'create-room' ${JSON.stringify(data)}`
    );
    const room = new Room(createID(), io);
    rooms.set(room.id, room);
    client.join(room);
    client.emit('create-room', { id: client.socket.id, roomID: room.id });
    console.log(`Now ${getRooms(io).length} rooms opend.`);
    console.log(getRooms(io));
  });

  socket.on('join-room', (data) => {
    console.log(
      `Message received from player ${socket.id} : 'join-room' ${JSON.stringify(
        data
      )}`
    );
    if (rooms.has(data.roomID)) {
      client.join(rooms.get(data.roomID));
      const otherUsers = new Set(client.room.getIDs());
      otherUsers.delete(client.socket.id);
      // Set은 serializable 하지 않으므로 배열로 다시 바꿔줘야 한다
      client.emit('join-room', {
        id: client.socket.id,
        roomID: data.roomID,
        otherUsers: [...otherUsers],
        roomState: client.room.getState(),
      });
      client.broadcast('join-player', {
        id: client.socket.id,
        roomState: client.room.getState(),
      });
    } else {
      const room = new Room(data.roomID, io);
      rooms.set(room.id, room);
      client.join(room);
      client.emit('create-room', { id: client.socket.id, roomID: room.id });
    }

    console.log(`Now ${getRooms(io).length} rooms opend.`);
    console.log(getRooms(io));
  });

  socket.on('state-update', (data) => {
    // console.log(
    //   `State changed. ID: ${socket.id}, prop: ${data.prop}, value: ${JSON.stringify(data.value)}`
    // );
    data.id = client.socket.id;
    data.roomState = client.room.getState();
    client.broadcast('state-update', data);
  });

  socket.on('wait', (data) => {
    if (client.room.getState() === 'wait') {
      console.log(
        `wait ID: ${client.socket.id} ROOM: ${
          client.room.id
        } (${client.room.getSize()})`
      );
      data.id = client.socket.id;
      client.setState('wait');
      client.broadcast('wait', data);
    }
  });

  socket.on('ready', (data) => {
    if (client.room.getState() === 'wait') {
      console.log(
        `ready ID: ${client.socket.id} ROOM: ${
          client.room.id
        } (${client.room.getSize()})`
      );
      data.id = client.socket.id;
      client.broadcast('ready', data);
      client.setState('ready');
      if (client.room.isAllReady()) {
        client.room.run();
        console.log(`ROOM ${client.room.id} (${client.room.getSize()}) RUN`);
      }
    }
  });

  socket.on('lose', (data) => {
    if (client.room.getState() === 'run') {
      console.log(
        `lose ID: ${client.socket.id} ROOM: ${
          client.room.id
        } (${client.room.getSize()})`
      );
      const ranking = client.lose();
      client.broadcast('lose', { id: client.socket.id, ranking });
      if (client.room.isGameEnd()) {
        client.room.resetGame();
        console.log(`ROOM ${client.room.id} (${client.room.getSize()}) END`);
      }
    }
  });

  socket.on('user-chat', (data) => {
    data.id = client.socket.id;
    client.broadcastAll('user-chat', data);
  });

  socket.on('message', (data) => {
    console.log(
      `Message received from player ${socket.id} : ${JSON.stringify(data)}`
    );
  });
});

server.on('error', (err) => {
  console.log(`Server error: ${err}`);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`RPS started on ${PORT}.`);
});
