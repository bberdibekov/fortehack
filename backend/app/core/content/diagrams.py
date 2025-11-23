class DiagramRepository:
    """
    Central repository for Mermaid templates.
    """
    
    BLANK = "graph TD; Start --> End;"
    
    LOAN_FLOW = """
    graph TD
        Start((Start)) --> App[Submit Application]
        subgraph "Validation Layer"
            App --> KYC{KYC Valid?}
            KYC -- No --> Rej1[Auto-Reject]
            KYC -- Yes --> Risk[Risk Engine]
        end
        subgraph "Core Banking"
            Risk --> Score{Score > 700?}
            Score -- No --> Manual[Manual Review]
            Score -- Yes --> Appr[Auto-Approve]
        end
        style Risk fill:#ff9,stroke:#333
    """

    AUTH_FLOW = """
    sequenceDiagram
        actor User
        participant App
        participant AuthServer
        User->>App: Login
        App->>AuthServer: POST /token
        AuthServer-->>App: 200 OK (JWT)
    """