import { io } from 'socket.io-client';
import { browser } from '$app/environment';

// Only initialize the socket in browser environments
let socketInstance: any = null;

if (browser) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/api$/, '');
  
  socketInstance = io(`${wsUrl}/ws/socket.io`, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    path: '/socket.io'
  });

  // Add auth token to socket connection
  socketInstance.on('connect', () => {
    console.log('Socket connected!');
  });

  socketInstance.on('disconnect', (reason: string) => {
    console.log('Socket disconnected:', reason);
    
    // If we were disconnected because of authentication, don't try to reconnect
    if (reason === 'io server disconnect') {
      // The server has forcefully disconnected the socket
      console.log('Server has disconnected the socket.');
    }
  });

  socketInstance.on('connect_error', (error: any) => {
    console.error('Socket connection error:', error);
  });

  // Intercept and update auth token before connection
  const originalConnect = socketInstance.connect.bind(socketInstance);
  socketInstance.connect = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      socketInstance.auth = { token };
    }
    return originalConnect();
  };
}

// Function to connect the socket if it's initialized and not already connected
function connectSocket() {
  if (socketInstance && !socketInstance.connected) {
    socketInstance.connect();
  }
}

// Function to disconnect the socket if it's connected
function disconnectSocket() {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
}

// Re-export the socket instance and helper functions
export const socket = socketInstance;
export { connectSocket, disconnectSocket };
