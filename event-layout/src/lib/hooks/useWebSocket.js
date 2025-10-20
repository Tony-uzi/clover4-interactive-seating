/**
 * React hook for WebSocket connection
 */

import { useEffect, useRef, useState } from 'react';
import websocketClient from '../websocket';

/**
 * Hook to manage WebSocket connection for real-time updates
 * 
 * @param {string} eventType - 'conference' or 'tradeshow'
 * @param {string} eventId - Event ID
 * @param {object} handlers - Event handlers { element_update, guest_update, etc. }
 * @returns {object} - { isConnected, send }
 */
export function useWebSocket(eventType, eventId, handlers = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef(handlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!eventType || !eventId) {
      console.log('No eventType or eventId provided, skipping WebSocket connection');
      return;
    }

    console.log(`Connecting WebSocket for ${eventType} event ${eventId}`);

    // Connect to WebSocket
    websocketClient.connect(eventType, eventId);

    // Connection status handlers
    const handleConnected = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Register connection status handlers
    websocketClient.on('connected', handleConnected);
    websocketClient.on('disconnected', handleDisconnected);
    websocketClient.on('error', handleError);

    // Register custom handlers
    Object.entries(handlersRef.current).forEach(([eventType, handler]) => {
      websocketClient.on(eventType, handler);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      
      // Remove all handlers
      websocketClient.off('connected', handleConnected);
      websocketClient.off('disconnected', handleDisconnected);
      websocketClient.off('error', handleError);
      
      Object.entries(handlersRef.current).forEach(([eventType, handler]) => {
        websocketClient.off(eventType, handler);
      });

      // Disconnect (but don't close if other components are using it)
      // websocketClient.disconnect();
    };
  }, [eventType, eventId]);

  /**
   * Send data through WebSocket
   */
  const send = (data) => {
    websocketClient.send(data);
  };

  return {
    isConnected,
    send,
  };
}

export default useWebSocket;
