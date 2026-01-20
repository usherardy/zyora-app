# High-Level System Architecture Diagram

## Main System Architecture

```mermaid
graph TB
    subgraph Mobile["📱 Mobile Client Layer (React Native/Expo)"]
        direction LR
        AuthScreen["Auth Screen<br/>- Google OAuth<br/>- Developer Mode<br/>- Email/Password"]
        TabNav["Tab Navigation<br/>- Studio<br/>- Vault<br/>- Profile"]
        Studio["Studio Screen<br/>- Pick User Photo<br/>- Pick Outfit<br/>- Navigate to Generate"]
        Vault["Vault Screen<br/>- View Saved Looks<br/>- Delete Looks"]
        Profile["Profile Screen<br/>- User Info<br/>- Settings<br/>- Sign Out"]
        Generate["Generate Screen<br/>- Show Loading<br/>- Display Result<br/>- Save Option"]
        
        AuthScreen --> TabNav
        TabNav --> Studio
        TabNav --> Vault
        TabNav --> Profile
        Studio --> Generate
    end
    
    subgraph State["🔄 State Management<br/>(Zustand + AsyncStorage)"]
        direction TB
        AuthStore["AuthStore<br/>- user<br/>- isLoading<br/>- savedLooks<br/>- quota<br/>- imageAssets"]
        PrefsStore["PreferencesStore<br/>- theme<br/>- notifications<br/>- language"]
        LocalStorage["AsyncStorage<br/>- Persistent Data<br/>- Device Local"]
        
        AuthStore --> LocalStorage
        PrefsStore --> LocalStorage
    end
    
    subgraph Services["🔐 Authentication Services"]
        direction TB
        Firebase["Firebase Auth<br/>- OAuth Integration<br/>- User Management<br/>- Session"]
        GoogleOAuth["Google OAuth<br/>- Credential Exchange<br/>- Token Flow"]
        
        Firebase --> GoogleOAuth
    end
    
    subgraph Backend["🚀 Backend API<br/>(Express.js on Vercel)"]
        direction TB
        APILayer["API Layer"]
        TokenEx["Token Exchange<br/>POST /api/exchange-token"]
        GenLook["Generate Look<br/>POST /api/generate-look"]
        HealthCheck["Health Check<br/>GET /api/health"]
        FetchImg["Fetch Image<br/>GET /api/fetch-image"]
        
        APILayer --> TokenEx
        APILayer --> GenLook
        APILayer --> HealthCheck
        APILayer --> FetchImg
    end
    
    subgraph AI["🤖 AI/ML Services"]
        direction TB
        VertexAI["Google Vertex AI<br/>- Custom ML Model<br/>- Image Generation<br/>- Try-On Processing"]
    end
    
    subgraph Storage["💾 Data Storage"]
        direction TB
        FirebaseAuth["Firebase Auth DB<br/>- User Credentials<br/>- Auth State"]
        LocalFiles["Device Storage<br/>- Cache Images<br/>- App Data"]
        CloudOptional["Cloud Optional<br/>- Firestore<br/>- Future Sync"]
    end
    
    Mobile --> State
    Mobile --> Services
    Mobile --> Backend
    State --> LocalStorage
    Services --> Firebase
    Firebase --> FirebaseAuth
    Backend --> GenLook
    GenLook --> VertexAI
    Mobile --> LocalFiles
    Backend --> HealthCheck
    
    style Mobile fill:#E3F2FD
    style State fill:#F3E5F5
    style Services fill:#E8F5E9
    style Backend fill:#FFF3E0
    style AI fill:#FCE4EC
    style Storage fill:#E0F2F1
```

---

## Complete Data Flow

```mermaid
graph TD
    User["👤 User"]
    
    User -->|Opens App| StartApp["App Initialization"]
    StartApp -->|Check AsyncStorage| CheckAuth{"User<br/>Authenticated?"}
    
    CheckAuth -->|Yes| LoadUser["Load User Profile<br/>from Storage"]
    LoadUser -->|Set Zustand| ShowTabs["Show Tab Navigation"]
    
    CheckAuth -->|No| ShowAuth["Show Auth Screen"]
    ShowAuth -->|Tap 'Sign in Google'| GoogleFlow["🔵 Google OAuth Flow"]
    
    GoogleFlow -->|1. Open OAuth| GoogleScreen["Google Login Screen"]
    GoogleScreen -->|2. User Authenticates| GoogleAuth["Google Verifies"]
    GoogleAuth -->|3. Return Auth Code| AppReceive["App Receives Code"]
    AppReceive -->|4. Exchange for Token| BackendToken["Backend Exchange Token"]
    BackendToken -->|5. Firebase Sign-In| FirebaseSignIn["Firebase Auth"]
    FirebaseSignIn -->|6. User Created| UserProfile["UserProfile Object"]
    UserProfile -->|7. Store Locally| StoreData["Save to<br/>Zustand + AsyncStorage"]
    StoreData -->|8. Navigate| ShowTabs
    
    ShowTabs -->|User Opens Studio| StudioScreen["Studio Screen"]
    StudioScreen -->|Pick User Photo| UserPhoto["ImageAsset<br/>type: user"]
    StudioScreen -->|Pick Outfit| OutfitPhoto["ImageAsset<br/>type: fit"]
    UserPhoto -->|Store in Zustand| InMemory["In-Memory State"]
    OutfitPhoto -->|Store in Zustand| InMemory
    
    InMemory -->|Click Generate| Navigate["Navigate to<br/>Generate Screen"]
    Navigate -->|Convert to Base64| B64Conv["Base64 Conversion"]
    B64Conv -->|FormData| CreateReq["Create Request<br/>with Images"]
    CreateReq -->|POST /api/generate-look| SendAPI["Send to Backend"]
    
    SendAPI -->|Backend Receives| ValidateReq["Validate Request<br/>- Image format<br/>- Image size<br/>- User quota"]
    ValidateReq -->|Pass Validation| SendVertex["Send to<br/>Vertex AI"]
    ValidateReq -->|Fail| ReturnError["Return Error"]
    
    SendVertex -->|Processing| MLProcess["ML Model<br/>Generates Image"]
    MLProcess -->|Base64 Result| APIReturn["Return Generation<br/>Result"]
    
    ReturnError -->|Display Error| ShowError["Show Error<br/>to User"]
    ShowError -->|User Retries| CreateReq
    
    APIReturn -->|Success| DisplayGen["Display Generated<br/>Image"]
    DisplayGen -->|User Taps Save| CreateLook["Create SavedLook<br/>Object"]
    CreateLook -->|Add to Store| SaveVault["Add to<br/>Zustand + AsyncStorage"]
    SaveVault -->|Show Vault| VaultNav["Navigate to Vault"]
    
    DisplayGen -->|User Taps Generate Again| StudioScreen
    
    VaultNav -->|View Saved| VaultScreen["Vault Screen"]
    VaultScreen -->|List Looks| DisplayLooks["Display Gallery<br/>of Saved Looks"]
    DisplayLooks -->|User Deletes| RemoveLook["Remove from Store<br/>and Storage"]
    
    ShowTabs -->|User Opens Profile| ProfileScreen["Profile Screen"]
    ProfileScreen -->|Display Info| ShowInfo["Show User Info<br/>- Name<br/>- Email<br/>- Photo<br/>- Quota"]
    ShowInfo -->|User Signs Out| SignOut["Clear Data<br/>- Zustand<br/>- AsyncStorage<br/>- Firebase Session"]
    SignOut -->|Return to Auth| ShowAuth
    
    style User fill:#FFF9C4
    style GoogleFlow fill:#BBDEFB
    style MLProcess fill:#F8BBD0
    style DisplayGen fill:#C8E6C9
    style VaultScreen fill:#D1C4E9
    style ProfileScreen fill:#FFE0B2
```

---

## Component Interaction Diagram

```mermaid
graph LR
    subgraph UI["UI Layer"]
        IndexScreen["index.tsx<br/>Auth Screen"]
        StudioScreen["studio.tsx<br/>Studio"]
        VaultScreen["vault.tsx<br/>Vault"]
        ProfileScreen["profile.tsx<br/>Profile"]
        GenerateScreen["generate.tsx<br/>Generation"]
    end
    
    subgraph Logic["Business Logic Layer"]
        AuthLib["lib/auth.ts<br/>Authentication"]
        APILib["lib/api.ts<br/>API Calls"]
        FirebaseLib["lib/firebase.ts<br/>Firebase Config"]
        StorageLib["lib/storage.ts<br/>Local Storage"]
    end
    
    subgraph State["State Management"]
        AuthStore["authStore.ts<br/>Zustand"]
        PrefsStore["preferencesStore.ts<br/>Zustand"]
    end
    
    subgraph External["External Services"]
        FirebaseService["Firebase<br/>Authentication"]
        VertexAIService["Vertex AI<br/>Image Gen"]
        AsyncStorageService["AsyncStorage<br/>Persistence"]
    end
    
    IndexScreen --> AuthLib
    IndexScreen --> AuthStore
    StudioScreen --> APILib
    StudioScreen --> AuthStore
    GenerateScreen --> APILib
    GenerateScreen --> AuthStore
    VaultScreen --> AuthStore
    ProfileScreen --> AuthStore
    ProfileScreen --> PrefsStore
    
    AuthLib --> FirebaseLib
    AuthLib --> AuthStore
    APILib --> AuthStore
    
    AuthStore --> StorageLib
    PrefsStore --> StorageLib
    StorageLib --> AsyncStorageService
    
    FirebaseLib --> FirebaseService
    APILib --> VertexAIService
    
    style UI fill:#E3F2FD
    style Logic fill:#F3E5F5
    style State fill:#FCE4EC
    style External fill:#E8F5E9
```

---

## Network Request Sequence

```mermaid
sequenceDiagram
    participant User as User
    participant App as Mobile App
    participant Backend as Express API
    participant Firebase as Firebase
    participant VertexAI as Vertex AI
    
    Note over User,VertexAI: Authentication Flow
    
    User->>App: Tap "Sign in with Google"
    App->>Firebase: Initiate OAuth
    App->>Firebase: Get ID Token
    Firebase-->>App: ID Token
    App->>Backend: POST /api/exchange-token {idToken}
    Backend->>Firebase: Verify Token
    Firebase-->>Backend: Token Valid ✓
    Backend-->>App: Firebase Auth Token
    App->>App: Save to Zustand + AsyncStorage
    Note over App: User Authenticated
    
    Note over User,VertexAI: Generation Flow
    
    User->>App: Select photos & click Generate
    App->>App: Convert images to base64
    App->>Backend: POST /api/generate-look {userImg, fitImg}
    Backend->>Backend: Validate images
    Backend->>Backend: Check user quota
    Backend->>VertexAI: Process images
    VertexAI->>VertexAI: ML Model runs
    Note over VertexAI: ~30-120 seconds
    VertexAI-->>Backend: Generated image
    Backend->>Firebase: Update quota
    Firebase-->>Backend: Quota updated
    Backend-->>App: {success: true, image: base64}
    App->>App: Display result
    App->>App: Decrement local quota
    App->>App: Update AsyncStorage
    
    Note over App: User can Save or Retry
    
    User->>App: Tap "Save to Vault"
    App->>App: Create SavedLook
    App->>App: Add to Zustand + AsyncStorage
    Note over App: Saved Locally
```

---

## Error Handling Flow

```mermaid
graph TD
    Start["API Request Sent"]
    
    Start -->|Timeout?| CheckTimeout{"After<br/>120s?"}
    CheckTimeout -->|Yes| TimeoutError["Timeout Error"]
    CheckTimeout -->|No| Waiting["Waiting for<br/>Response"]
    
    Waiting -->|Response| CheckStatus{"HTTP<br/>Success?"}
    CheckStatus -->|No| HTTPError["HTTP Error<br/>Status"]
    CheckStatus -->|Yes| ValidJSON{"Valid<br/>JSON?"}
    
    ValidJSON -->|No| ParseError["Parse Error"]
    ValidJSON -->|Yes| CheckSuccess{"Generation<br/>Success?"}
    
    CheckSuccess -->|No| APIError["API Error<br/>from Backend"]
    CheckSuccess -->|Yes| Success["✅ Success"]
    
    TimeoutError -->|Show User| UserNotif["Display Error<br/>Message"]
    HTTPError -->|Show User| UserNotif
    ParseError -->|Show User| UserNotif
    APIError -->|Show User| UserNotif
    Success -->|Show User| DisplayResult["Display Generated<br/>Image"]
    
    UserNotif -->|User Taps Retry| Start
    UserNotif -->|User Cancels| Back["Return to Studio"]
    
    style Success fill:#C8E6C9
    style TimeoutError fill:#FFCDD2
    style HTTPError fill:#FFCDD2
    style ParseError fill:#FFCDD2
    style APIError fill:#FFCDD2
    style DisplayResult fill:#C8E6C9
```

---

## Permission Flow

```mermaid
graph TD
    Start["App Starts"]
    
    Start -->|First Launch?| CheckPerms{"Permissions<br/>Requested?"}
    
    CheckPerms -->|Yes| ShowPerms["Show Permission<br/>Dialog"]
    CheckPerms -->|No| ContinueApp["Continue to App"]
    
    ShowPerms -->|User Grants| GrantPerms["Grant<br/>- Camera<br/>- Photo Library<br/>- Notifications"]
    ShowPerms -->|User Denies| DenyPerms["Deny<br/>Limited Features"]
    
    GrantPerms -->|Full Access| FullFeatures["Full App<br/>Features"]
    DenyPerms -->|Partial Access| PartialFeatures["Limited<br/>Features"]
    
    FullFeatures -->|User Picks Image| CameraAccess["Use Camera/<br/>Gallery"]
    PartialFeatures -->|User Picks Image| NoAccess["❌ Permission<br/>Required"]
    NoAccess -->|User Taps Settings| OpenSettings["Open Device<br/>Settings"]
    OpenSettings -->|Grant Permission| GrantPerms
    
    CameraAccess -->|Select Image| SelectedImage["Image Selected"]
    SelectedImage -->|Process| ContinueApp
    
    style GrantPerms fill:#C8E6C9
    style FullFeatures fill:#A5D6A7
    style NoAccess fill:#FFCDD2
    style DenyPerms fill:#FFF9C4
```

---

## State Management Diagram

```mermaid
graph TD
    AppStart["App Starts"]
    
    AppStart -->|Load from Device| AsyncStorage["AsyncStorage<br/>- zyora:user<br/>- zyora:saved_looks<br/>- zyora:dev_mode"]
    
    AsyncStorage -->|Populate| ZustandInit["Zustand Initialization"]
    
    ZustandInit -->|AuthStore| AuthState["AuthState<br/>- user<br/>- isLoading<br/>- isDevMode<br/>- userImg<br/>- fitImg<br/>- savedLooks<br/>- quota"]
    
    ZustandInit -->|PreferencesStore| PrefsState["PreferencesState<br/>- theme<br/>- notifications<br/>- language"]
    
    AuthState -->|User Interaction| UpdateAuth["Update State<br/>- setUser()<br/>- setLoading()<br/>- addSavedLook()"]
    PrefsState -->|User Interaction| UpdatePrefs["Update State<br/>- setTheme()<br/>- setNotifications()"]
    
    UpdateAuth -->|Persist| SaveStorage["Save to<br/>AsyncStorage"]
    UpdatePrefs -->|Persist| SaveStorage
    
    SaveStorage -->|App Closed| RestoreNext["On App Restart<br/>Restore from<br/>AsyncStorage"]
    
    UpdateAuth -->|Render| UIUpdate["UI Re-renders<br/>with new state"]
    UpdatePrefs -->|Render| UIUpdate
    
    style AsyncStorage fill:#E0F2F1
    style AuthState fill:#FCE4EC
    style PrefsState fill:#F3E5F5
    style UIUpdate fill:#E3F2FD
```

---

## Platform Support Matrix

```mermaid
graph LR
    subgraph Platforms["Supported Platforms"]
        iOS["🍎 iOS<br/>13+"]
        Android["🤖 Android<br/>API 21+"]
        Web["🌐 Web<br/>Chrome/Firefox"]
    end
    
    subgraph Features["Core Features"]
        Auth["Authentication<br/>✅ All"]
        Photos["Photo Upload<br/>✅ All"]
        Generate["Image Generation<br/>✅ All"]
        Vault["Save & Manage<br/>✅ All"]
        Notifications["Notifications<br/>⚠️ iOS/Android"]
        LocalStorage["Local Storage<br/>✅ All"]
    end
    
    Platforms -->|Supports| Features
    
    style iOS fill:#F5F5F5
    style Android fill:#F5F5F5
    style Web fill:#F5F5F5
    style Auth fill:#C8E6C9
    style Photos fill:#C8E6C9
    style Generate fill:#C8E6C9
    style Vault fill:#C8E6C9
    style Notifications fill:#FFF9C4
    style LocalStorage fill:#C8E6C9
```

