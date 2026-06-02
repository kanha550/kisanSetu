import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:550';
let socket;

export const connectSocket = (token) => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true
  });
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
