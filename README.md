
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
        VARCHAR short_code 
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
        BIGINT host_team_id FK  "opcional"
        BIGINT competition_id FK "opcional"
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
        BIGINT author_user_id FK "solo super_admin"
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
        BIGINT team_id FK "opcional"
        BIGINT author_user_id FK
        VARCHAR title
        TEXT content
        JSON media_urls
        INTEGER likes_count
        BOOLEAN is_featured
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CHAT_MESSAGES {
        BIGINT id PK
        BIGINT competition_id FK "opcional"
        BIGINT user_id FK
        BIGINT parent_id FK "opcional"
        TEXT content
        BOOLEAN is_pinned
        BOOLEAN is_deleted
        TIMESTAMP created_at
    }

    MEDIA {
        BIGINT id PK
        BIGINT uploaded_by_user_id FK
        ENUM object_type "competition,team,global_post,competition_post,user"
        BIGINT object_id
        ENUM type "photo, video, other"
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
        TIMESTAMP created_at
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

    REACTIONS {
        BIGINT id PK
        BIGINT user_id FK
        ENUM target_type "global_post, competition_post, chat_message"
        BIGINT global_post_id FK "nullable"
        BIGINT competition_post_id FK "nullable"
        BIGINT chat_message_id FK "nullable"
        VARCHAR emoji "❤️ 👍 🔥 😂 etc."
        TIMESTAMP created_at
    }

    %% Relaciones (actualizadas)
    USERS }o--|| COUNTRIES : "from"
    USERS ||--o{ TEAM_MEMBERS : "joins"
    USERS ||--o{ TEAMS : "creates"
    USERS ||--o{ GLOBAL_POSTS : "writes (super_admin only)"
    USERS ||--o{ COMPETITION_POSTS : "writes"
    USERS ||--o{ CHAT_MESSAGES : "sends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ REACTIONS : "reacts"
    USERS ||--o{ MEDIA : "uploads"

    COUNTRIES ||--o{ TEAMS : "represents"
    COUNTRIES ||--o{ COMPETITIONS : "hosts"

    TEAMS ||--o{ TEAM_MEMBERS : "has"
    TEAMS ||--o{ REGISTRATIONS : "registers"
    TEAMS ||--o{ TEAM_SOCIALS : "links"
    TEAMS ||--o{ COMPETITION_POSTS : "posts"
    TEAMS ||--o{ MEDIA : "uploads"
    TEAMS ||--o{ STREAMS : "hosts"

    COMPETITIONS ||--o{ REGISTRATIONS : "entries"
    COMPETITIONS ||--o{ COMPETITION_POSTS : "content"
    COMPETITIONS ||--o{ CHAT_MESSAGES : "chat"
    COMPETITIONS ||--o{ MEDIA : "gallery"
    COMPETITIONS ||--o{ STREAMS : "has_stream"

    REGISTRATIONS }o--|| USERS : "reviewed_by"

    CHAT_MESSAGES ||--o{ CHAT_MESSAGES : "replies"

    %% Relaciones de REACTIONS
    GLOBAL_POSTS ||--o{ REACTIONS : "receives"
    COMPETITION_POSTS ||--o{ REACTIONS : "receives"
    CHAT_MESSAGES ||--o{ REACTIONS : "receives"



```
## Use case diagram
![Use Case Diagram](https://www.plantuml.com/plantuml/png/VLV1ajis3BthApYRWxtJfisbCptq4DT9qypiTZoxsVROWINOHbSY7P9AchJzc7n0JhdrwXyhI0fhIbnrFRCZFJo004W2q7FdmVg-Qwk5UlhqgLeRlQDzRw6cqnUj6bGldQVM167bxaaVmKAdeFR6tleFBIfuZyvqc0bxXsjmgFwg5F_z2FNztffUDslJ6gj-Ev37936sGPlG9zyz2x-8hwmrxyVmFvbvYxK7lMzbWHapnS9FVle-_4QsjF5YfgJptyjdvHBhP-77PeQKlJbzzlsG8K-U_Nf1i6Vh4DB7cJ0kFDmvfgXD2nvsnWv2qntHKqr6enDxBt17cXxolmgfHXVDnxIhNycH1-rnUB-uSprOCke6z-IyXSPSA72y8bgXhE58_lGfxUZRdew9mh07qWFh6hKt3ogt_H6jMZKTwS1DJ-BapsXHrmGJ3rbwfrNfZs9nhy-UgzferPq-ESLhTEICgywo7_xc1OBpoPgu_lNWd_gGN56ERNWwIdgdQrR1H3GcOMP8CfK1UNJZJLljRNzaU-nhoD7fIoExNPsFuWMxtqDB7uUBipdzkssfXelXTFKEQt21XtQyxMchrh-p8E0bEsrNpXkGahgo_lIvPlUSUjMQBRGZyoobA2mLRxr5w7BoW9JK3NXhQjAS4JiodmHyB_Aql4BdvIIlUzGUN94IsJBhKCmb2EsO-3fS2s1lqGMRGhuoUz8PKvOrchaTgGtQ7RN2JczbNByOJpkgeTYLA9WFI_Qd26jj4MJtn5p0UFl6n3jDrg622JV1K_9g2xenkh0iE5kVIyLhlJFiS3lH38HvfMl2RckDozc2pUdSO8DEtPgQv0IAPiBcapcv6ZCdfGYUyMa4cpxUFniwcaTDZL7Bf7GfMXip7xXSYK8fmODQ_BSubulUXGGFvIbqc4c5By_7j-S5XPeVxSWfoyBgQCsMbM-mFi17i5Brnjl4u2JJhxL72tLSOjYV8iSlzJk2s0iS_84AjLeVm8lTy3pT4pQO8W3H4dQGJUWlcBUuHlMgTnuMQdb5z_YGtF0ofj_sMmfrhJxGE-FKyXeRWWT-b4Pe4cZS0N9UvfXK3INMShUbVOpo5vh3x1b_Oq97Q8sJ-vzhhjfs_c3D56dH3QToikgrQT3cHrduB0ZOp4epfJh8a-J_Z_xZxWsoy_Z33k2VyNZdim2CUoWJcP_r_-Mghf45nzGdpUMv_pCvxuSbBlsl5EKzhXHAJoj5qhmAYVIXYK1wJhLuRDPPXk6eWH3xMUshopHi17LfGeBaZKQmh5i8b3S5mQQbNs2vgl8kbr40kMtoFhbD75WvCUQ1ITWSrZ1S9IFIJKfGcaOXagum4N122piRKnZFAdAra0dnKKTPl79zHvrnwcsFOHxj4ltO8pEFqZ5GAstOLupD4cFiLR8yzeCjPaFopAf9ndfvESzHgTKJJEgFeAFQKg31ep5NQeDWawi_WULUowtcinX7_jYve1sc-_YvP6b_yChiqeYkr1MeWtmDB7TjQ4bnfBvacQEzZbDLp3YswSEH1QHtQEaXzmUeqIfl6iEorepOoeKSKr3BsTzKg1iLFAggv_pOT-r_)


# 📘 Diagrama de Clases – System RobEurope

```mermaid
classDiagram
    direction LR

    %% ==== Clases principales ====
    class Usuario {
        +id: bigint
        +nombre: string
        +apellido: string
        +email: string
        +passwordHash: string
        +telefono: string
        +fotoPerfil: string
        +pais: Pais
        +rol: Rol
        +registrarse()
        +iniciarSesion()
        +subirMedia()
        +comentarPost()
        +recibirNotificacion()
    }

    class Rol {
        <<enumeration>>
        super_admin
        user
        juez
        invitado
    }

    class Pais {
        +id: bigint
        +codigo: string
        +nombre: string
        +bandera: string
    }

    class Equipo {
        +id: bigint
        +nombre: string
        +codigoCorto: string
        +ciudad: string
        +institucion: string
        +descripcion: string
        +activo: bool
        +crearEquipo()
        +unirse()
        +salir()
    }

    class MiembroEquipo {
        +id: bigint
        +rol: string
        +activo: bool
        +fechaIngreso: datetime
    }

    class Competicion {
        +id: bigint
        +titulo: string
        +descripcion: string
        +ubicacion: string
        +estado: EstadoCompeticion
        +fechaInicio: datetime
        +fechaFin: datetime
        +maxEquipos: int
        +abrirRegistro()
        +cerrarRegistro()
        +publicarResultados()
    }

    class EstadoCompeticion {
        <<enumeration>>
        draft
        open
        in_progress
        completed
        cancelled
    }

    class Registro {
        +id: bigint
        +estado: EstadoRegistro
        +solicitadoEn: datetime
        +revisadoEn: datetime
    }

    class EstadoRegistro {
        <<enumeration>>
        pending
        approved
        rejected
        disqualified
    }

    class Post {
        <<abstract>>
        +id: bigint
        +titulo: string
        +contenido: text
        +autor: Usuario
        +fechaPublicacion: datetime
        +publicar()
    }

    class PostGlobal {
        +destacado: bool
    }

    class PostCompeticion {
        +likes: int
        +destacado: bool
    }

    class Media {
        +id: bigint
        +tipo: string
        +titulo: string
        +rutaArchivo: string
        +subidoPor: Usuario
    }

    class Notificacion {
        +id: bigint
        +titulo: string
        +mensaje: text
        +tipo: string
        +leida: bool
        +enviar()
    }

    class Puntuacion {
        +id: bigint
        +valor: decimal
        +comentario: text
        +registrar()
    }

    class Juez {
        +asignarCompeticion()
        +registrarPuntuacion()
        +verReportes()
    }

    %% ==== Relaciones ====
    Usuario --> Equipo : crea
    Usuario --> MiembroEquipo : participa
    Equipo --> MiembroEquipo : contiene
    Equipo --> Registro : inscribe
    Competicion --> Registro : recibe
    Competicion --> PostCompeticion : publica
    Competicion --> Media : contiene
    Competicion --> Puntuacion : genera
    Usuario --> Notificacion : recibe
    Usuario --> Media : sube
    Usuario --> Post : publica
    Post <|-- PostGlobal
    Post <|-- PostCompeticion
    Juez --> Competicion : asignado
    Usuario --> Rol
    Competicion --> EstadoCompeticion
    Registro --> EstadoRegistro
    Usuario --> Pais
```
