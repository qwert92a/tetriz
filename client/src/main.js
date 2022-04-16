import ConnectionManager from './connection-manager.js';
import TetrisManager from './tetris-manager.js';
import ChatManager from './chat-manager.js';

const tetrisManager = new TetrisManager(
  document.querySelector('.tetris-manager')
);
const chatManager = new ChatManager();

const connectionManager = new ConnectionManager(tetrisManager, chatManager);
/////////////////////////////////////////////
window.connectionManager = connectionManager;
//////////////////////////////////////////////
connectionManager.connect();

const roomID = window.location.hash.split('#')[1];
if (roomID) {
  connectionManager.joinRoom(roomID);
} else {
  connectionManager.createRoom();
}
