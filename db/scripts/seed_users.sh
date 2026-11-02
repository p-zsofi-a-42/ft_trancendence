#!/usr/bin/env bash
# Creates 10 test users through the web registration endpoint.
BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSWORD="${TEST_PASSWORD:-asdf1234}"

for i in $(seq -w 1 10); do
  curl -s -o /dev/null -w "user$i: %{http_code}\n" \
    -X POST "$BASE_URL/api/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"user$i\",\"email\":\"user$i@mail.com\",\"password\":\"$PASSWORD\"}"
done