# Database migrations

Migrations are ordered, immutable SQL files. Apply them in lexical order with a deployment database role that can create extensions during initial bootstrap. Production deployments must record each applied filename and checksum in the migration runner before applying it transactionally.

For local bootstrap, after `docker compose up -d db`:

```powershell
Get-Content infra/migrations/001_initial.sql | docker compose exec -T db psql -U lastline -d lastline
```

The migration intentionally creates only the Milestone 1 write/read tables. Later milestones extend this schema; do not edit an applied migration.
