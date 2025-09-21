// Socket.IO service utility for managing real-time connections
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;
  }

  // Initialize socket connection
  connect(serverUrl, options = {}) {
    if (this.socket) {
      this.socket.disconnect();
    }

    const defaultOptions = {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      ...options
    };

    console.log('Initializing Socket.IO connection to:', serverUrl);
    this.socket = io(serverUrl, defaultOptions);

    this.setupEventListeners();
    return this.socket;
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.clearReconnectInterval();
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.emit('error', { error: error.message });
      this.handleReconnection();
    });

    // Rate update events
    this.socket.on('rate-updated', (data) => {
      console.log('Rate update received:', data);
      this.emit('rateUpdated', data);
    });

    // System blocking events
    this.socket.on('system-blocking-changed', (data) => {
      console.log('System blocking changed:', data);
      this.emit('systemBlockingChanged', data);
    });

    // User connection events
    this.socket.on('user-connected', (data) => {
      this.emit('userConnected', data);
    });

    this.socket.on('user-disconnected', (data) => {
      this.emit('userDisconnected', data);
    });

    // Shop room events
    this.socket.on('joined-shop', (data) => {
      console.log('Joined shop room:', data);
      this.emit('joinedShop', data);
    });

    this.socket.on('join-error', (data) => {
      console.error('Shop join error:', data);
      this.emit('joinError', data);
    });
  }

  // Handle automatic reconnection
  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    if (this.reconnectInterval) {
      return; // Already trying to reconnect
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnectAttempt', { attempt: this.reconnectAttempts });
      
      if (this.socket) {
        this.socket.connect();
      }
      
      this.clearReconnectInterval();
    }, delay);
  }

  // Clear reconnection interval
  clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Join shop room
  joinShop(shopData) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join shop');
      return false;
    }

    console.log('Joining shop room:', shopData);
    this.socket.emit('join-shop', shopData);
    return true;
  }

  // Leave shop room
  leaveShop() {
    if (this.socket && this.isConnected) {
      console.log('Leaving shop room');
      this.socket.emit('leave-shop');
      return true;
    }
    return false;
  }

  // Emit event
  emit(eventName, data) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventName} listener:`, error);
        }
      });
    }
  }

  // Add event listener
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  // Remove event listener
  off(eventName, callback) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  // Send ping to test connection
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
      return true;
    }
    return false;
  }

  // Request rate update
  requestRateUpdate(shopId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request-rate-update', { shopId });
      return true;
    }
    return false;
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      isReconnecting: !!this.reconnectInterval
    };
  }

  // Disconnect socket
  disconnect() {
    this.clearReconnectInterval();
    
    if (this.socket) {
      this.leaveShop();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.listeners.clear();
    
    console.log('Socket service disconnected');
  }
}

// Export singleton instance
export default new SocketService();