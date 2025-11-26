import { type IChatSocket, type WebSocketMessage } from "@/core/api/types/generated";

export class LiveSocketService implements IChatSocket {
  private ws: WebSocket | null = null;
  private url: string = "";
  private callback: ((msg: WebSocketMessage) => void) | null = null;
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;

  connect(url: string) {
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
        // Pass directly to the app's handler
        if (this.callback) this.callback(data);
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

  // Generic helper to send any event type (used for edits)
  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("⚠️ Cannot send message: Socket not open");
    }
  }

  onMessage(callback: (msg: WebSocketMessage) => void) {
    this.callback = callback;
  }
}