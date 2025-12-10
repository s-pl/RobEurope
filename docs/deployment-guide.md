# Deployment Guide Ángel Lallave Herrera

## Deployment Upload

## 1. Install Docker on Ubuntu

Install Docker using the official method:

sudo apt update
sudo apt upgrade -y

sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version
docker compose version

sudo usermod -aG docker $USER


## 2. Start the Docker Services

Enter the project folder:

cd RobEurope

Start the containers:

docker compose up -d

This will start the following services:
- BIND9
- LDAP
- Redis


## 3. Backend Setup

Go to the backend folder and install the dependencies:

cd backend
npm install


## 4. Initialize the Database and LDAP

Run the migrations and LDAP initialization:

npm run migrate
node init-ldap.js


## 5. Start the Development Server

npm run dev


## 6. Environment Variables

Update your .env file with the correct values:

PORT=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASS=
JWT_SECRET=
NODE_ENV=
LDAP_URL=
LDAP_BIND_DN=cn=
LDAP_BIND_PASSWORD=
LDAP_BASE_DN=
LDAP_USER_DN=
