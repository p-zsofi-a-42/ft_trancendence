.PHONY: dev dev-view prod down

# run in development mode (hot-reload)
dev:
	docker compose --profile dev up --build web-dev

dev-view:
	docker compose --profile dev run --service-ports --rm --build web-dev

logs:
	docker compose --profile dev logs -f user-dev postgres

prod:
	docker compose up -d --build web

down:
	docker compose --profile dev down