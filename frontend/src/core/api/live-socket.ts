import { type IChatSocket, type WebSocketMessage } from "@/core/api/types/generated";

export class LiveSocketService implements IChatSocket {
  private static instance: LiveSocketService;
  private ws: WebSocket | null = null;
  private url: string = "";
  private listeners: ((msg: WebSocketMessage) => void)[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitDisconnect = false;

  public static getInstance(): LiveSocketService {
    if (!LiveSocketService.instance) {
      LiveSocketService.instance = new LiveSocketService();
    }
    return LiveSocketService.instance;
  }

  connect(url: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        // If URL changed (e.g. session switch), we force reconnect
        if (this.url !== url) {
             console.log(`⚡ Switching socket connection from ${this.url} to ${url}`);
             this.disconnect();
        } else {
             console.log("⚡ Socket already connected.");
             return;
        }
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
        
        if (data.type === 'CHAT_HISTORY') {
            console.debug("📥 [Socket-Debug] Raw CHAT_HISTORY payload:", data.payload);
        }

        this.listeners.forEach(listener => listener(data));
      } catch (err) {
        console.error("❌ Failed to parse WebSocket message:", err);
      }
    };

    this.ws.onclose = (event) => {
       console.log(`⚠️ WebSocket Disconnected (Code: ${event.code})`);
      if (!this.isExplicitDisconnect) {
        console.log("Reconnecting in 3s...");
        this.reconnectTimer = setTimeout(() => this.connect(this.url), 3000);
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

  onMessage(callback: (msg: WebSocketMessage) => void) {
    this.listeners.push(callback);
    return () => {
        this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const socketService = LiveSocketService.getInstance();