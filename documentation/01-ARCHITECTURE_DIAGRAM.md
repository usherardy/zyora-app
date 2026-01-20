# Architecture Diagrams

## System Architecture Diagram

```mermaid
graph TB
    subgraph Mobile["Mobile Client Layer"]
        A["Auth Screen<br/>(OAuth/Email)"] --> B["Tab Navigation"]
        B --> C["Studio<br/>(Image Upload)"]
        B --> D["Vault<br/>(Saved Looks)"]
        B --> E["Profile<br/>(Settings)"]
        C --> F["Generate Screen<br/>(Processing)"]
    end
    
    subgraph State["State Management"]
        G["Zustand Auth Store"]
        H["Zustand Preferences Store"]
        I["AsyncStorage<br/>(Persistence)"]
    end
    
    subgraph Services["Services"]
        J["Firebase Auth<br/>(OAuth/User)"]
        K["Local File System<br/>(Images)"]
        L["Media Library<br/>(Save)"]
    end
    
    subgraph Backend["Backend API Layer"]
        M["Express Server<br/>(Vercel)"]
        N["Token Exchange<br/>Endpoint"]
        O["Generate Look<br/>Endpoint"]
        P["Health Check<br/>Endpoint"]
    end
    
    subgraph External["External Services"]
        Q["Google Cloud<br/>Vertex AI"]
        R["Firebase<br/>Database"]
        S["Google OAuth<br/>Provider"]
    end
    
    Mobile --> State
    State --> Services
    Mobile --> Services
    Mobile --> J
    J --> S
    Mobile --> K
    Mobile --> L
    F --> M
    M --> O
    O --> Q
    M --> N
    N --> J
    M --> P
    Backend --> R
    State --> I
    
    style Mobile fill:#e1f5ff
    style State fill:#f3e5f5
    style Services fill:#e8f5e9
    style Backend fill:#fff3e0
    style External fill:#fce4ec
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Mobile App
    participant Firebase as Firebase Auth
    participant Google as Google OAuth
    participant Backend as Backend API

    User->>App: Opens App
    App->>App: Load from AsyncStorage
    alt User Found in Storage
        App->>App: Set user state, goto (tabs)
    else No User
        App->>App: Show Auth Screen
        User->>App: Click "Sign in with Google"
        App->>Google: Initiate OAuth Flow
        User->>Google: Authenticate & Grant Consent
        Google-->>App: Return OAuth Code/Token
        App->>Backend: POST /api/exchange-token
        Backend->>Firebase: Exchange for Firebase Token
        Firebase-->>Backend: Firebase Auth Token
        Backend-->>App: Return Firebase Token
        App->>Firebase: Sign in with Token
        Firebase-->>App: User Profile
        App->>App: Store in Zustand + AsyncStorage
        App->>App: Navigate to (tabs)
    end
```

## Image Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant App as Mobile App<br/>studio.tsx
    participant Store as Zustand Store
    participant API as Backend API
    participant VertexAI as Google<br/>Vertex AI
    participant LocalStorage as Local Storage

    User->>App: Select User Photo
    App->>Store: setUserImg(ImageAsset)
    Store->>LocalStorage: Save image reference
    
    User->>App: Select Outfit Image
    App->>Store: setFitImg(ImageAsset)
    Store->>LocalStorage: Save image reference
    
    User->>App: Click Generate
    App->>App: Navigate to generate.tsx
    App->>App: Convert images to base64
    App->>Store: Get user & fit images
    
    App->>API: POST /api/generate-look
    Note over App,API: Images as FormData/JSON
    
    API->>VertexAI: Send to Vertex AI Service
    Note over API,VertexAI: Processing...
    VertexAI-->>API: Generated Image (base64)
    
    alt Success
        API-->>App: { success: true, image: base64 }
        App->>Store: Display generated image
        User->>App: Click "Save to Vault"
        App->>Store: addSavedLook(SavedLook)
        Store->>LocalStorage: Persist saved look
    else Error
        API-->>App: { success: false, error: message }
        App->>App: Show error, allow retry
    end
```

## State Management Architecture

```mermaid
graph LR
    subgraph External["External Sources"]
        A["Firebase Auth"]
        B["AsyncStorage"]
    end
    
    subgraph Zustand["Zustand Stores"]
        C["authStore<br/>- user<br/>- isLoading<br/>- userImg<br/>- fitImg<br/>- savedLooks<br/>- isDevMode<br/>- quota"]
        D["preferencesStore<br/>- theme<br/>- notifications<br/>- language"]
    end
    
    subgraph UI["UI Components"]
        E["Auth Screen"]
        F["Studio Screen"]
        G["Generate Screen"]
        H["Vault Screen"]
        I["Profile Screen"]
    end
    
    A --> C
    B --> C
    B --> D
    C --> E
    C --> F
    C --> G
    C --> H
    C --> I
    D --> I
    
    E --> B
    H --> B
    I --> B
```

## Data Model Relationships

```mermaid
erDiagram
    USER ||--o{ SAVED_LOOK : "has"
    USER ||--o{ IMAGE_ASSET : "has"
    SAVED_LOOK ||--o{ IMAGE_ASSET : "references"
    USER {
        string uid PK
        string displayName
        string email
        string photoURL
        int quota
        int maxQuota
    }
    SAVED_LOOK {
        string id PK
        string image "base64"
        timestamp createdAt
        string userImageUri FK
        string fitImageUri FK
    }
    IMAGE_ASSET {
        string id PK
        string uri
        string type "user|fit|generated"
        timestamp date
        string base64 "optional"
    }
```

## Component Hierarchy

```mermaid
graph TD
    A["App Root<br/>_layout.tsx"]
    A --> B["Navigation Stack"]
    B --> C["Index<br/>Auth Screen"]
    B --> D["Tabs<br/>_layout.tsx"]
    D --> E["Studio Screen"]
    D --> F["Vault Screen"]
    D --> G["Profile Screen"]
    B --> H["Generate Screen"]
    C --> I["Auth Component"]
    E --> J["Image Picker"]
    E --> K["Generate Button"]
    F --> L["Gallery Grid"]
    F --> M["Delete Button"]
    G --> N["Profile Info"]
    G --> O["Settings Nav"]
    H --> P["Loading Animation"]
    H --> Q["Result Display"]
    H --> R["Save Button"]
    
    style A fill:#4CAF50
    style D fill:#2196F3
    style E fill:#FF9800
    style F fill:#9C27B0
    style G fill:#F44336
    style H fill:#00BCD4
```

