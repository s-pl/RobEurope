
# RobEurope
Redesign of robeurope.com by Samuel Ponce Luna, Ángel Lallave Herrera, and Néstor García Santos from IES El Rincón.

# Stack
- Frontend: React  
- Backend: Node.js + Sequelize  
- Database: MySQL  


---

## 📘 Diagrama Entidad-Relación (ERD)

```mermaid
---
config:
  layout: elk
---
erDiagram
    USERS {
        BIGINT id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email
        VARCHAR password_hash
        VARCHAR profile_photo_url
        BOOLEAN is_admin
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    TEAMS {
        BIGINT id PK
        VARCHAR name
        VARCHAR logo_url
        TEXT description
        BIGINT created_by_user_id FK
        TIMESTAMP created_at
    }
    TEAM_MEMBERS {
        BIGINT id PK
        BIGINT team_id FK
        BIGINT user_id FK
        BOOLEAN is_captain
        TIMESTAMP joined_at
    }
    COMPETITIONS {
        BIGINT id PK
        VARCHAR title
        TEXT description
        VARCHAR location
        DATETIME start_date
        DATETIME end_date
        ENUM status
        TIMESTAMP created_at
    }
    COMPETITION_TEAMS {
        BIGINT competition_id FK
        BIGINT team_id FK
        ENUM status
        TIMESTAMP requested_at
        TIMESTAMP approved_at
    }
    ROLES {
        BIGINT id PK
        VARCHAR name
        VARCHAR description
    }
    TEAM_MEMBER_ROLES {
        BIGINT id PK
        BIGINT team_member_id FK
        BIGINT role_id FK
        TIMESTAMP assigned_at
    }
    PLATFORMS {
        BIGINT id PK
        VARCHAR name
        VARCHAR url_template
        TIMESTAMP created_at
    }
    TEAM_STREAMS {
        BIGINT id PK
        BIGINT team_id FK
        BIGINT competition_id FK
        BIGINT platform_id FK
        VARCHAR stream_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    CHAT_MESSAGES {
        BIGINT id PK
        BIGINT competition_id FK
        BIGINT user_id FK
        BIGINT team_id FK
        BIGINT parent_message_id FK
        TEXT content
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    CHAT_LIKES {
        BIGINT message_id FK
        BIGINT user_id FK
        TIMESTAMP created_at
    }
    FILES {
        BIGINT id PK
        BIGINT uploader_id FK
        VARCHAR file_name
        VARCHAR file_path
        VARCHAR mime_type
        BIGINT size_bytes
        TIMESTAMP uploaded_at
    }
    GALLERY {
        BIGINT id PK
        BIGINT competition_id FK
        VARCHAR title
        BIGINT file_id FK
        BIGINT uploaded_by FK
        TIMESTAMP created_at
    }
    POSTS {
        BIGINT id PK
        BIGINT admin_id FK
        VARCHAR title
        VARCHAR description
        TEXT content
        VARCHAR image_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    SYSTEM_LOGS {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR action
        VARCHAR entity_type
        BIGINT entity_id
        TEXT details
        TIMESTAMP timestamp
    }
    USERS ||--o{ TEAM_MEMBERS : "belongs to"
    USERS ||--o{ CHAT_MESSAGES : "sends"
    USERS ||--o{ CHAT_LIKES : "likes"
    USERS ||--o{ FILES : "uploads"
    USERS ||--o{ POSTS : "creates "
    USERS ||--o{ TEAMS : "creates"
    TEAMS ||--o{ TEAM_MEMBERS : "contains"
    TEAMS ||--o{ COMPETITION_TEAMS : "participates"
    TEAMS ||--o{ TEAM_STREAMS : "has"
    TEAM_MEMBERS ||--o{ TEAM_MEMBER_ROLES : "has role"
    ROLES ||--o{ TEAM_MEMBER_ROLES : "applies to"
    COMPETITIONS ||--o{ COMPETITION_TEAMS : "has teams"
    COMPETITIONS ||--o{ TEAM_STREAMS : "has streams"
    COMPETITIONS ||--o{ CHAT_MESSAGES : "has chat"
    COMPETITIONS ||--o{ GALLERY : "has images"
    CHAT_MESSAGES ||--o{ CHAT_LIKES : "receives likes"
    CHAT_MESSAGES ||--o{ CHAT_MESSAGES : "replies"
    FILES ||--o{ GALLERY : "used in"
    PLATFORMS ||--o{ TEAM_STREAMS : "supports streams"

```
## Use case diagram
![Use Case Diagram](https://github.com/s-pl/RobEurope/blob/develop/img/usecase.png?raw=true)


