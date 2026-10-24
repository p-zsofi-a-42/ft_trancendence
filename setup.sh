#!/bin/bash

ENV_EXAMPLE="./.env.example"
SECRET_DIR="./secrets"

SECRET_USER="$SECRET_DIR/db_user.txt"
SECRET_PASS="$SECRET_DIR/db_pass.txt"
SECRET_NAME="$SECRET_DIR/db_name.txt"

echo -e "\e[1mPostgress Credentials\e[0m"
echo "Keep input empty to use default value from the secrets directory"

read -p "Enter Username: " db_user
if [ -z "${db_user}" ];
then
	echo -e "Using $SECRET_USER as input" 
	db_user="$(cat $SECRET_USER)"
fi

read -p "Enter Password: " db_pass
if [ -z "${db_pass}" ];
then
	echo -e "Using $SECRET_PASS as input"
	db_pass="$(cat $SECRET_PASS)"
	
fi

read -p "Enter Database name: " db_name
if [ -z "${db_name}" ];
then
	echo -e "Using $SECRET_NAME as input"
	db_name="$(cat $SECRET_NAME)"
fi

cp $ENV_EXAMPLE .env

sed -i "s/your_database_user_here/${db_user}/" ".env"
sed -i "s/your_database_password_here/${db_pass}/" ".env"
sed -i "s/your_database_name_here/${db_name}/" ".env"

SESSION_KEY=$(openssl rand -hex 16)
sed -i "s/your_session_password_here/${SESSION_KEY}/" ".env"
sed -i "s/your_session_password_here/${SESSION_KEY}/" "web/.env"

TOKEN_KEY=$(openssl rand -hex 16)
sed -i "s/your_token_secret_here/${TOKEN_KEY}/" ".env"
sed -i "s/your_token_secret_here/${TOKEN_KEY}/" "web/.env"

make dev

docker compose exec -T postgres psql -U $db_user -d $db_name < db/schema.sql