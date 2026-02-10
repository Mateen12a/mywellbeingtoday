// src/utils/socket.js
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(API_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// Track registered listeners to prevent duplicates
const registeredListeners = new Map();

export const connectSocket = (token) => {
  if (token && !socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Safe event listener registration that prevents duplicates
export const safeOn = (event, handler, key) => {
  const listenerKey = key || `${event}-${Date.now()}`;
  
  // Remove existing listener with same key if it exists
  if (registeredListeners.has(listenerKey)) {
    socket.off(event, registeredListeners.get(listenerKey));
  }
  
  // Register new listener
  registeredListeners.set(listenerKey, handler);
  socket.on(event, handler);
  
  // Return cleanup function
  return () => {
    socket.off(event, handler);
    registeredListeners.delete(listenerKey);
  };
};

// Safe listener removal
export const safeOff = (event, handler, key) => {
  socket.off(event, handler);
  if (key && registeredListeners.has(key)) {
    registeredListeners.delete(key);
  }
};
