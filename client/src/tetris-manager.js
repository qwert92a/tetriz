import Tetris from './tetris.js';

class TetrisManager {
  constructor(container) {
    this.container = container;
    this.mainUser = new Tetris(
      '',
      this.container.querySelector('.main-user .tetris'),
      true
    );
    this.otherUsers = new Map();
  }

  joinPlayer(id) {
    const $tetris = document.createElement('div');
    $tetris.classList.add('tetris');
    this.container.querySelector('.other-user').appendChild($tetris);
    // this.container.querySelector('.other-user').classList.add('hide');
    this.otherUsers.set(id, new Tetris(id, $tetris, false));
  }

  leavePlayer(id) {
    const user = this.otherUsers.get(id);
    user.container.remove();
    this.otherUsers.delete(id);
  }

  updatePlayMode() {
    if (this.otherUsers.size > 0) {
      this.mainUser.setPlayMode('multi');
      this.mainUser._setReadyBtnText('ready');
      // this.mainUser.reset();
      this._otherUsersShow();
    } else {
      this.mainUser.setPlayMode('solo');
      this.mainUser._setReadyBtnText('play alone');
      // this.mainUser.reset();
      this._otherUsersHide();
    }
  }

  _otherUsersHide() {
    this.container.querySelector('.other-user').classList.add('hide');
  }

  _otherUsersShow() {
    this.container.querySelector('.other-user').classList.remove('hide');
  }

  stateUpdate(data) {
    if (!this.otherUsers.has(data.id)) {
      throw new Error(`Player ID: ${data.id} does not exist.`);
    }

    const tetris = this.otherUsers.get(data.id);
    tetris.player[data.prop] = data.value;

    tetris._render();
  }

  allUsersReset() {
    this.mainUser.reset();
    this.otherUsers.forEach((user) => {
      user.reset();
    });
  }
}

export default TetrisManager;
