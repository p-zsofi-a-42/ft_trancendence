## Create env variables (check .env.example)

## make dev

## Database Setup
After `make dev` run
```bash
docker compose exec -T postgres psql -U your_db_user -d your_db_name < db/schema.sql
```