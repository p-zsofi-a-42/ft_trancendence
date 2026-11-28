# Build context is ./db. The image entrypoint runs /docker-entrypoint-initdb.d
# files in alphabetical order, once, when it starts with an empty data volume.
FROM postgres:16

COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY user/init-admin.sh /docker-entrypoint-initdb.d/02-init-admin.sh
