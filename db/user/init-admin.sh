#!/usr/bin/env bash
# Sourced by the postgres image entrypoint, so do not use `exit` or `set -u` here:
# they would affect the entrypoint shell.

# Converts a hex string to unpadded base64, the encoding used in PHC strings.
hex_to_b64() {
  printf "$(sed 's/../\\x&/g' <<<"$1")" | base64 -w0 | tr -d '='
}

# Builds a scrypt PHC string that @adonisjs/hash verifies (see services/user/server/utils/password.ts).
make_scrypt_hash() {
  local salt_hex hash_hex
  salt_hex=$(head -c 16 /dev/urandom | od -An -tx1 -v | tr -d ' \n')
  # openssl prints the derived key as colon-separated hex, e.g. "44:CD:15"
  hash_hex=$(openssl kdf -keylen 64 \
    -kdfopt pass:"$ADMIN_PASSWORD" -kdfopt hexsalt:"$salt_hex" \
    -kdfopt n:16384 -kdfopt r:8 -kdfopt p:1 SCRYPT | tr -d ':')
  printf '$scrypt$n=16384,r=8,p=1$%s$%s' "$(hex_to_b64 "$salt_hex")" "$(hex_to_b64 "$hash_hex")"
}

if [ -z "${ADMIN_PASSWORD:-}" ] || [ -z "${ADMIN_EMAIL:-}" ]; then
  echo "init-admin: ADMIN_EMAIL and ADMIN_PASSWORD are not both set, skipping admin creation" >&2
else
  # Values go through psql variables, so quotes or special characters in them are escaped by psql.
  psql -v ON_ERROR_STOP=1 \
    -v admin_name="${ADMIN_NAME:-admin}" \
    -v admin_email="$ADMIN_EMAIL" \
    -v admin_hash="$(make_scrypt_hash)" \
    --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
INSERT INTO users (name, email, password_hash, role)
VALUES (lower(:'admin_name'), lower(:'admin_email'), :'admin_hash', 'admin')
ON CONFLICT DO NOTHING;
SQL
fi
