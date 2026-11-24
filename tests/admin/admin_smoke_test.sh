#!/usr/bin/env bash
# Smoke test for admin user management, end-to-end through the web BFF
# (admin login -> guard for normal users -> list -> lookup -> self-delete/self-demote
#  -> duplicate username -> update -> delete a test user).
#
# Requires an existing admin account without 2FA. Promote one first, e.g.:
#   UPDATE users SET role = 'admin' WHERE name = '<name>';
# The last-admin lock needs a second admin, so it is not covered here.
#
# Usage: ADMIN_USER=<name> ADMIN_PASSWORD=<password> ./tests/admin/admin_smoke_test.sh
# Env:   BASE_URL (default http://localhost:3000), ADMIN_USER and ADMIN_PASSWORD (required)
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
: "${ADMIN_USER:?Set ADMIN_USER to an existing admin account}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD to the password of ADMIN_USER}"

TEST_USER="admin-smoke-$(date +%s)"
TEST_PASSWORD="$(head -c 18 /dev/urandom | base64)"
ADMIN_JAR="$(mktemp)"
USER_JAR="$(mktemp)"
ADMIN_ID=""
TEST_ID=""

PASS=0
FAIL=0
STATUS=""
BODY=""

cleanup() {
  if [[ -n "$TEST_ID" ]]; then
    call "$ADMIN_JAR" DELETE "/api/admin/users/$TEST_ID" >/dev/null
  fi
  rm -f "$ADMIN_JAR" "$USER_JAR"
}
trap cleanup EXIT

abort() {
  echo "FAIL: $1"
  exit 1
}

# call <cookie-jar> <method> <path> [json-body]
# Sets BODY and STATUS for the response.
call() {
  local jar="$1" method="$2" path="$3" body="${4:-}"
  local response
  response=$(curl -s -b "$jar" -c "$jar" -w '\n%{http_code}' \
    -X "$method" "$BASE_URL$path" \
    -H 'Content-Type: application/json' \
    -d "$body")
  STATUS="${response##*$'\n'}"
  BODY="${response%$'\n'*}"
}

# check <label> <expected-status>
check() {
  local label="$1" expected="$2"
  if [[ "$STATUS" == "$expected" ]]; then
    echo "PASS: $label ($STATUS)"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $label (expected $expected, got $STATUS)"
    FAIL=$((FAIL + 1))
  fi
}

echo "== Admin smoke test against $BASE_URL =="

# 1. Admin login. The account must be an admin without 2FA.
call "$ADMIN_JAR" POST /api/auth/login "$(jq -cn --arg u "$ADMIN_USER" --arg p "$ADMIN_PASSWORD" '{username: $u, password: $p}')"
check "admin login" 200
if [[ "$(jq -r '.totpRequired // false' <<<"$BODY")" == "true" ]]; then
  abort "admin account has 2FA enabled, use one without it"
fi
if [[ "$(jq -r '.user.role // empty' <<<"$BODY")" != "admin" ]]; then
  abort "$ADMIN_USER is not an admin, promote it first (see header)"
fi
ADMIN_ID="$(jq -r '.user.id' <<<"$BODY")"

# 2. Create a normal user to test the guard and the update/delete paths
call "$USER_JAR" POST /api/auth/register "$(jq -cn --arg n "$TEST_USER" --arg e "$TEST_USER@mail.com" --arg p "$TEST_PASSWORD" '{name: $n, email: $e, password: $p}')"
check "register test user" 200
call "$USER_JAR" POST /api/auth/login "$(jq -cn --arg u "$TEST_USER" --arg p "$TEST_PASSWORD" '{username: $u, password: $p}')"
check "login test user" 200

# 3. A normal user must not reach the admin list (BFF returns 401 for non-admins)
call "$USER_JAR" GET /api/admin/users
check "normal user cannot list users" 401

# 4. Admin list: must succeed and must not expose credential fields
call "$ADMIN_JAR" GET "/api/admin/users?q=$TEST_USER"
check "admin lists users" 200
if grep -qiE 'passwordHash|password_hash|totpSecret|totp_secret' <<<"$BODY"; then
  echo "FAIL: list response contains credential fields"
  FAIL=$((FAIL + 1))
else
  echo "PASS: list response has no credential fields"
  PASS=$((PASS + 1))
fi
TEST_ID="$(jq -r --arg n "$TEST_USER" '.items[] | select(.name == $n) | .id' <<<"$BODY")"
if [[ -z "$TEST_ID" || "$TEST_ID" == "null" ]]; then
  abort "could not find test user $TEST_USER in list"
fi

# 5. Invalid ID must be rejected as a client error, not a server error
call "$ADMIN_JAR" GET /api/admin/users/not-a-number
check "non-numeric user id rejected" 400

# 6. Admin cannot delete or demote their own account
call "$ADMIN_JAR" DELETE "/api/admin/users/$ADMIN_ID"
check "admin cannot delete own account" 409
call "$ADMIN_JAR" PATCH "/api/admin/users/$ADMIN_ID" '{"role": "user"}'
check "admin cannot demote own account" 409

# 7. Renaming to an existing username must be a conflict, not a 500
call "$ADMIN_JAR" PATCH "/api/admin/users/$TEST_ID" "$(jq -cn --arg n "$ADMIN_USER" '{name: $n}')"
check "duplicate username rejected" 409

# 8. A valid update succeeds
call "$ADMIN_JAR" PATCH "/api/admin/users/$TEST_ID" "$(jq -cn --arg e "updated-$TEST_USER@mail.com" '{email: $e}')"
check "update test user email" 200

# 9. Delete the test user, then confirm it is gone
call "$ADMIN_JAR" DELETE "/api/admin/users/$TEST_ID"
check "admin deletes test user" 200
TEST_ID=""
call "$ADMIN_JAR" GET "/api/admin/users?q=$TEST_USER"
if [[ "$(jq -r --arg n "$TEST_USER" '[.items[] | select(.name == $n)] | length' <<<"$BODY")" == "0" ]]; then
  echo "PASS: deleted test user no longer listed"
  PASS=$((PASS + 1))
else
  echo "FAIL: deleted test user is still listed"
  FAIL=$((FAIL + 1))
fi

echo
echo "== $PASS passed, $FAIL failed =="
exit $((FAIL > 0))
