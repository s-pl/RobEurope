# System Diagrams

This document provides an overview of the available system diagrams for the RobEurope platform.

## PlantUML Diagrams

### Entity Relationship Diagram (ERD)
**File**: `erd-diagram.puml`
- Complete database schema with all 16 tables and relationships
- Shows primary keys, foreign keys, and constraints
- PlantUML format for easy editing and rendering

### Class Diagram
**File**: `class-diagram.puml`
- Object-oriented design of the system
- Shows controllers, models, services, and middleware
- Illustrates relationships and dependencies between classes

### Architecture Component Diagram
**File**: `architecture-diagram.puml`
- High-level system architecture with components
- Shows frontend, backend, database, and external services
- Illustrates data flow and security boundaries

### Authentication Sequence Diagram
**File**: `authentication-sequence.puml`
- Detailed login/logout flow sequence
- Shows interaction between frontend, API, and database
- Includes session management and JWT handling

### Use Case Diagram
**File**: `use-case-diagram.puml`
- System use cases for different user roles
- Shows actors (User, Captain, Admin) and their capabilities
- Includes system-level use cases and relationships

### Deployment Diagram
**File**: `deployment-diagram.puml`
- Production and development environment architecture
- Shows server components, databases, and external services
- Illustrates scaling and security zones

### Data Flow Diagram
**File**: `data-flow-diagram.puml`
- Data flow between processes, stores, and external entities
- Shows trust boundaries and security controls
- Illustrates data classification and protection measures

## Image-based Diagrams

### Database Diagrams
- **`img/erd.png`** - ERD diagram image
- **`img/db.png`** - Database schema image
- **`docs/dbdiagram.pdf`** - PDF version of database diagram

### Class Diagrams
- **`img/class.png`** - System class diagram image

### Additional Visual Documentation
- **`docs/image.jpg`** and **`docs/image-1.jpg`** - Supplementary architecture diagrams

## Mermaid Diagrams in Documentation

In addition to PlantUML files, the technical documentation contains embedded Mermaid diagrams:

- **Data Flow Diagrams**: In `docs/data-flow.md`
- **Authentication Flow**: In `docs/authentication-flow.md`
- **Architecture Overview**: In `docs/architecture-overview.md`

## How to Render PlantUML Diagrams

### Online Tools
- **PlantUML Web Server**: https://www.plantuml.com/plantuml
- **GitHub**: Automatic rendering in Markdown files
- **VS Code Extensions**: PlantUML extension for preview

### Local Rendering
```bash
# Install PlantUML
sudo apt-get install plantuml

# Render to PNG
plantuml erd-diagram.puml

# Render to SVG
plantuml -tsvg erd-diagram.puml
```

### IntelliJ IDEA / VS Code Integration
- Install PlantUML plugin
- Diagrams render automatically in IDE
- Export to various formats

## Diagram Categories

1. **Structural Diagrams**
   - ERD Diagram (`erd-diagram.puml`)
   - Class Diagram (`class-diagram.puml`)
   - Component Diagram (`architecture-diagram.puml`)

2. **Behavioral Diagrams**
   - Sequence Diagram (`authentication-sequence.puml`)
   - Use Case Diagram (`use-case-diagram.puml`)

3. **Deployment Diagrams**
   - Deployment Diagram (`deployment-diagram.puml`)

4. **Data Flow Diagrams**
   - Data Flow Diagram (`data-flow-diagram.puml`)

## Usage Guidelines

### For Developers
- Use PlantUML diagrams for documentation
- Keep diagrams updated with code changes
- Use consistent naming conventions

### For Documentation
- Include diagram references in relevant docs
- Use diagrams to explain complex relationships
- Update diagrams when architecture changes

### For Presentations
- Export PlantUML to high-quality images
- Use PDF versions for formal documents
- Include legends and explanations

## Maintenance

### Updating Diagrams
1. Edit the `.puml` file with any text editor
2. Render to verify changes
3. Commit both source and rendered versions
4. Update references in documentation

### Version Control
- Keep PlantUML source files in version control
- Generated images can be committed or generated on-demand
- Use consistent file naming: `diagram-type.puml`

## Future Enhancements

Potential diagrams to add:
- State diagrams for complex workflows
- Activity diagrams for business processes
- Timing diagrams for real-time features
- Communication diagrams for system interactions
- Package diagrams for code organization