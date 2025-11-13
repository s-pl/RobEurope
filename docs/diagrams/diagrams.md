# System Diagrams

## Use Case Diagram

```mermaid
graph TD
    A[User] --> B[Register]
    A --> C[Login]
    A --> D[View Posts]
    A --> E[Create Post]
    A --> F[Update Own Post]
    A --> G[Delete Own Post]
    A --> H[View Teams]
    A --> I[Create Team]
    A --> J[Update Own Team]
    A --> K[Delete Own Team]
    A --> L[Upload Media]
    A --> M[View Media]
    A --> N[Delete Own Media]
    A --> O[View Competitions]
    A --> P[Register for Competition]
    A --> Q[View Notifications]

    Admin[Super Admin] --> R[Manage Sponsors]
    Admin --> S[Manage All Users]
    Admin --> T[Manage All Teams]
    Admin --> U[Manage All Posts]
    Admin --> V[Manage All Media]
    Admin --> W[Manage Competitions]
    Admin --> X[View System Logs]
    Admin --> Y[View System Statistics]
    Admin --> Z[Clean System Logs]
```
## Class Diagram
![Class Diagram](https://github.com/s-pl/RobEurope/blob/develop/img/class.png?raw=true)

## Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Post : "author"
    User ||--o{ Team : "created_by"
    User ||--o{ TeamMembers : "member"
    User ||--o{ Notification : "recipient"
    User ||--o{ SystemLog : "performer"

    Country ||--o{ Team : "belongs_to"
    Country ||--o{ Competition : "hosted_in"

    Competition ||--o{ Registration : "has"

    Team ||--o{ Registration : "participates_in"
    Team ||--o{ TeamMembers : "has_members"

    SystemLog {
        string id PK
        string user_id FK
        string action
        string entity_type
        string entity_id
        json old_values
        json new_values
        string ip_address
        text user_agent
        datetime created_at
    }

    User {
        string id PK
        string first_name
        string last_name
        string username UK
        string email UK
        string password_hash
        string phone
        string profile_photo_url
        enum role
        boolean is_active
        datetime created_at
    }

    Country {
        integer id PK
        string name
        string code
        string flag_emoji
    }

    Competition {
        integer id PK
        string title
        string slug
        string description
        integer country_id FK
        datetime registration_start
        datetime registration_end
        datetime start_date
        datetime end_date
        string rules_url
        json stream_url
    }

    Team {
        integer id PK
        string name
        integer country_id FK
        string city
        string institution
        string logo_url
        json social_links
        string created_by_user_id FK
        datetime created_at
        datetime updated_at
    }

    TeamMembers {
        integer id PK
        integer team_id FK
        string user_id FK
        string role
        datetime joined_at
        datetime left_at
    }

    Registration {
        integer id PK
        integer team_id FK
        integer competition_id FK
        enum status
        datetime registration_date
    }

    Post {
        integer id PK
        string title
        text content
        string author_id FK
        json media_urls
        integer likes_count
        integer views_count
        datetime created_at
        datetime updated_at
    }

    Sponsor {
        integer id PK
        string name
        string logo_url
        string website_url
        datetime created_at
        datetime updated_at
    }

    Notification {
        string id PK
        string user_id FK
        string title
        string message
        enum type
        boolean is_read
        datetime created_at
    }
```

## Architecture Diagram

```mermaid
graph TB
    Client[Frontend React/Vite] --> API[Backend Express.js]
    API --> Auth[Authentication Middleware]
    API --> Routes[API Routes]
    Routes --> Controllers[Controllers]
    Controllers --> Models[Sequelize Models]
    Models --> DB[(MySQL Database)]
    API --> Multer[File Upload Multer]
    Multer --> Storage[Local Storage /uploads]
    Controllers --> Logger[System Logger]
    Logger --> DB
```



## Sequence Diagrams

### User Login Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant L as Logger

    U->>F: Enter credentials
    F->>B: POST /auth/login
    B->>B: Validate input
    B->>DB: Verify user credentials
    DB-->>B: User data
    B->>B: Generate JWT token
    B->>L: Log LOGIN action
    L->>DB: Insert system log
    B-->>F: JWT Token + User data
    F-->>U: Redirect to dashboard
```

### File Upload Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant FS as File System
    participant DB as Database
    participant L as Logger

    U->>F: Select file
    F->>B: POST /api/media/upload (multipart)
    B->>B: Validate file type/size
    B->>FS: Save file to disk
    FS-->>B: File path
    B->>DB: Insert Media record
    DB-->>B: Media ID
    B->>L: Log UPLOAD action
    L->>DB: Insert system log
    B-->>F: Media URL
    F-->>U: Display uploaded media
```

### Team Creation Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant L as Logger

    U->>F: Fill team form
    F->>B: POST /api/teams
    B->>B: Validate permissions
    B->>DB: Insert team record
    DB-->>B: Team ID
    B->>DB: Add creator as member
    B->>L: Log CREATE_TEAM action
    L->>DB: Insert system log
    B-->>F: Team data
    F-->>U: Show success message
```

## Component Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        React[React Components]
        Router[React Router]
        Axios[HTTP Client]
        State[State Management]
    end

    subgraph "Backend Layer"
        Express[Express Server]
        Auth[JWT Auth Middleware]
        Upload[Multer Upload]
        Validation[Input Validation]
    end

    subgraph "Business Logic Layer"
        Controllers[Request Controllers]
        Services[Business Services]
        Logger[System Logger]
    end

    subgraph "Data Layer"
        Models[Sequelize Models]
        Migrations[DB Migrations]
        Seeders[DB Seeders]
    end

    subgraph "Infrastructure"
        MySQL[(MySQL Database)]
        FileStorage[(File System)]
        Logs[(Log Files)]
    end

    React --> Axios
    Axios --> Express
    Express --> Auth
    Express --> Upload
    Express --> Validation
    Auth --> Controllers
    Upload --> Controllers
    Validation --> Controllers
    Controllers --> Services
    Services --> Logger
    Services --> Models
    Models --> Migrations
    Models --> MySQL
    Logger --> Logs
    Upload --> FileStorage
```


## Data Flow Diagram

```mermaid
graph TD
    A[User Request] --> B{Authentication}
    B -->|Valid| C[Route Handler]
    B -->|Invalid| D[401 Unauthorized]

    C --> E{Authorization}
    E -->|Allowed| F[Controller]
    E -->|Denied| G[403 Forbidden]

    F --> H{Input Validation}
    H -->|Valid| I[Business Logic]
    H -->|Invalid| J[400 Bad Request]

    I --> K[Database Query]
    I --> L[File Operation]
    I --> M[System Log]

    K --> N[(Database)]
    L --> O[(File System)]
    M --> P[(Log Database)]

    N --> Q[Response Data]
    O --> Q
    P --> Q

    Q --> R{Response Formatting}
    R --> S[JSON Response]
    S --> T[200 OK]

    J --> U[Error Response]
    D --> U
    G --> U
    U --> V[Error JSON]
```
