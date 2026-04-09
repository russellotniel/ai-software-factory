# Data Model

> Owner: System Architect
> Status: [ ] Draft [ ] In Review [ ] Approved
> Project:
> Date:

## Tables

### [table_name]
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | NO | Primary key |
| tenant_id | UUID | NO | Multi-tenancy isolation |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |
| created_by | UUID | NO | |
| updated_by | UUID | NO | |
| | | | |

**RLS policy:**
```sql
-- Read policy

-- Write policy
```

## Relationships
```
table_a.column → table_b.id (foreign key)
```

## RPCs
<!-- List business logic RPCs — use for joins, aggregations, complex operations -->
| RPC name | Purpose | Security |
|----------|---------|---------|
| | | SECURITY INVOKER |

## Indexes
<!-- Non-obvious indexes required for performance -->
