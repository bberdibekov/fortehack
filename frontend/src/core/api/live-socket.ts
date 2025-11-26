import { type IChatSocket, type WebSocketMessage } from "@/core/api/types/generated";

export class LiveSocketService implements IChatSocket {
  private static instance: LiveSocketService;
  private ws: WebSocket | null = null;
  private url: string = "";
  // Observer pattern: Allow multiple parts of the app to listen if needed
  private listeners: ((msg: WebSocketMessage) => void)[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitDisconnect = false;

  // Singleton Accessor
  public static getInstance(): LiveSocketService {
    if (!LiveSocketService.instance) {
      LiveSocketService.instance = new LiveSocketService();
    }
    return LiveSocketService.instance;
  }

  connect(url: string) {
    // Prevent double connections if already connected/connecting
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        console.log("⚡ Socket already connected or connecting.");
        return;
    }

    this.url = url;
    this.isExplicitDisconnect = false;
    
    console.log(`🔌 Connecting to ${url}...`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("✅ WebSocket Connected");
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Broadcast to all listeners
        this.listeners.forEach(listener => listener(data));
      } catch (err) {
        console.error("❌ Failed to parse WebSocket message:", err);
      }
    };

    this.ws.onclose = () => {
      if (!this.isExplicitDisconnect) {
        console.log("⚠️ WebSocket Disconnected. Reconnecting in 3s...");
        this.reconnectTimer = setTimeout(() => this.connect(this.url), 3000);
      } else {
        console.log("🛑 WebSocket Disconnected (User initiated)");
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };
  }

  disconnect() {
    this.isExplicitDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(text: string) {
    this.send("USER_MESSAGE", text);
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("⚠️ Cannot send message: Socket not open");
    }
  }

  // Updated to support multiple listeners
  onMessage(callback: (msg: WebSocketMessage) => void) {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
        this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

// Export the singleton instance helper
export const socketService = LiveSocketService.getInstance();