
# RobEurope
Redesign of robeurope.com by Samuel Ponce Luna, Ángel Lallave Herrera, and Néstor García Santos from IES El Rincón.

# Stack
- Frontend: React  
- Backend: Node.js + Sequelize  
- Database: MySQL  


---

## 📘 Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    USERS {
        BIGINT id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email
        VARCHAR password_hash
        VARCHAR phone
        VARCHAR profile_photo_url
        BIGINT country_id FK
        ENUM role "super_admin, user"
        BOOLEAN is_active
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    COUNTRIES {
        BIGINT id PK
        VARCHAR code "ISO alpha-2"
        VARCHAR name
        VARCHAR flag_emoji
    }

    TEAMS {
        BIGINT id PK
        VARCHAR name
        VARCHAR short_code "MIT, UCSD"
        BIGINT country_id FK
        VARCHAR city
        VARCHAR institution
        VARCHAR logo_url
        TEXT description
        VARCHAR contact_email
        VARCHAR website_url
        BIGINT created_by_user_id FK
        BOOLEAN is_active
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    TEAM_MEMBERS {
        BIGINT id PK
        BIGINT team_id FK
        BIGINT user_id FK
        ENUM role "captain, member, mentor"
        BOOLEAN is_active
        TIMESTAMP joined_at
        TIMESTAMP left_at
    }

    COMPETITIONS {
        BIGINT id PK
        VARCHAR title
        VARCHAR slug
        TEXT description
        VARCHAR location
        BIGINT country_id FK
        DATETIME registration_start
        DATETIME registration_end
        DATETIME start_date
        DATETIME end_date
        ENUM status "draft, open, closed, in_progress, completed, cancelled"
        VARCHAR banner_url
        TEXT rules_url
        INTEGER max_teams
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    REGISTRATIONS {
        BIGINT id PK
        BIGINT competition_id FK
        BIGINT team_id FK
        ENUM status "pending, approved, rejected, disqualified"
        JSON technical_details
        INTEGER final_rank
        DECIMAL final_score
        JSON awards
        TEXT admin_notes
        TIMESTAMP requested_at
        TIMESTAMP reviewed_at
        BIGINT reviewed_by_user_id FK
    }

    STREAMS {
        BIGINT id PK
        VARCHAR title
        TEXT description
        VARCHAR platform "twitch, youtube, kick"
        VARCHAR stream_url
        BOOLEAN is_live
        TIMESTAMP created_at
    }

    STREAM_TEAMS {
        BIGINT id PK
        BIGINT stream_id FK
        BIGINT team_id FK
        BOOLEAN is_host
        TIMESTAMP created_at
    }

    STREAM_COMPETITIONS {
        BIGINT id PK
        BIGINT stream_id FK
        BIGINT competition_id FK
        BOOLEAN is_official
        TIMESTAMP created_at
    }

    TEAM_SOCIALS {
        BIGINT id PK
        BIGINT team_id FK
        VARCHAR platform "twitter, instagram, discord, github"
        VARCHAR url
        TIMESTAMP created_at
    }

    GLOBAL_POSTS {
        BIGINT id PK
        BIGINT author_user_id FK
        VARCHAR title
        VARCHAR slug
        TEXT content
        VARCHAR cover_image_url
        ENUM status "draft, published"
        BOOLEAN is_pinned
        INTEGER views_count
        TIMESTAMP published_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    COMPETITION_POSTS {
        BIGINT id PK
        BIGINT competition_id FK
        BIGINT team_id FK
        BIGINT author_user_id FK
        VARCHAR title
        TEXT content
        JSON media_urls
        INTEGER likes_count
        BOOLEAN is_featured
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    POST_LIKES {
        BIGINT post_id FK
        BIGINT user_id FK
        ENUM post_type "global, competition"
        TIMESTAMP created_at
    }

    CHAT_MESSAGES {
        BIGINT id PK
        BIGINT competition_id FK
        BIGINT user_id FK
        BIGINT parent_id FK
        TEXT content
        BOOLEAN is_pinned
        BOOLEAN is_deleted
        TIMESTAMP created_at
    }

    CHAT_REACTIONS {
        BIGINT message_id FK
        BIGINT user_id FK
        VARCHAR emoji
        TIMESTAMP created_at
    }

    MEDIA {
        BIGINT id PK
        BIGINT competition_id FK
        BIGINT team_id FK
        BIGINT uploaded_by_user_id FK
        ENUM type "photo, video"
        VARCHAR title
        VARCHAR file_path
        VARCHAR thumbnail_path
        BOOLEAN is_featured
        TIMESTAMP uploaded_at
    }

    SPONSORS {
        BIGINT id PK
        VARCHAR name
        VARCHAR logo_url
        VARCHAR website_url
        ENUM tier "platinum, gold, silver, bronze"
        INTEGER display_order
        BOOLEAN is_active
    }

    SPONSOR_COMPETITIONS {
        BIGINT id PK
        BIGINT sponsor_id FK
        BIGINT competition_id FK
    }

    NOTIFICATIONS {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR title
        TEXT message
        ENUM type "registration, score, team_invite, mention"
        VARCHAR action_url
        BOOLEAN is_read
        TIMESTAMP created_at
    }

    %% Relaciones
    USERS }o--|| COUNTRIES : "from"
    USERS ||--o{ TEAM_MEMBERS : "joins"
    USERS ||--o{ TEAMS : "creates"
    USERS ||--o{ GLOBAL_POSTS : "writes"
    USERS ||--o{ COMPETITION_POSTS : "writes"
    USERS ||--o{ CHAT_MESSAGES : "sends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ POST_LIKES : "likes"
    USERS ||--o{ CHAT_REACTIONS : "reacts"

    COUNTRIES ||--o{ TEAMS : "represents"
    COUNTRIES ||--o{ COMPETITIONS : "hosts"

    TEAMS ||--o{ TEAM_MEMBERS : "has"
    TEAMS ||--o{ REGISTRATIONS : "registers"
    TEAMS ||--o{ TEAM_SOCIALS : "links"
    TEAMS ||--o{ COMPETITION_POSTS : "posts"
    TEAMS ||--o{ STREAM_TEAMS : "streams"
    TEAMS ||--o{ MEDIA : "uploads"

    COMPETITIONS ||--o{ REGISTRATIONS : "entries"
    COMPETITIONS ||--o{ COMPETITION_POSTS : "content"
    COMPETITIONS ||--o{ CHAT_MESSAGES : "chat"
    COMPETITIONS ||--o{ STREAM_COMPETITIONS : "streams"
    COMPETITIONS ||--o{ MEDIA : "gallery"
    COMPETITIONS ||--o{ SPONSOR_COMPETITIONS : "sponsored_by"

    REGISTRATIONS }o--|| USERS : "reviewed_by"

    STREAMS ||--o{ STREAM_TEAMS : "features"
    STREAMS ||--o{ STREAM_COMPETITIONS : "covers"

    CHAT_MESSAGES ||--o{ CHAT_REACTIONS : "reactions"
    CHAT_MESSAGES ||--o{ CHAT_MESSAGES : "replies"

    MEDIA }o--|| USERS : "uploaded_by"

    SPONSORS ||--o{ SPONSOR_COMPETITIONS : "supports"


```
## Use case diagram
![Use Case Diagram](https://github.com/s-pl/RobEurope/blob/develop/img/usecase.png?raw=true)


