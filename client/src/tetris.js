import Player from './player.js';
import EventEmitter from './event-emitter.js';

class Tetris extends EventEmitter {
  constructor(id, $container, isMainUser) {
    super();
    this.state = 'wait';
    this.playMode = '';
    this.container = $container;
    this.isMainUser = isMainUser;

    const $arena = document.createElement('canvas');
    $arena.classList.add('arena');
    $container.appendChild($arena);
    this.arena = {};
    this.arena.canvas = $arena;
    if (this.isMainUser) {
      this.arena.scale = 24;
    } else {
      this.arena.scale = 12;
    }
    this.arena.canvas.width = 10 * this.arena.scale;
    this.arena.canvas.height = 22 * this.arena.scale;
    this.arena.context = this.arena.canvas.getContext('2d');
    this.arena.context.scale(this.arena.scale, this.arena.scale);

    const $id = document.createElement('div');
    $id.classList.add('id');
    $id.innerText = id;
    $container.appendChild($id);
    this.idText = $id;

    const $readyBtn = document.createElement('div');
    $readyBtn.classList.add('readyBtn');
    $readyBtn.classList.add('pointer');
    $container.appendChild($readyBtn);
    this.readyBtn = $readyBtn;
    const $span = document.createElement('span');
    $span.innerText = 'ready';
    this.readyBtn.appendChild($span);

    if (this.isMainUser) {
      const $info = document.createElement('div');
      $info.classList.add('info');
      $container.appendChild($info);
      this.info = $info;
      this.info.innerHTML =
        '<div class="tag">SPEED</div><div class="speed">0</div><div class="tag">TIME</div><div class="time"><span class="second">000.</span><span class="milisecond">000</span></div>';
      this.speedText = this.info.querySelector('.speed');
      this.secondText = this.info.querySelector('.second');
      this.milisecondText = this.info.querySelector('.milisecond');

      const $nextContainer = document.createElement('div');
      $nextContainer.classList.add('next-container');
      const $nextText = document.createElement('div');
      $nextText.classList.add('nextText');
      $nextText.innerText = 'next'.toLocaleUpperCase();
      $nextContainer.appendChild($nextText);
      $container.appendChild($nextContainer);
      const $next = document.createElement('canvas');
      $next.classList.add('next');
      $nextContainer.appendChild($next);
      this.next = {};
      this.next.canvas = $next;
      this.next.scale = 24;
      this.next.canvas.width = 5 * this.next.scale;
      this.next.canvas.height = 17 * this.next.scale;
      this.next.context = this.next.canvas.getContext('2d');
      this.next.context.scale(this.next.scale, this.next.scale);

      const $holdContainer = document.createElement('div');
      $holdContainer.classList.add('hold-container');
      const $holdText = document.createElement('div');
      $holdText.classList.add('holdText');
      $holdText.innerText = 'hold'.toLocaleUpperCase();
      $holdContainer.appendChild($holdText);
      $container.appendChild($holdContainer);
      const $hold = document.createElement('canvas');
      $hold.classList.add('hold');
      $holdContainer.appendChild($hold);
      this.hold = {};
      this.hold.canvas = $hold;
      this.hold.scale = 24;
      this.hold.canvas.width = 5 * this.hold.scale;
      this.hold.canvas.height = 3 * this.hold.scale;
      this.hold.context = this.hold.canvas.getContext('2d');
      this.hold.context.scale(this.hold.scale, this.hold.scale);
    }

    this.player = new Player(id);
    this.player.setArena(10, 22);
    this.player.createNextMatrices();
    this.player.nextMatrix();

    this.lastTimeStamp = 0;
    this.colors = [
      null,
      '#FF0D72',
      '#0DC2FF',
      '#0DFF72',
      '#F538FF',
      '#FF8E0D',
      '#FFE138',
      '#3877FF',
      '#6A6A6A',
    ];

    if (this.isMainUser) {
      this._setEventListener();
    }
    if (this.isMainUser) {
      this.setPlayMode('solo');
    } else {
      this.setPlayMode('multi');
    }
    this.reset();
    this.renderID();
  }

  setUserID(id) {
    this.player.id = id;
  }

  setPlayMode(playMode) {
    this.playMode = playMode;
  }

  reset() {
    if (this.isMainUser === true) {
      this.player.reset();
    }
    this.state = 'wait';
    if (this.playMode === 'solo') {
      this._setReadyBtnText('play alone');
    }
    if (this.playMode === 'multi') {
      this._setReadyBtnText('ready');
    }
    this._readyBtnShow();
    this._readyBtnDeactivate();
    this._readyBtnPointerActivate();
    this._readyBtnHoverActivate();
    this._renderBackground();
    if (this.isMainUser) {
      this.speedText.innerText = 0;
      this.secondText.innerText = '0.';
      this.milisecondText.innerText = '000';
    }
  }

  watch() {
    this.state = 'watch';
    this._renderBackground();
    this._setReadyBtnText('watching');
    this._readyBtnShow();
    this._readyBtnDeactivate();
    this._readyBtnHoverDeactivate();
    this._readyBtnPointerDeactivate();
  }

  _readyBtnPointerActivate() {
    this.readyBtn.classList.add('pointer');
  }

  _readyBtnPointerDeactivate() {
    this.readyBtn.classList.remove('pointer');
  }

  _setReadyBtnText(text) {
    this.readyBtn.querySelector('span').innerText = text;
  }

  _readyBtnHoverActivate() {
    this.readyBtn.classList.remove('hover-disabled');
  }

  _readyBtnHoverDeactivate() {
    this.readyBtn.classList.add('hover-disabled');
  }

  wait() {
    this.state = 'wait';
    this._readyBtnDeactivate();
  }

  ready() {
    this.state = 'ready';
    this._readyBtnActivate();
  }

  lose() {
    if (this.playMode === 'solo') {
      this.state = 'wait';
      this._setReadyBtnText('play again');
      this.player.lose();
      this._renderBackground();
      this._renderArena();
      this._readyBtnShow();
      this._readyBtnDeactivate();
      this._readyBtnHoverActivate();
      this._readyBtnPointerActivate();
    }
    if (this.playMode === 'multi') {
      this.state = 'lose';
      this._setReadyBtnText('lose');
      this.player.lose();
      this._renderBackground();
      this._renderArena();
      this._readyBtnShow();
      this._readyBtnDeactivate();
      this._readyBtnHoverDeactivate();
      this._readyBtnPointerDeactivate();
    }
  }

  run() {
    if (!this.isMainUser) {
      this._readyBtnHide();
      return;
    }
    this.player.reset();
    this._readyBtnHide();
    this.player.runtimeStamp = Date.now();
    this.lastTimeStamp = Date.now();
    this._render();
    this.state = 'run';
    setTimeout(this._update.bind(this), 16);
  }

  _update() {
    if (this.state !== 'run') {
      return;
    }
    const now = Date.now();
    const deltaTime = now - this.lastTimeStamp;
    this.lastTimeStamp = now;
    this.player.updateTime(deltaTime);
    this._renderTime();
    // this._render();
    setTimeout(this._update.bind(this), 16);
  }

  renderID() {
    this.idText.innerText = this.player.id.slice(0, 5).toUpperCase();
  }

  _render() {
    this._renderArenaBackground();
    this._renderArena();
    this._renderMatrix();
    this._renderShadow();
    this._renderSpeed();
    this._renderNextBackground();
    this._renderNextMatrices();
    this._renderHoldBackground();
    this._renderHoldMatirx();
    // if (this.isMainUser) {
    //   this._renderHoldBackground();
    //   this._renderHoldMatirx();
    //   this._renderNextBackground();
    //   this._renderNextMatrices();
    //   // this._renderScore();
    // }
  }

  _renderInfo() {
    this._renderSpeed();
    this._renderTime();
  }

  _renderSpeed() {
    this.speedText.innerText = this.player.difficulty;
  }

  _renderTime() {
    const elapsedTime = Date.now() - this.player.runtimeStamp;
    this.secondText.innerText = ((elapsedTime / 1000) | 0) + '.';
    this.milisecondText.innerText = String((elapsedTime % 1000) + 1000).slice(
      1
    );
  }

  _renderHoldMatirx() {
    if (this.player.holdMatrix !== null) {
      let leftOffset = 0;
      let topOffset = 0.5;

      if (this.player.holdFlag === 2) {
        this.player._matrixToGray(this.player.holdMatrix[1]);
      }

      switch (this.player.holdMatrix[0]) {
        case 'T':
          leftOffset = 1;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'O':
          leftOffset = 1.5;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'L':
          leftOffset = 1;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'J':
          leftOffset = 1;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'I':
          leftOffset = 0.5;
          topOffset -= 0.5;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          topOffset += 0.5;
          break;
        case 'S':
          leftOffset = 1;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'Z':
          leftOffset = 1;
          this._drawMatrix(this.hold.context, this.player.holdMatrix[1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
      }
      if (this.player.holdFlag === 2) {
        this.player.holdMatrix[1] = this.player._createPiece(
          this.player.holdMatrix[0]
        );
      }
    }
  }

  _renderNextMatrices() {
    let topOffset = 0.5;
    let leftOffset = 0;
    for (let i = 0; i < 5; i++) {
      switch (this.player.nextMatrices[i][0]) {
        case 'T':
          leftOffset = 1;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'O':
          leftOffset = 1.5;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'L':
          leftOffset = 1;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'J':
          leftOffset = 1;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'I':
          leftOffset = 0.5;
          topOffset -= 0.5;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          topOffset += 0.5;
          break;
        case 'S':
          leftOffset = 1;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
        case 'Z':
          leftOffset = 1;
          this._drawMatrix(this.next.context, this.player.nextMatrices[i][1], {
            x: leftOffset,
            y: topOffset,
          });
          break;
      }
      topOffset += 3.5;
    }
  }

  _renderBackground() {
    this._renderArenaBackground();
    if (this.isMainUser) {
      this._renderHoldBackground();
      this._renderNextBackground();
    }
  }

  _renderArenaBackground() {
    this.arena.context.fillStyle = '#000';
    this.arena.context.globalAlpha = 1;
    this.arena.context.fillRect(
      0,
      0,
      this.arena.canvas.width,
      this.arena.canvas.height
    );
  }
  _renderNextBackground() {
    this.next.context.fillStyle = '#000';
    this.next.context.globalAlpha = 1;
    this.next.context.fillRect(
      0,
      0,
      this.next.canvas.width,
      this.next.canvas.height
    );
  }
  _renderHoldBackground() {
    this.hold.context.fillStyle = '#000';
    this.hold.context.globalAlpha = 1;
    this.hold.context.fillRect(
      0,
      0,
      this.hold.canvas.width,
      this.hold.canvas.height
    );
  }
  _renderArena() {
    this._drawMatrix(this.arena.context, this.player.arena, { x: 0, y: 0 });
  }
  _renderMatrix() {
    this._drawMatrix(
      this.arena.context,
      this.player.matrix[1],
      this.player.pos
    );
  }
  _renderShadow() {
    this.arena.context.globalAlpha = 0.3;
    this._drawMatrix(
      this.arena.context,
      this.player.matrix[1],
      this.player.shadowPos
    );
  }

  _drawMatrix(context, matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = this.colors[value];
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }

  _renderScore() {
    this.info.innerText = this.player.score;
  }

  _readyBtnHide() {
    this.readyBtn.classList.add('hide');
  }

  _readyBtnShow() {
    this.readyBtn.classList.remove('hide');
  }

  _readyBtnActivate() {
    this.readyBtn.classList.add('ready');
  }

  _readyBtnDeactivate() {
    this.readyBtn.classList.remove('ready');
  }

  _setEventListener() {
    const keyListener = (e) => {
      if (this.state === 'run') {
        if (e.type === 'keydown') {
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              this.player.move(-1);
              this.player.setMode('move');
              break;
            case 'ArrowRight':
              e.preventDefault();
              this.player.move(1);
              // this.player.setMode('move');
              break;
            case 'ArrowDown':
              e.preventDefault();
              // if(this.player.getMode())
              // this.player.drop();
              if (this.player.getMode() === 'normal') {
                this.player.setMode('drop');
              }
              break;
            case 'z':
            case 'Z':
              e.preventDefault();
              this.player.rotate(-1);
              break;
            case 'x':
            case 'X':
            case 'ArrowUp':
              e.preventDefault();
              this.player.rotate(1);
              break;
            case 'c':
            case 'C':
              e.preventDefault();
              this.player.hold();
              break;
            case ' ':
              e.preventDefault();
              this.player.dropToBottom();
              break;
          }
        } else if (e.type === 'keyup') {
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              this.player.setMode('normal');
              break;
            case 'ArrowRight':
              e.preventDefault();
              this.player.setMode('normal');
              break;
            case 'ArrowDown':
              e.preventDefault();
              this.player.setMode('normal');
              break;
          }
        }
      }
    };
    document.addEventListener('keydown', keyListener);
    document.addEventListener('keyup', keyListener);
    this.readyBtn.addEventListener('click', () => {
      if (this.state === 'wait') {
        // if (this.playMode === 'solo') {
        //   this.run();
        // } else if (this.playMode === 'multi') {
        //   super.emit('ready', {});
        // }
        super.emit('ready', {});
      } else if (this.state === 'ready') {
        super.emit('wait', {});
      }
    });

    this.player.on('lose', () => {
      this.lose();
      super.emit('lose', {});
    });
    // this.player.on('matrix', () => {
    //   this._renderNextBackground();
    //   this._renderNextMatrices();
    //   this._renderHoldMatirx();
    // });
    this.player.on('hold', () => {
      this._renderHoldBackground();
      this._renderHoldMatirx();
    });
    ['pos', 'shadowPos', 'matrix', 'arena', 'score'].forEach((prop) => {
      this.player.on(prop, () => {
        this._render();
      });
    });
  }
}

export default Tetris;
