#!/bin/bash

set -e

cd ~ || exit

sudo apt update
sudo apt remove -y mysql-server mysql-client || true
sudo apt install -y libcups2-dev redis-server mariadb-client

pip install frappe-bench

FRAPPE_BRANCH="version-16"
ERPNEXT_BRANCH="version-16"

echo "Using Frappe branch: $FRAPPE_BRANCH"
echo "Using ERPNext branch: $ERPNEXT_BRANCH"

git clone https://github.com/frappe/frappe \
    --branch $FRAPPE_BRANCH --depth 1

bench init --skip-assets \
    --frappe-path ~/frappe \
    --python "$(which python)" \
    frappe-bench

mkdir -p ~/frappe-bench/sites/test_site

cp "${GITHUB_WORKSPACE}/.github/helper/site_config.json" \
    ~/frappe-bench/sites/test_site/site_config.json

mariadb --host 127.0.0.1 --port 3306 -u root -proot \
    -e "SET GLOBAL character_set_server = 'utf8mb4'"

mariadb --host 127.0.0.1 --port 3306 -u root -proot \
    -e "SET GLOBAL collation_server = 'utf8mb4_unicode_ci'"

mariadb --host 127.0.0.1 --port 3306 -u root -proot \
    -e "CREATE USER 'test_frappe'@'localhost' IDENTIFIED BY 'test_frappe'"

mariadb --host 127.0.0.1 --port 3306 -u root -proot \
    -e "CREATE DATABASE test_frappe"

mariadb --host 127.0.0.1 --port 3306 -u root -proot \
    -e "GRANT ALL PRIVILEGES ON \`test_frappe\`.* TO 'test_frappe'@'localhost'"

mariadb --host 127.0.0.1 --port 3306 -u root -proot \
    -e "FLUSH PRIVILEGES"

cd ~/frappe-bench || exit

sed -i 's/watch:/# watch:/g' Procfile
sed -i 's/schedule:/# schedule:/g' Procfile
sed -i 's/socketio:/# socketio:/g' Procfile
sed -i 's/redis_socketio:/# redis_socketio:/g' Procfile

bench get-app payments

bench get-app https://github.com/frappe/erpnext \
    --branch $ERPNEXT_BRANCH --resolve-deps

bench setup requirements --dev

bench start &> bench_run_logs.txt &

CI=Yes bench build --app frappe &

bench --site test_site reinstall --yes

bench get-app "${GITHUB_WORKSPACE}"

bench --site test_site install-app legal_management

bench setup requirements --dev

echo "Legal Management environment setup completed!"
