.PHONY: dev prod down

# run in development mode (hot-reload)
dev:
	docker compose --profile dev up -d --build web-dev

prod:
	docker compose up -d --build web

down:
	docker compose --profile dev down