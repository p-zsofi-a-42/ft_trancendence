#!/bin/bash

ENV_EXAMPLE_ROOT="./.env.example"
ENV_EXAMPLE_WEB="./web/.env.example"
SECRET_DIR="./secrets"

SECRET_USER="$SECRET_DIR/db_user.txt"
SECRET_PASS="$SECRET_DIR/db_pass.txt"
SECRET_NAME="$SECRET_DIR/db_name.txt"

cred_check() {
	local secret_type=$1
	local file_name="$SECRET_DIR/db_$(echo $secret_type | cut -c1-4).txt"

	if [ $(cat $file_name) = "Remove_this_line_and_enter_the_Database_$secret_type" ];
	then
		echo -e "\033[0;31mChange the $secret_type in $file_name!\033[0m"
		exit
	fi
}

echo -e "\e[1mPostgress Credentials\e[0m"
echo "Keep input empty to use default value from the secrets directory"

read -p "Enter Username: " db_user
if [ -z "${db_user}" ];
then
	cred_check 'username'
	echo -e "Using $SECRET_USER as input\n" 
	db_user="$(cat $SECRET_USER)"
fi

read -p "Enter Password: " db_pass
if [ -z "${db_pass}" ];
then
	cred_check 'password'
	echo -e "Using $SECRET_PASS as input\n"
	db_pass="$(cat $SECRET_PASS)"
fi

read -p "Enter Database name: " db_name
if [ -z "${db_name}" ];
then
	cred_check 'name'
	echo -e "Using $SECRET_NAME as input\n"
	db_name="$(cat $SECRET_NAME)"
fi

cp $ENV_EXAMPLE_ROOT .env
cp $ENV_EXAMPLE_WEB web/.env

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