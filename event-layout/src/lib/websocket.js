/**
 * WebSocket client for real-time updates
 */

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.eventId = null;
    this.eventType = null; // 'conference' or 'tradeshow'
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.isIntentionallyClosed = false;
  }

  /**
   * Connect to WebSocket server
   * @param {string} eventType - 'conference' or 'tradeshow'
   * @param {string} eventId - Event ID
   */
  connect(eventType, eventId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.eventType = eventType;
    this.eventId = eventId;
    this.isIntentionallyClosed = false;

    // Use ws:// for localhost, wss:// for production
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/${eventType}/${eventId}/`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', { eventType, eventId });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);
          
          // Emit event based on type
          if (data.type) {
            this.emit(data.type, data.data || data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect(this.eventType, this.eventId);
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.emit('error', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.isIntentionallyClosed = true;
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Send data to WebSocket server
   * @param {object} data - Data to send
   */
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send data:', data);
    }
  }

  /**
   * Add event listener
   * @param {string} eventType - Event type to listen for
   * @param {function} callback - Callback function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {function} callback - Callback function to remove
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} eventType - Event type
   * @param {any} data - Event data
   */
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient;
