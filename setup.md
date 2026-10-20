## 1. Create env variables (check .env.example)

## 2. make dev

## 3. Database Setup (intialize)
After `make dev`
```bash
docker compose exec -T postgres psql -U your_db_user -d your_db_name < db/schema.sql
```