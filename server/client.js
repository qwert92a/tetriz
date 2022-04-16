class Client {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;
    this.room = null;
    this.socket.state = 'wait';
  }
  join(room) {
    if (this.room) {
      throw new Error('Client already in room');
    }
    this.socket.join(room.id);
    this.room = room;
  }
  leave() {
    if (!this.room) {
      throw new Error('Client not in room');
    }
    this.socket.leave(this.room.id);
    this.room = null;
  }
  emit(...args) {
    this.socket.emit(...args);
  }
  broadcast(...args) {
    if (this.room) {
      this.socket.to(this.room.id).emit(...args);
    } else {
      throw new Error('Can not broadcast: not in room');
    }
  }
  broadcastAll(...args) {
    if (this.room) {
      this.io.to(this.room.id).emit(...args);
    } else {
      throw new Error('Can not broadcast: not in room');
    }
  }
  getPeers() {
    return [...this.io.sockets.adapter.rooms.get(this.room.id)];
  }
  setState(state) {
    this.socket.state = state;
  }
  getState() {
    return this.socket.state;
  }
  lose() {
    const ranking =
      this.room.getNumOfParticipants() - this.room.ranking.length + 1;
    this.room.ranking.unshift(this.socket.id);
    this.socket.state = 'lose';
    return ranking;
  }
}

module.exports = Client;
