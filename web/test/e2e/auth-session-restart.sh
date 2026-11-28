#!/usr/bin/env bash
set -Eeuo pipefail

: "${TEST_AUTH_USERNAME:?Set TEST_AUTH_USERNAME to a test account without 2FA}"
: "${TEST_AUTH_PASSWORD:?Set TEST_AUTH_PASSWORD to that account's password}"

base_url="${TEST_AUTH_BASE_URL:-http://127.0.0.1:3000}"
cookie_jar="$(mktemp)"
profile_body="$(mktemp)"
stack_down=0

cleanup() {
  local status=$?
  trap - EXIT
  rm -f "$cookie_jar" "$profile_body"
  if (( stack_down )); then
    make dev || true
  fi
  exit "$status"
}
trap cleanup EXIT

payload="$(docker compose run --rm -T --no-deps \
  -e TEST_AUTH_USERNAME -e TEST_AUTH_PASSWORD \
  web-tester node -e \
  'process.stdout.write(JSON.stringify({ login: process.env.TEST_AUTH_USERNAME, password: process.env.TEST_AUTH_PASSWORD }))')"

curl -fsS -o /dev/null -c "$cookie_jar" \
  -H 'Content-Type: application/json' \
  --data-binary "$payload" \
  "$base_url/api/auth/login"

if ! curl -fsS -b "$cookie_jar" -o "$profile_body" "$base_url/api/auth/profile"; then
  echo "Login did not create an authenticated session; use a valid test account without 2FA." >&2
  exit 1
fi

stack_down=1
make down
make dev
stack_down=0

attempt=0
until curl -fsS -b "$cookie_jar" -o "$profile_body" "$base_url/api/auth/profile"; do
  attempt=$((attempt + 1))
  if (( attempt >= 60 )); then
    echo "The profile endpoint did not become available after make dev." >&2
    exit 1
  fi
  sleep 1
done

echo "PASS: the authenticated profile remained available after make down and make dev."
