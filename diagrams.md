# RobEurope Project Diagrams

This document contains various diagrams for the RobEurope project, including Use Case Diagrams, Entity-Relationship Diagrams (ERD), and other relevant diagrams.

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

    Admin[Super Admin] --> O[Manage Sponsors]
    Admin --> P[Manage All Users]
    Admin --> Q[Manage All Teams]
    Admin --> R[Manage All Posts]
    Admin --> S[Manage All Media]
```

## Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Post : "author"
    User ||--o{ Team : "created_by"
    User ||--o{ TeamMembers : "member"
    User ||--o{ Media : "uploaded_by"
    User ||--o{ Notification : "recipient"

    Country ||--o{ Team : "belongs_to"
    Country ||--o{ Competition : "hosted_in"

    Competition ||--o{ Registration : "has"

    Team ||--o{ Registration : "participates_in"
    Team ||--o{ TeamMembers : "has_members"

    Post ||--o{ Media : "has_media"

    Team ||--o{ Media : "has_media"

    Sponsor ||--o{ Media : "has_media"

    Media {
        string id PK
        string media_type
        string media_id
        string filename
        string path
        string url
        string mime_type
        integer size
        string uploaded_by FK
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
```

## Sequence Diagram for User Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Enter credentials
    F->>B: POST /auth/login
    B->>DB: Verify user
    DB-->>B: User data
    B-->>F: JWT Token
    F-->>U: Redirect to dashboard
```

## Sequence Diagram for File Upload

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant FS as File System
    participant DB as Database

    U->>F: Select file
    F->>B: POST /api/media/upload (multipart)
    B->>FS: Save file
    FS-->>B: File path
    B->>DB: Insert Media record
    DB-->>B: Success
    B-->>F: Media URL
    F-->>U: Display uploaded media
```