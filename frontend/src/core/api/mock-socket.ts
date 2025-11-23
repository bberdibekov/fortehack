import { type IChatSocket, type WebSocketMessage } from "./websocket-types";

export class MockSocketService implements IChatSocket {
  private callback: ((msg: WebSocketMessage) => void) | null = null;
  
  connect(url: string) {
    console.log(`Mock Socket connected to ${url}`);
  }

  disconnect() {
    console.log('Mock Socket disconnected');
  }

  sendMessage(text: string) {
    // Simulate AI thinking delay
    setTimeout(() => {
      this.emit({ type: 'STATUS_UPDATE', payload: 'thinking' });
      this.simulateStreamingResponse();
    }, 600);
  }

  onMessage(callback: (msg: WebSocketMessage) => void) {
    this.callback = callback;
  }

  private emit(msg: WebSocketMessage) {
    if (this.callback) this.callback(msg);
  }

  private simulateStreamingResponse() {
    const response = `I have analyzed your request. \n\nI have generated three artifacts for you:\n1. A Process Flow Diagram\n2. An Analyst Workbook (Scope & KPIs)\n3. The User Stories Backlog.`;
    const tokens = response.split(' ');
    let i = 0;

    // 1. Stream Text
    const interval = setInterval(() => {
      if (i >= tokens.length) {
        clearInterval(interval);
        this.emit({ type: 'STATUS_UPDATE', payload: 'idle' });
        
        // --- START ARTIFACT GENERATION SEQUENCE ---

        // 2. Open Mermaid Chart (Process Flow)
        setTimeout(() => {
           this.emit({
             type: 'ARTIFACT_OPEN',
             payload: {
               id: 'art-mermaid-1',
               type: 'mermaid',
               title: 'Process Flow',
               language: 'mermaid',
               content: `graph TD
                A[User Request] --> B{Valid?}
                B -->|Yes| C[Process Data]
                B -->|No| D[Reject]
                C --> E[Update DB]
                E --> F[Send Email]
                style A fill:#f9f,stroke:#333
                style F fill:#bbf,stroke:#333`
             }
           });
        }, 500);

        // 3. Open Analyst Workbook (Workbook)
        setTimeout(() => {
           const workbookData = {
             categories: [
               {
                 id: "cat_1",
                 title: "Goal & Scope",
                 icon: "target",
                 items: [
                   { id: "1", text: "Automate financial reporting." },
                   { id: "2", text: "Scope: Q3 Data only." }
                 ]
               },
               {
                 id: "cat_2",
                 title: "KPIs",
                 icon: "activity",
                 items: [
                   { id: "3", text: "Reduce time by 50%." }
                 ]
               }
             ]
           };

           this.emit({
             type: 'ARTIFACT_OPEN',
             payload: {
               id: 'art-wb-1',
               type: 'workbook',
               title: 'Analyst Workbook',
               language: 'json',
               content: JSON.stringify(workbookData, null, 2)
             }
           });
        }, 1200); // 700ms after the previous one

        // 4. Open User Stories (Stories)
        setTimeout(() => {
           const storyData = {
             stories: [
               {
                 id: "US-101",
                 priority: "High",
                 estimate: "5 SP",
                 role: "Admin",
                 action: "configure the settings",
                 benefit: "I can control access",
                 description: "Admin needs a dashboard.",
                 goal: "Security",
                 scope: ["Login", "MFA"],
                 outOfScope: ["Biometrics"],
                 acceptanceCriteria: ["User can login", "User can logout"]
               }
             ]
           };

           this.emit({
             type: 'ARTIFACT_OPEN',
             payload: {
               id: 'art-stories-1',
               type: 'stories',
               title: 'User Stories', // Clean Title
               language: 'json',
               content: JSON.stringify(storyData, null, 2)
             }
           });
        }, 2000); // 800ms after the previous one

        return;
      }

      this.emit({ type: 'CHAT_DELTA', payload: tokens[i] + ' ' });
      i++;
    }, 30); 
  }
}