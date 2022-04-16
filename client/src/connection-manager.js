class ConnectionManager {
  constructor(tetrisManager, chatManager) {
    this.socket = null;
    this.tetrisManager = tetrisManager;
    this.chatManager = chatManager;
  }

  connect() {
    this.socket = io();
    this.socket.on('connect', () => {});

    this.socket.on('connect_error', () => {
      console.log('connection error.');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected.');
    });

    this.socket.on('message', (data) => {
      console.log(`Message received : ${JSON.stringify(data)}`);
    });

    this.socket.on('create-room', (data) => {
      this.tetrisManager.mainUser.setUserID(data.id);
      this.tetrisManager.mainUser.renderID();
      const msg = { type: 'create-room', roomID: data.roomID };
      this.chatManager.renderMessage(msg);
      window.location.hash = data.roomID;
    });

    this.socket.on('join-room', (data) => {
      this.tetrisManager.mainUser.setUserID(data.id);
      this.tetrisManager.mainUser.renderID();
      data.otherUsers.forEach((id) => {
        this.tetrisManager.joinPlayer(id);
      });
      this.tetrisManager.updatePlayMode();
      if (data.roomState === 'run') {
        this.tetrisManager.mainUser.watch();
        this.tetrisManager.otherUsers.forEach((tetris) => {
          tetris.run();
        });
      }
      this.chatManager.renderMessage({
        type: 'join-room',
        roomID: data.roomID,
      });
    });

    this.socket.on('join-player', (data) => {
      this.tetrisManager.joinPlayer(data.id);
      this.tetrisManager.updatePlayMode();
      if (this.tetrisManager.mainUser.state === 'run') {
        const tetris = this.tetrisManager.otherUsers.get(data.id);
        tetris.watch();
        this.tetrisManager.mainUser.player.emit(
          'arena',
          this.tetrisManager.mainUser.player.arena
        );
        this.tetrisManager.mainUser.player.emit(
          'matrix',
          this.tetrisManager.mainUser.player.matrix
        );
        this.tetrisManager.mainUser.player.emit(
          'pos',
          this.tetrisManager.mainUser.player.pos
        );
      }
      this.chatManager.renderMessage({ type: 'join-player', id: data.id });
    });

    this.socket.on('leave-player', (data) => {
      this.tetrisManager.leavePlayer(data.id);
      this.tetrisManager.updatePlayMode();
      this.chatManager.renderMessage({ type: 'leave-player', id: data.id });
    });

    this.socket.on('state-update', (data) => {
      // console.log(
      //   `State changed. ID: ${data.id}, prop: ${
      //     data.prop
      //   }, value: ${JSON.stringify(data.value)}`
      // );
      if (data.roomState === 'run') {
        this.tetrisManager.stateUpdate(data);
      }
    });

    this.socket.on('wait', (data) => {
      if (!this.tetrisManager.otherUsers.has(data.id)) {
        throw new Error(`Player ID: ${data.id} does not exist.`);
      }

      const tetris = this.tetrisManager.otherUsers.get(data.id);
      tetris.wait();
    });

    this.socket.on('ready', (data) => {
      if (!this.tetrisManager.otherUsers.has(data.id)) {
        throw new Error(`Player ID: ${data.id} does not exist.`);
      }

      const tetris = this.tetrisManager.otherUsers.get(data.id);
      tetris.ready();
    });

    this.socket.on('run', (data) => {
      this.tetrisManager.mainUser.run();
      this.tetrisManager.otherUsers.forEach((tetris) => {
        tetris.run();
      });
    });

    this.socket.on('lose', (data) => {
      console.log(`lose ID: ${data.id} ranking: ${data.ranking}`);

      if (!this.tetrisManager.otherUsers.has(data.id)) {
        throw new Error(`Player ID: ${data.id} does not exist.`);
      }

      const tetris = this.tetrisManager.otherUsers.get(data.id);
      tetris.lose();
    });

    this.socket.on('result', (data) => {
      // this.tetrisManager.mainUser.wait();
      this.tetrisManager.allUsersReset();
      console.log(`result ${data.ranking}`);
    });

    this.socket.on('user-chat', (data) => {
      if (data.id === this.tetrisManager.mainUser.player.id) {
        this.chatManager.renderMessage({
          type: 'my-chat',
          id: data.id,
          contents: data.contents,
        });
      } else {
        this.chatManager.renderMessage({
          type: 'user-chat',
          id: data.id,
          contents: data.contents,
        });
      }
    });

    this._setEventListener();
  }

  _setEventListener() {
    const mainUser = this.tetrisManager.mainUser;

    ['pos', 'shadowPos', 'matrix', 'arena', 'score'].forEach((prop) => {
      mainUser.player.on(prop, () => {
        if (mainUser.playMode === 'multi') {
          this.socket.emit('state-update', {
            prop,
            value: mainUser.player[prop],
          });
        }
      });
    });
    mainUser.on('wait', () => {
      mainUser.wait();
      if (mainUser.playMode === 'multi') {
        this.socket.emit('wait', {});
      }
    });

    mainUser.on('ready', () => {
      mainUser.ready();
      // if (mainUser.playMode === 'multi') {
      //   this.socket.emit('ready', {});
      // }
      this.socket.emit('ready', {});
    });

    mainUser.on('lose', () => {
      // if (mainUser.playMode === 'multi') {
      //   this.socket.emit('lose', {});
      // }
      this.socket.emit('lose', {});
    });

    this.chatManager.on('user-chat', (data) => {
      this.socket.emit('user-chat', data);
    });

    // if (this.info) {
    //   this.player.on('score', (score) => {
    //     this._renderScore();
    //     console.log(`score changed. score: ${score}`);
    //   });
    // }
  }

  createRoom() {
    this.socket.emit('create-room', {});
  }

  joinRoom(roomID) {
    this.socket.emit('join-room', { roomID });
  }
}

export default ConnectionManager;
