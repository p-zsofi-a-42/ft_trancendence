.PHONY: dev dev-view prod down test test-login test-auth-restart

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


# ---------Testing-------------
test:
	docker compose run --rm -T --no-deps web-tester

# Requires TEST_AUTH_USERNAME and TEST_AUTH_PASSWORD for an existing test user.
# This target intentionally stops and starts the development Compose stack.
test-auth-restart:
	bash web/test/e2e/auth-session-restart.sh
