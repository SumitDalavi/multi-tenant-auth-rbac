# multi-tenant-auth-rbac Architecture

## System Diagram
The following Mermaid.js sequence diagram maps the core workflow and interactions:

```mermaid
sequenceDiagram
    client->>API: Request + JWT
API->>Middleware: Extract TenantID
API->>Postgres: SET LOCAL app.tenant_id
Postgres->>API: RLS filtered rows
API-->>client: Data
```

## Component Breakdown
- **Core Technology**: NestJS, Postgres RLS
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security.

## Security & Scaling Considerations
- Strict boundary validations.
- Horizontal scalability achieved via stateless workers.
- Encrypted data at rest and in transit.
