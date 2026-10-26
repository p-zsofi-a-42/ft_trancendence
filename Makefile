.PHONY: web-dev prod down

# run in development mode (hot-reload)
dev:
	docker compose --profile dev run --build --service-ports --rm web-dev

logs:
	docker compose --profile dev logs -f user-dev postgres

prod:
	docker compose up -d --build web

down:
	docker compose --profile dev down