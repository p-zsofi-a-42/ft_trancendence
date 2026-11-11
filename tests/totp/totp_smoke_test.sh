#!/usr/bin/env bash
# Smoke test for the TOTP 2FA flow, end-to-end through the web BFF
# (register -> setup -> enable -> logout -> login w/ 2FA -> verify -> profile
#  -> logout -> login w/ 2FA -> recovery code -> disable).
#
# Usage: ./tests/totp/totp_smoke_test.sh
# Env:   BASE_URL (default http://localhost:3000)
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="totp-smoke-$(date +%s)@mail.com"
PASSWORD="Sm0keTest!"
COOKIE_JAR="$(mktemp)"
TOTP_SCRIPT="$(dirname "$0")/totp_code.mjs"

PASS=0
FAIL=0

cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

# req <method> <path> <json-body>
# Prints the response body to stdout; HTTP status goes to fd 3.
req() {
  local method="$1" path="$2" body="${3:-}"
  local status response
  response=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -w '\n%{http_code}' \
    -X "$method" "$BASE_URL$path" \
    -H 'Content-Type: application/json' \
    -d "$body")
  status="${response##*$'\n'}"
  echo "${response%$'\n'*}"
  echo "$status" >&3
}

# check <label> <expected-status> <actual-status>
check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS: $label ($actual)"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

echo "== Using $EMAIL against $BASE_URL =="

# 1. Register
body=$(req POST /api/auth/register "{\"name\":\"totp-smoke\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" 3>&1)
status=$(tail -n1 <<<"$body"); body=$(head -n -1 <<<"$body")
check "register" 200 "$status"

# 2. Login (no 2FA yet)
body=$(req POST /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" 3>&1)
status=$(tail -n1 <<<"$body"); body=$(head -n -1 <<<"$body")
check "login (pre-2FA)" 200 "$status"
totp_required=$(jq -r '.totpRequired // false' <<<"$body")
if [[ "$totp_required" == "false" ]]; then
  echo "PASS: login does not require TOTP yet"
  PASS=$((PASS + 1))
else
  echo "FAIL: login unexpectedly required TOTP"
  FAIL=$((FAIL + 1))
fi

# 3. Setup TOTP
body=$(req POST /api/auth/totp/setup "" 3>&1)
status=$(tail -n1 <<<"$body"); body=$(head -n -1 <<<"$body")
check "totp setup" 200 "$status"
secret=$(jq -r '.secret' <<<"$body")
if [[ -z "$secret" || "$secret" == "null" ]]; then
  echo "FAIL: no secret returned from setup, aborting"
  exit 1
fi
echo "  secret: $secret"

# 4. Enable TOTP with a freshly generated code
code=$(node "$TOTP_SCRIPT" "$secret")
body=$(req POST /api/auth/totp/enable "{\"code\":\"$code\"}" 3>&1)
status=$(tail -n1 <<<"$body"); body=$(head -n -1 <<<"$body")
check "totp enable" 200 "$status"
recovery_code=$(jq -r '.recoveryCodes[0] // empty' <<<"$body")
if [[ -z "$recovery_code" ]]; then
  echo "FAIL: no recovery codes returned from enable, aborting"
  exit 1
fi
echo "  first recovery code: $recovery_code"

# 5. Logout
body=$(req POST /api/auth/logout "" 3>&1)
status=$(tail -n1 <<<"$body")
check "logout" 200 "$status"

# 6. Login again - should now require TOTP, and not yet grant a full session
body=$(req POST /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" 3>&1)
status=$(tail -n1 <<<"$body"); body=$(head -n -1 <<<"$body")
check "login (2FA pending)" 200 "$status"
totp_required=$(jq -r '.totpRequired // false' <<<"$body")
if [[ "$totp_required" == "true" ]]; then
  echo "PASS: login now requires TOTP"
  PASS=$((PASS + 1))
else
  echo "FAIL: login did not flag totpRequired after enabling 2FA"
  FAIL=$((FAIL + 1))
fi

# 7. Profile should be rejected while 2FA is still pending
body=$(req GET /api/auth/profile "" 3>&1)
status=$(tail -n1 <<<"$body")
check "profile rejected before 2FA verify" 401 "$status"

# 8. Verify TOTP code to complete login
code=$(node "$TOTP_SCRIPT" "$secret")
body=$(req POST /api/auth/totp/verify "{\"code\":\"$code\"}" 3>&1)
status=$(tail -n1 <<<"$body")
check "totp verify" 200 "$status"

# 9. Profile should now succeed
body=$(req GET /api/auth/profile "" 3>&1)
status=$(tail -n1 <<<"$body")
check "profile after 2FA verify" 200 "$status"

# 10. Logout, log back in, and use a recovery code instead of a TOTP code
req POST /api/auth/logout "" >/dev/null 3>/dev/null
req POST /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null 3>/dev/null

body=$(req POST /api/auth/totp/recovery "{\"code\":\"$recovery_code\"}" 3>&1)
status=$(tail -n1 <<<"$body")
check "recovery code accepted" 200 "$status"

# 11. The same recovery code must not work a second time
req POST /api/auth/logout "" >/dev/null 3>/dev/null
req POST /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null 3>/dev/null
body=$(req POST /api/auth/totp/recovery "{\"code\":\"$recovery_code\"}" 3>&1)
status=$(tail -n1 <<<"$body")
check "reused recovery code rejected" 401 "$status"

# 12. Verify with a real TOTP code again, then disable 2FA, cleaning up this test user's state
code=$(node "$TOTP_SCRIPT" "$secret")
req POST /api/auth/totp/verify "{\"code\":\"$code\"}" >/dev/null 3>/dev/null
body=$(req POST /api/auth/totp/disable "" 3>&1)
status=$(tail -n1 <<<"$body")
check "totp disable" 200 "$status"

echo
echo "== $PASS passed, $FAIL failed =="
exit $((FAIL > 0))
