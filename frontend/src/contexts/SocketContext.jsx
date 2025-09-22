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
  const isConnectingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const userHashRef = useRef(null);

  // Create a stable hash of user properties to detect changes
  const createUserHash = useCallback((user) => {
    if (!user) return null;
    const userId = user.id || user._id;
    return `${userId}-${user.shopId}-${user.role}-${user.username}`;
  }, []);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('SocketContext: Disconnecting socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
    isConnectingRef.current = false;
    hasInitializedRef.current = false;
  }, []);

  // Connect socket with enhanced validation
  const connectSocket = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || socketRef.current?.connected) {
      console.log('SocketContext: Already connecting or connected, skipping');
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

    // Check if we're trying to connect with the same user (prevent unnecessary reconnections)
    const currentUserHash = createUserHash(user);
    if (currentUserHash === userHashRef.current && socketRef.current?.connected) {
      console.log('SocketContext: Already connected with same user, skipping');
      return;
    }

    // Clean up existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
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
    userHashRef.current = currentUserHash;
    setConnectionStatus('connecting');
    setError(null);

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      maxReconnectionAttempts: 3
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
      hasInitializedRef.current = true;
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
      
      // Don't auto-reconnect if this was a manual disconnect
      if (reason !== 'io client disconnect') {
        console.log('SocketContext: Will attempt to reconnect automatically');
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

    newSocket.on('reconnect_failed', () => {
      console.log('SocketContext: Reconnection failed');
      isConnectingRef.current = false;
      setConnectionStatus('error');
      setError('Reconnection failed');
    });

    newSocket.on('pong', (data) => {
      console.log('SocketContext: Pong received:', data);
    });

  }, [user?.id, user?._id, user?.shopId, user?.role, user?.username, isAuthenticated, createUserHash]);

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

  // Main effect to manage socket connection
  useEffect(() => {
    const currentUserHash = createUserHash(user);
    
    // Should connect?
    const shouldConnect = isAuthenticated && 
                         user && 
                         user.role !== 'super_admin' && 
                         user.shopId &&
                         (user.id || user._id);

    // Should disconnect?
    const shouldDisconnect = !shouldConnect || 
                           (currentUserHash !== userHashRef.current && hasInitializedRef.current);

    console.log('SocketContext: Effect triggered', {
      shouldConnect,
      shouldDisconnect,
      currentUserHash,
      previousHash: userHashRef.current,
      hasInitialized: hasInitializedRef.current,
      isAuthenticated,
      userRole: user?.role,
      shopId: user?.shopId
    });

    if (shouldDisconnect) {
      console.log('SocketContext: Disconnecting due to auth/user changes');
      disconnectSocket();
    }

    if (shouldConnect && !socketRef.current?.connected && !isConnectingRef.current) {
      console.log('SocketContext: Connecting socket');
      connectSocket();
    }

  }, [isAuthenticated, user?.id, user?._id, user?.shopId, user?.role, connectSocket, disconnectSocket, createUserHash]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('SocketContext: Component unmounting, cleaning up');
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