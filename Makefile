.PHONY: dev dev-view prod down stop restart \
	rebuild rebuild-prod clean-rebuild clean-rebuild-prod full-rebuild full-rebuild-dev \
	clean-cache clean-runtime reset-user-db reset-game-db reset-avatar reset-all-data \
	init-db clean-anonymous-volumes help \
  test test-login test-auth-restart

COMPOSE_PROJECT_NAME ?= $(shell basename "$(CURDIR)")

help:
	@printf '%s\n' \
		"Development: make dev | make dev-view | make logs | make stop | make restart" \
		"Safe rebuilds (database and avatars kept): make rebuild | make rebuild-prod" \
		"Cache-clean rebuilds: make clean-rebuild | make clean-rebuild-prod" \
		"Database reset: make reset-user-db | make reset-game-db | make reset-avatar" \
		"All-data reset: make reset-all-data" \
		"Explicit dataloss rebuild: make full-rebuild-dev" \
		"Maintenance: make init-db | make clean-anonymous-volumes"

# run in development mode (hot-reload)
dev:
	docker compose --profile dev up -d --build web-dev

logs:
	docker compose --profile dev logs -f user-dev postgres

dev-view:
	docker compose --profile dev run --service-ports --rm --build web-dev

prod:
	docker compose up -d --build web

down:
	docker compose --profile dev down

stop:
	docker compose --profile dev down --remove-orphans

restart:
	docker compose --profile dev up -d --force-recreate

# Safe container rebuild: stops containers and recreates them, but keeps every
# named volume, including PostgreSQL and avatars.
rebuild:
	docker compose --profile dev down --remove-orphans
	docker compose --profile dev up -d --build --force-recreate

rebuild-prod:
	docker compose down --remove-orphans
	docker compose up -d --build --force-recreate

# Compound cache rebuild: also removes disposable node_modules volumes.
clean-rebuild: clean-cache
	docker compose --profile dev up -d --build --force-recreate

clean-rebuild-prod: clean-cache
	docker compose up -d --build --force-recreate

# Remove disposable dependency caches only. Database and avatar volumes survive.
clean-cache:
	docker compose --profile dev down --remove-orphans
	docker volume rm "$(COMPOSE_PROJECT_NAME)_web_node_modules" \
		"$(COMPOSE_PROJECT_NAME)_user_node_modules" \
		"$(COMPOSE_PROJECT_NAME)_game_node_modules" 2>/dev/null || true

# Redis is cache/runtime state. FLUSHALL removes keys without deleting volumes.
clean-runtime:
	docker compose up -d redis
	docker compose exec -T redis redis-cli FLUSHALL

# Initialize both database schemas after a database volume is recreated.
init-db:
	docker compose up -d postgres game-db
	@until docker compose exec -T postgres pg_isready -U "$$(docker compose exec -T postgres printenv POSTGRES_USER)" -d "$$(docker compose exec -T postgres printenv POSTGRES_DB)"; do sleep 1; done
	docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' < db/schema.sql
	@until docker compose exec -T game-db pg_isready -U "$$(docker compose exec -T game-db printenv POSTGRES_USER)" -d "$$(docker compose exec -T game-db printenv POSTGRES_DB)"; do sleep 1; done
	cat db/game/games.sql db/game/companies.sql db/game/rounds.sql db/game/round_results.sql | docker compose exec -T game-db sh -c 'psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

# Narrow data resets.
reset-user-db:
	docker compose --profile dev down --remove-orphans
	docker volume rm "$(COMPOSE_PROJECT_NAME)_postgres_data"
	@$(MAKE) init-db

reset-game-db:
	docker compose --profile dev down --remove-orphans
	docker volume rm "$(COMPOSE_PROJECT_NAME)_game_data"
	@$(MAKE) init-db

reset-avatar:
	docker compose --profile dev down --remove-orphans
	docker volume rm "$(COMPOSE_PROJECT_NAME)_avatars"

reset-all-data: reset-user-db reset-game-db reset-avatar

# Explicit destructive rebuild. This removes containers and every named volume.
full-rebuild:
	docker compose --profile dev down --volumes --remove-orphans
	docker compose build --no-cache
	docker builder prune -f

full-rebuild-dev: full-rebuild
	docker compose --profile dev up -d --build --force-recreate
	@$(MAKE) init-db

# Remove only anonymous volumes not attached to a container.
clean-anonymous-volumes:
	docker volume ls --filter dangling=true --format '{{.Name}}'
	docker volume prune -f
  
# ---------Testing-------------
test:
	docker compose run --rm -T --no-deps web-tester

# Requires TEST_AUTH_USERNAME and TEST_AUTH_PASSWORD for an existing test user.
# This target intentionally stops and starts the development Compose stack.
test-auth-restart:
	bash web/test/e2e/auth-session-restart.sh
