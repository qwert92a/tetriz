import EventEmitter from './event-emitter.js';

class ChatManager extends EventEmitter {
  constructor() {
    super();
    this.container = document.querySelector('.chat');
    this.rightBtn = this.container.querySelector('.arrow.right');
    this.leftBtn = this.container.querySelector('.arrow.left');
    this.contents = this.container.querySelector('.chat__contents');
    this.input = this.contents.querySelector('.chat__input');

    this.leftBtn.classList.add('hide');

    this._setEventListener();
  }

  openChatBox() {
    this.container.classList.remove('minimize');
    this.rightBtn.classList.remove('hide');
    this.leftBtn.classList.add('hide');
  }

  closeChatBox() {
    this.container.classList.add('minimize');
    this.rightBtn.classList.add('hide');
    this.leftBtn.classList.remove('hide');
  }

  _setEventListener() {
    this.rightBtn.addEventListener('click', (e) => {
      this.closeChatBox();
    });

    this.leftBtn.addEventListener('click', (e) => {
      this.openChatBox();
    });

    document.querySelector('body').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (document.activeElement !== this.input) {
          this.leftBtn.click();
          this.input.focus();
        } else {
          if (this.input.value !== '') {
            super.emit('user-chat', { contents: this.input.value });
          }
          this.input.value = '';
          this.input.blur();
        }
      }
    });
  }

  renderMessage(msg) {
    const $msg = document.createElement('div');
    $msg.classList.add('msg');
    switch (msg.type) {
      case 'create-room':
      case 'join-room':
        $msg.innerHTML = `<span class="msg__system">you joined the room#${msg.roomID}</span>`;
        break;
      case 'join-player':
        $msg.innerHTML = `<span class="msg__player-id">${msg.id
          .slice(0, 5)
          .toUpperCase()}</span><span class="msg__system">&nbsp;&nbsp;&nbsp;joined.</span>`;
        break;
      case 'leave-player':
        $msg.innerHTML = `<span class="msg__player-id">${msg.id
          .slice(0, 5)
          .toUpperCase()}</span><span class="msg__system">&nbsp;&nbsp;&nbsp;leaved.</span>`;
        break;
      case 'user-chat':
        $msg.innerHTML = `<span class="msg__player-id">${msg.id
          .slice(0, 5)
          .toUpperCase()}</span><span class="msg__system">&nbsp;&nbsp;&nbsp;${
          msg.contents
        }</span>`;
        break;
      case 'my-chat':
        $msg.innerHTML = `<span class="msg__my-id">${msg.id
          .slice(0, 5)
          .toUpperCase()}</span><span class="msg__system">&nbsp;&nbsp;&nbsp;${
          msg.contents
        }</span>`;
        break;
    }
    this.contents.appendChild($msg);
    this.contents.scrollTop = this.contents.scrollHeight;
    // this.contents.
  }
}

export default ChatManager;
