## 1. Create env variables (check .env.example)

## 2. make dev

## 3. Database Setup (intialize)
After `make dev`
```bash
docker compose exec -T postgres psql -U your_db_user -d your_db_name < db/schema.sql
```

# Docker rebuild and cleanup rules

## Fast default rebuilds

Use these for normal source, Dockerfile, or container-setting changes:

| Situation | Command | Stops containers | Rebuilds | Deletes application data |
| --- | --- | --- | --- | --- |
| Development rebuild | `make rebuild` | Yes | Yes | No |
| Development rebuild with fresh dependencies | `make clean-rebuild` | Yes | Yes | Node caches only |
| Production rebuild | `make rebuild-prod` | Yes | Yes | No |
| Production rebuild with fresh dependencies | `make clean-rebuild-prod` | Yes | Yes | Node caches only |
| Stop without rebuilding | `make stop` | Yes | No | No |
| Restart containers without rebuilding | `make restart` | No (recreates) | No | No |

Ordinary rebuilds keep `postgres_data`, `game_data`, and `avatars`.

## Separate cleanup commands

- `make clean-cache` removes only the `*_node_modules` named volumes.
- `make clean-runtime` runs `REDIS FLUSHALL` against Redis cache state.
- `make reset-user-db` removes only user/Postgres data, then initializes the schema.
- `make reset-game-db` removes only game data, then initializes the game schema.
- `make reset-avatar` removes only uploaded avatar files.
- `make reset-all-data` removes user and game databases plus avatars.
- `make clean-anonymous-volumes` removes unused anonymous/dangling volumes.

## Explicit full rebuild

`make full-rebuild-dev` is the only compound target that permits data loss:

1. Stops the stack.
2. Removes containers and every Compose named volume.
3. Builds images from scratch.
4. Starts the development stack.
5. Initializes both database schemas.

Do not use it for routine rebuilds or database debugging.

## When the database rejects writes

1. Run `make logs` and inspect PostgreSQL and application errors.
2. Run `make rebuild` first; it preserves database and avatar volumes.
3. If dependencies seem inconsistent, run `make clean-rebuild`.
4. Use `make clean-runtime` if only Redis presence/cache state is stale.
5. If only the user database is corrupted, use `make reset-user-db`.
6. If only game state is corrupted, use `make reset-game-db`.
7. Use `make full-rebuild-dev` only when all application data may be discarded.

## Why anonymous volumes appear

Docker creates anonymous volumes for container mounts that do not specify a
volume name. Development dependency mounts and old container configurations can
leave them behind. They are disposable when no container is using them:

```bash
docker volume ls
docker volume ls --filter dangling=true
make clean-anonymous-volumes
```