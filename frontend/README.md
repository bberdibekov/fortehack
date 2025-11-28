# AI Business Analyst Platform

A **AI Agent Interface** designed to automate business analysis. This platform mimics the workflow of a human analyst, holding conversations to gather requirements and automatically generating structured documentation (User Stories, Process Flows, Use Cases, Data Dictionaries) in real-time.

It features a **split-pane architecture** where the Chat Interface (Left) drives the creation of interactive, structured **Artifacts** (Right), with full bidirectional synchronization and Confluence integration.

---

## 🚀 Key Capabilities

### 1. The "Artifact" System (Structured Output)
Unlike standard chatbots that dump text, this platform generates **Interactive Artifacts**. The AI detects the type of content needed and renders specialized viewers:

*   **📘 Analyst Workbook:** A strategic dashboard for Goals, Scope, Actors, and KPIs.
    *   **Context-Aware Styling:** Actors render as "Persona Cards", KPIs as "Metric Bars", and Goals as "Checklists".
    *   **Smart Flows:** Typing `Step A -> Step B` automatically renders a visual "Pill" flowchart.
    *   **New Sections:** Now includes **Data Dictionary** (Schema tables) and **NFRs** (Security/Compliance checklists).
*   **🚦 Use Case Engine:** Visualizes functional requirements as interactive "Subway Maps".
    *   **Happy Path:** Vertical stepper visualization.
    *   **Exception Handling:** Alternative flows appear as nested warnings (Amber boxes) directly in context.
*   **📋 User Story Backlog:** A fully interactive backlog manager. Stories include Priority, Estimates, Acceptance Criteria, and Scope boundaries (In/Out).
*   **🔀 Mermaid Diagrams:** Automatically renders complex process flows and sequence diagrams with pan/zoom capabilities and export-to-SVG.

### 2. Bidirectional Data Sync
The platform is not just a viewer; it is an **editor**.
*   **Live Editing:** Users can edit generated requirements directly in the UI (e.g., tweak a User Story acceptance criterion or fix a Use Case step).
*   **Stateful Synchronization:** Edits are instantly normalized (CamelCase <-> SnakeCase) and synced back to the backend via WebSocket.
*   **Context Awareness:** The AI Agent is aware of user edits. If you change a "Goal" manually, the AI considers that change in future responses.

### 3. Enterprise Integration (Confluence)
One-click publishing transforms raw JSON state into professional documentation.
*   **Native Rendering:** Backend converts React UI structures into **Confluence XHTML Storage Format**.
*   **Visual Fidelity:**
    *   User Stories become interactive panels with colored status macros.
    *   Process Flows are rendered as "Pill" sequences (`Login` ➤ `Verify` ➤ `Success`).
    *   Use Cases use 2-column layouts for preconditions and tables for flows.
    *   Mermaid diagrams are rasterized to SVG and embedded as attachments.

### 4. Real-Time Streaming & Orchestration
*   **WebSocket Architecture:** Full-duplex communication handles chat streaming (`CHAT_DELTA`) and artifact updates (`ARTIFACT_UPDATE`) simultaneously.
*   **Session Management:** URL-based session persistence allows users to share analysis sessions via link.
*   **Status Island:** A dynamic UI element (Top Center) providing real-time visibility into the Agent's internal state (e.g., "Thinking...", "Drafting User Stories...", "Validating Scope").

---

## 🛠️ Technical Stack

**Frontend:**
*   **Core:** React 18, TypeScript, Vite
*   **State:** Zustand (Global UI, Chat, Artifact stores)
*   **Styling:** Tailwind CSS, Shadcn UI, Lucide Icons
*   **Visualization:** Mermaid.js, React Flow logic
*   **Network:** Native WebSocket API with custom reconnection & session logic
*   **Serialization:** Custom adapters to bridge Python (SnakeCase) and JS (CamelCase) models.

**Backend Protocol:**
*   **Format:** JSON over WebSocket
*   **Schema:** Auto-generated Pydantic models.
*   **Publishing:** Jinja2 templates generating Confluence XML.

---

## 📂 Project Structure

```text
src/
├── app/layouts/           # 3-Panel Resizable Layout (Chat | Artifacts)
├── core/
│   ├── api/               # WebSocket Service & Generated Schemas
│   └── store/             # Zustand Stores (Chat, Artifacts, UI)
├── features/
│   ├── chat/              # Chat Logic, Message Rendering, Attachments
│   └── artifacts/         # The heart of the platform
│       ├── components/    # Tab Bar, Headers
│       └── viewers/       # Specialized Renderers
│           ├── analyst-workbook.tsx  # Goals, KPIs, Data Dict, NFRs
│           ├── use-case-viewer.tsx   # Functional Flows (Subway Map)
│           ├── user-story-viewer.tsx # Backlog Management
│           └── mermaid-viewer.tsx    # Diagrams
└── shared/                # Reusable UI primitives (Buttons, Cards, Dialogs)
```

## ⚡ Getting Started

### Prerequisites
*   Node.js 18+
*   Python Backend (Running on `ws://localhost:8000`)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/ai-analyst-platform.git
    cd ai-analyst-platform
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Connect to Backend**
    Ensure your backend is running. The frontend will automatically attempt to connect to `ws://localhost:8000/ws/{client_id}`.

## 🤝 Contribution Guidelines

1.  **Schema First:** Never modify TypeScript interfaces manually. Update the Python Pydantic models and run the generation script to ensure Frontend/Backend parity.
2.  **Strict Typing:** Do not use `any`. Use the generated types from `@/core/api/types/generated`.
3.  **Normalization:** Always implement a normalization layer in new Viewers to handle Snake/Camel case conversion safely.

---

## 📜 License
Internal Enterprise License. Confidential.