import EventEmitter from './event-emitter.js';

class Player extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.pos = { x: 0, y: 0 };
    this.matrix = null;
    this.nextMatrices = [];
    this.holdMatrix = null;
    this.holdFlag = 0;
    this.shadowPos = null;
    this.score = 0;
    this.arena = null;

    this.runtimeStamp = 0;
    this.dropIntervalCounter = 0;
    this.moveIntervalCounter = 0;
    this.difficulty = 1;
    this.DROP_SPEED = [null, 1000, 700, 500, 200, 150, 100, 50];
    this.PRESS_MODE = 15;
    this.DROP_END = 100;
    this.dropInterval = this.DROP_SPEED[this.difficulty];
    this.mode = 'normal';
  }

  setArena(width, height) {
    this.arena = this._createMatrix(width, height);
  }

  createNextMatrices() {
    const pieces = 'ILJOTSZ';
    let piece = '';
    for (let i = 0; i < 5; i++) {
      piece = pieces[(Math.random() * pieces.length) | 0];
      this.nextMatrices.push([piece, this._createPiece(piece)]);
    }
  }

  move(direction) {
    this.pos.x += direction;
    if (this._checkCollision(this.pos)) {
      this.pos.x -= direction;
      return;
    }
    super.emit('pos', this.pos);
    this._updateShadowPos();
  }

  drop() {
    this.pos.y++;
    this._resetDropIntervalCounter();
    if (this._checkCollision(this.pos)) {
      if (this.getMode() === 'normal') {
        this.pos.y--;
        this._merge();
        const score = this._arenaSweep();
        this._updateScore(this.score + score);
        this.nextMatrix();
      } else if (this.getMode() === 'drop') {
        this.pos.y--;
        this.setMode('drop-end');
      } else if (this.getMode() === 'drop-end') {
        this.pos.y--;
        this._merge();
        const score = this._arenaSweep();
        this._updateScore(this.score + score);
        this.nextMatrix();
        this.setMode('normal');
      }
    } else {
      super.emit('pos', this.pos);
    }
  }

  dropToBottom() {
    this.pos = this.shadowPos;
    this._merge();
    const score = this._arenaSweep();
    this._updateScore(this.score + score);
    this.nextMatrix();
    this._resetDropIntervalCounter();
  }

  rotate(direction) {
    const posX = this.pos.x;
    this._rotateMatrix(direction);
    let offset = 1;
    while (this._checkCollision(this.pos)) {
      this.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > this.matrix[1][0].length) {
        this._rotateMatrix(-direction);
        this.pos.x = posX;
        return;
      }
    }
    this._updateShadowPos();
    super.emit('matrix', this.matrix);
  }

  hold() {
    if (this.holdFlag === 0) {
      this.holdFlag = 1;
      if (this.holdMatrix === null) {
        this.holdMatrix = this.matrix;
        this.nextMatrix();
      } else {
        this.holdFlag = 2;
        [this.matrix, this.holdMatrix] = [this.holdMatrix, this.matrix];
        this.pos.y = 0;
        this.pos.x =
          ((this.arena[0].length / 2) | 0) -
          ((this.matrix[1][0].length / 2) | 0);
        this._updateShadowPos();
      }

      super.emit('hold', this.holdMatrix[1]);
    }
  }

  nextMatrix() {
    const pieces = 'ILJOTSZ';
    this.matrix = this.nextMatrices.shift();
    let piece = pieces[(Math.random() * pieces.length) | 0];
    this.nextMatrices.push([piece, this._createPiece(piece)]);
    this.pos.y = 0;
    this.pos.x =
      ((this.arena[0].length / 2) | 0) - ((this.matrix[1][0].length / 2) | 0);

    if (this._checkCollision(this.pos)) {
      super.emit('lose', {});
      return;
    }
    this._updateShadowPos();

    if (this.holdFlag === 1) {
      this.holdFlag = 2;
    } else if (this.holdFlag === 2) {
      this.holdFlag = 0;
    }

    super.emit('pos', this.pos);
    super.emit('matrix', this.matrix);
  }

  lose() {
    this._merge();
    this._matrixToGray(this.arena);
  }

  _matrixToGray(matrix) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          matrix[y][x] = 8;
        }
      });
    });
  }

  reset() {
    this._arenaClear();
    this.holdMatrix = null;
    this.holdFlag = 0;
    this.createNextMatrices();
    this.nextMatrix();
    this._updateScore(0);
    this._resetDropIntervalCounter();
    this.setMode('normal');
  }

  getRunTime() {
    return Date.now() - this.runtimeStamp;
  }

  updateTime(deltaTime) {
    this.dropIntervalCounter += deltaTime;

    if (this.dropIntervalCounter > this.dropInterval) {
      this.drop();
    }
    this.updateDifficulty();
  }

  updateDifficulty() {
    const runTime = this.getRunTime();
    if (runTime < 30000) {
      this.difficulty = 1;
    } else if (runTime < 60000) {
      this.difficulty = 2;
    } else if (runTime < 90000) {
      this.difficulty = 3;
    } else if (runTime < 120000) {
      this.difficulty = 4;
    } else if (runTime < 150000) {
      this.difficulty = 5;
    } else if (runTime < 180000) {
      this.difficulty = 6;
    } else {
      this.difficulty = 7;
    }
    this.dropInterval = this.DROP_SPEED[this.difficulty];
  }

  getMode() {
    return this.mode;
  }

  setMode(mode) {
    this.mode = mode;
    switch (mode) {
      case 'normal':
        this.dropInterval = this.DROP_SPEED[this.difficulty];
        break;
      case 'drop':
        this.dropInterval = this.PRESS_MODE;
        break;
      case 'move':
        if (this.getMode() === 'readyToMove') {
        }
        break;
      case 'drop-end':
        this.dropInterval = this.DROP_END;
        break;
    }
    // if (mode === 'normal') {
    //   this.dropInterval = this.DROP_SPEED[this.difficulty];
    // } else if (mode === 'drop') {
    //   this.dropInterval = this.DROP_END;
    // } else if (mode === 'move') {
    //   this._resetMoveIntervalCounter();
    // }
  }

  _resetDropIntervalCounter() {
    this.dropIntervalCounter = 0;
  }

  _updateDropIntervalCounter() {
    this.dropIntervalCounter -= this.dropInterval;
  }

  _resetMoveIntervalCounter() {
    this.moveIntervalCounter = 0;
  }

  _createPiece(type) {
    switch (type) {
      case 'T':
        return [
          [0, 1, 0],
          [1, 1, 1],
          [0, 0, 0],
        ];
      case 'O':
        return [
          [2, 2],
          [2, 2],
        ];
      case 'L':
        return [
          [0, 0, 3],
          [3, 3, 3],
          [0, 0, 0],
        ];
      case 'J':
        return [
          [4, 0, 0],
          [4, 4, 4],
          [0, 0, 0],
        ];
      case 'I':
        return [
          [0, 0, 0, 0],
          [5, 5, 5, 5],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ];
      case 'S':
        return [
          [0, 6, 6],
          [6, 6, 0],
          [0, 0, 0],
        ];
      case 'Z':
        return [
          [7, 7, 0],
          [0, 7, 7],
          [0, 0, 0],
        ];
    }
  }

  _createMatrix(w, h) {
    const matrix = [];
    for (let i = 0; i < h; i++) {
      matrix.push(new Array(w).fill(0));
    }
    return matrix;
  }

  _rotateMatrix(direction) {
    for (let y = 0; y < this.matrix[1].length; y++) {
      for (let x = 0; x < y; x++) {
        [this.matrix[1][x][y], this.matrix[1][y][x]] = [
          this.matrix[1][y][x],
          this.matrix[1][x][y],
        ];
      }
    }

    if (direction > 0) {
      this.matrix[1].forEach((row) => row.reverse());
    } else {
      this.matrix[1].reverse();
    }
  }

  _merge() {
    this.matrix[1].forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          this.arena[y + this.pos.y][x + this.pos.x] = value;
        }
      });
    });
    super.emit('arena', this.arena);
  }

  _arenaClear() {
    this.arena.forEach((row) => row.fill(0));
    super.emit('arena', this.arena);
  }

  _arenaSweep() {
    let sum = 0;
    let baseScore = 10;
    outer: for (let y = this.arena.length - 1; y >= 0; y--) {
      for (let x = 0; x < this.arena[y].length; x++) {
        if (this.arena[y][x] === 0) {
          continue outer;
        }
      }

      const row = this.arena.splice(y, 1)[0].fill(0);
      this.arena.unshift(row);
      y++;

      sum += baseScore;
      baseScore *= 2;
    }
    super.emit('arena', this.arena);
    return sum;
  }

  _updateScore(score) {
    this.score = score;
    super.emit('score', this.score);
  }

  _checkCollision(pos) {
    const matrix_h = this.matrix[1].length;
    const matrix_w = this.matrix[1][0].length;
    const { x: posX, y: posY } = pos;

    for (let y = 0; y < matrix_h; y++) {
      for (let x = 0; x < matrix_w; x++) {
        if (this.matrix[1][y][x] !== 0) {
          if (posY + y > this.arena.length - 1) return true;
          else if (this.arena[posY + y][posX + x] !== 0) return true;
        }
      }
    }
    return false;
  }

  _updateShadowPos() {
    let { x, y } = this.pos;
    while (!this._checkCollision({ x, y })) {
      y++;
    }
    y--;
    this.shadowPos = { x, y };
    super.emit('shadowPos', this.shadowPos);
  }
}

export default Player;
