import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('useSocket must be used within a SocketProvider - returning safe defaults');
    return {
      socket: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: null,
      lastRateUpdate: null,
      systemBlocking: null,
      connectSocket: () => {},
      disconnectSocket: () => {},
      pingSocket: () => {},
      requestRateUpdate: () => {},
      isReady: false,
      isConnecting: false,
      isReconnecting: false,
      hasError: false,
      getStatusMessage: () => 'Not connected to real-time updates',
      getStatusColor: () => 'gray'
    };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [lastRateUpdate, setLastRateUpdate] = useState(null);
  const [systemBlocking, setSystemBlocking] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Connect socket with enhanced validation
  const connectSocket = useCallback(() => {
    if (isConnectingRef.current || socketRef.current?.connected) {
      return;
    }

    if (!user || !isAuthenticated) {
      console.log('SocketContext: No authenticated user for connection');
      return;
    }

    if (user.role === 'super_admin') {
      console.log('SocketContext: Super admin users do not connect to sockets');
      return;
    }

    const userId = user.id || user._id;
    const requiredProps = [
      { key: 'userId', value: userId },
      { key: 'shopId', value: user.shopId },
      { key: 'username', value: user.username },
      { key: 'role', value: user.role }
    ];
    
    const missingProps = requiredProps.filter(prop => !prop.value);
    
    if (missingProps.length > 0) {
      console.error('SocketContext: Missing required user properties:', missingProps.map(p => p.key));
      setError(`Missing user information: ${missingProps.map(p => p.key).join(', ')}`);
      setConnectionStatus('error');
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Get server URL - ensure we don't have /api in the socket URL
    const SERVER_URL = (() => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        return apiUrl.replace('/api', '');
      }
      return window.location.origin;
    })();
    
    console.log('SocketContext: Connecting to server:', SERVER_URL);
    
    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    setError(null);

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      // Add these options for better reliability
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('SocketContext: Connected with ID:', newSocket.id);
      isConnectingRef.current = false;
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      
      const shopData = {
        shopId: user.shopId,
        userId: userId,
        username: user.username,
        role: user.role
      };

      console.log('SocketContext: Joining shop with data:', shopData);
      newSocket.emit('join-shop', shopData);
    });

    newSocket.on('joined-shop', (data) => {
      console.log('SocketContext: Successfully joined shop room:', data);
      setConnectionStatus('joined');
    });

    newSocket.on('join-error', (data) => {
      console.error('SocketContext: Error joining shop room:', data);
      setError(data.message);
      setConnectionStatus('error');
      isConnectingRef.current = false;
    });

    // Real-time updates
    newSocket.on('rate-updated', (data) => {
      console.log('SocketContext: Rate update received:', data);
      setLastRateUpdate(data);
      
      // Trigger custom event for components
      const event = new CustomEvent('rateUpdate', { 
        detail: { 
          rates: data.rates, 
          updateInfo: data.updateInfo,
          timestamp: data.timestamp 
        } 
      });
      window.dispatchEvent(event);
    });

    newSocket.on('system-blocking-changed', (data) => {
      console.log('SocketContext: System blocking changed:', data);
      setSystemBlocking(data);
      
      const event = new CustomEvent('systemBlockingChanged', { 
        detail: { 
          isBlocked: data.isBlocked, 
          message: data.message,
          timestamp: data.timestamp 
        } 
      });
      window.dispatchEvent(event);
    });

    // Error handling
    newSocket.on('connect_error', (error) => {
      console.error('SocketContext: Connection error:', error.message);
      isConnectingRef.current = false;
      setIsConnected(false);
      setConnectionStatus('error');
      setError('Connection failed: ' + error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('SocketContext: Disconnected:', reason);
      isConnectingRef.current = false;
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Only auto-reconnect for certain reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => {
          if (user && user.shopId && user.role !== 'super_admin') {
            connectSocket();
          }
        }, 2000);
      }
    });

    // Reconnection handling
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('SocketContext: Reconnection attempt:', attemptNumber);
      setConnectionStatus('reconnecting');
      setError(null);
    });

    newSocket.on('reconnect', () => {
      console.log('SocketContext: Reconnected successfully');
      isConnectingRef.current = false;
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    newSocket.on('pong', (data) => {
      console.log('SocketContext: Pong received:', data);
    });

  }, [user, isAuthenticated]);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (socketRef.current) {
      console.log('SocketContext: Manually disconnecting socket');
      socketRef.current.emit('leave-shop');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
    isConnectingRef.current = false;
  }, []);

  const pingSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  const requestRateUpdate = useCallback(() => {
    if (socketRef.current?.connected && user?.shopId) {
      socketRef.current.emit('request-rate-update', { shopId: user.shopId });
    }
  }, [user?.shopId]);

  // Connect when user is ready
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'super_admin' && user.shopId) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, user?.shopId, user?.role, connectSocket, disconnectSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    error,
    lastRateUpdate,
    systemBlocking,
    connectSocket,
    disconnectSocket,
    pingSocket,
    requestRateUpdate,
    isReady: isConnected && connectionStatus === 'joined',
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
    hasError: !!error,
    getStatusMessage: () => {
      switch (connectionStatus) {
        case 'connecting':
          return 'Connecting to real-time updates...';
        case 'connected':
          return 'Connected, joining shop...';
        case 'joined':
          return 'Real-time updates active';
        case 'reconnecting':
          return 'Reconnecting...';
        case 'error':
          return error || 'Connection error';
        case 'disconnected':
        default:
          return 'Offline';
      }
    },
    getStatusColor: () => {
      switch (connectionStatus) {
        case 'joined':
          return 'green';
        case 'connecting':
        case 'connected':
        case 'reconnecting':
          return 'yellow';
        case 'error':
          return 'red';
        case 'disconnected':
        default:
          return 'gray';
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};