class Room {
  constructor(id, io) {
    this.id = id;
    this.io = io;
    this.state = 'wait';
    this.ranking = [];
  }
  getSockets() {
    return [...this.io.in(this.id).adapter.nsp.sockets].map((arr) => arr[1]);
  }
  getIDs() {
    return [...this.io.in(this.id).adapter.nsp.sockets].map((arr) => arr[1].id);
  }
  isAllReady() {
    for (let socket of this.getSockets()) {
      if (socket.state === 'wait') {
        return false;
      }
    }
    return true;
  }
  setState(state) {
    this.state = state;
    if (state === 'run') {
      this.ranking = [];
    }
  }
  getState() {
    return this.state;
  }
  getSize() {
    return this.io.sockets.adapter.rooms.get(this.id).size;
  }
  broadcast(...args) {
    this.io.to(this.id).emit(...args);
  }
  resetGame() {
    let first;
    for (let socket of this.getSockets()) {
      if (socket.state !== 'lose') {
        first = socket.id;
      }
      socket.state = 'wait';
    }
    this.ranking.unshift(first);
    this.state = 'wait';
    this.broadcast('result', { ranking: this.ranking });
  }
  isGameEnd() {
    let count = 0;
    for (let socket of this.getSockets()) {
      if (socket.state === 'run') {
        count++;
      }
    }
    return count <= 1 ? true : false;
  }
  run() {
    this.numOfParticipants = this.getSize();
    this.ranking = [];
    this.state = 'run';
    for (let socket of this.getSockets()) {
      socket.state = 'run';
    }
    this.broadcast('run', {});
  }
  getNumOfParticipants() {
    return this.numOfParticipants;
  }
}

module.exports = Room;
