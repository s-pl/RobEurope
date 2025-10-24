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
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ POSTS : writes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ MEDIA : uploads
    USERS ||--o{ AUDIT_LOG : actor
    USERS }o--o{ TEAM_MEMBERS : member_of
    USERS }o--o{ COMPETITION_REGISTRATIONS : registers

    ROLES ||--o{ USERS : assigns

    TEAMS ||--o{ TEAM_MEMBERS : has
    TEAMS }o--o{ COMPETITION_REGISTRATIONS : participates

    COMPETITIONS ||--o{ COMPETITION_MEDIA : has
    COMPETITIONS }o--o{ COMPETITION_REGISTRATIONS : contains
    COMPETITIONS ||--o{ STREAMS : hosts

    MEDIA ||--o{ COMPETITION_MEDIA : linked_to

    POSTS ||--o{ POST_COMMENTS : has

    USERS {
        uuid id PK
        string email
        string passwordHash
        boolean isActive
        datetime createdAt
        uuid roleId FK
    }

    ROLES {
        uuid id PK
        string name
        string description
    }

    TEAMS {
        uuid id PK
        string name
        string description
        boolean isPublic
        uuid createdBy FK
    }

    TEAM_MEMBERS {
        uuid id PK
        uuid teamId FK
        uuid userId FK
        string roleInTeam
    }

    COMPETITIONS {
        uuid id PK
        string slug
        string title
        string description
        datetime startAt
        datetime endAt
        string location
        string status
        uuid createdBy FK
    }

    COMPETITION_REGISTRATIONS {
        uuid id PK
        uuid competitionId FK
        uuid teamId FK
        uuid userId FK
        string status
    }

    COMPETITION_MEDIA {
        uuid id PK
        uuid competitionId FK
        uuid mediaId FK
        string mediaKind
    }

    MEDIA {
        uuid id PK
        string filename
        string url
        string contentType
        bigint sizeBytes
    }

    POSTS {
        uuid id PK
        string title
        string slug
        text content
        uuid authorId FK
    }

    POST_COMMENTS {
        uuid id PK
        uuid postId FK
        uuid userId FK
        text content
    }

    STREAMS {
        uuid id PK
        uuid competitionId FK
        string title
        string publicUrl
    }

    NOTIFICATIONS {
        uuid id PK
        uuid userId FK
        string title
        string body
        boolean isRead
    }

    AUDIT_LOG {
        uuid id PK
        uuid actorUserId FK
        string actionType
        string targetType
        string details
    }
```
## Use case diagram
![Use Case Diagram](https://github.com/s-pl/RobEurope/blob/develop/img/usecase.png?raw=true)

