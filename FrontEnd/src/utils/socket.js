import { io } from 'socket.io-client';

const SOCKET_URL = 'https://kisansetu-backend-w2ni.onrender.com';
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
