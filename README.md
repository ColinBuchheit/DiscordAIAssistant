# Discord AI Assistant - Developer Setup Guide

This project is a Discord bot integrated with OpenAI's GPT model and MongoDB for storing conversations. The following guide is intended for developers who will be contributing to or continuing development on this project. It provides detailed steps on how to set up the project locally using Docker and environment configurations.

---

## Prerequisites

To get started, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- A [Discord Developer Account](https://discord.com/developers/applications) with a bot token (`DISCORD_TOKEN`)
- An [OpenAI API Key](https://platform.openai.com/signup) for ChatGPT integration

---

## Setup Instructions

### 1. Clone the Repository

Start by cloning this repository to your local machine:

```bash
git clone https://github.com/ColinBuchheit/DiscordAIAssistant.git
cd DiscordAIAssistant
```

---

### 2. Add Environment Variables

Add the following environment variables to the `.env` file:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://devUser:devPassword@mongo:27017/discordBotDB?authSource=discordBotDB

# Discord Bot Token
DISCORD_TOKEN=<your_discord_token>

# OpenAI API Key
CHATGPT_API_KEY=<your_openai_api_key>

# MongoDB Admin Credentials
MONGO_INITDB_ROOT_USERNAME=devUser
MONGO_INITDB_ROOT_PASSWORD=devPassword

# API Port
PORT=5000
```

Replace `<your_discord_token>` with your actual Discord bot token.
Replace `<your_openai_api_key>` with your OpenAI API key.

---

### 3. Start the Application with Docker

The project is fully containerized using Docker, making it easier for any developer to set up and run the application locally.

**Step 1: Build and Start the Containers**

Run the following command to build and start the necessary Docker containers:

```bash
docker-compose up -d --build
```

This command will:

- Set up MongoDB and initialize it with the `discordBotDB` database.
- Start the Node.js API server for handling API requests.
- Start the Discord bot, which will listen for commands on the Discord server.

**Step 2: Verify Containers Are Running**

Check the running containers using:

```bash
docker-compose ps
```

You should see `mongo`, `discord-api`, and `discord-bot-app` containers running.

---

### 4. Access MongoDB

For development purposes, you can access MongoDB using MongoDB Compass or the command line.

**MongoDB Compass:**

Use the following connection string to access your database:

```
mongodb://devUser:devPassword@localhost:27017/discordBotDB?authSource=discordBotDB
```

You can browse and manage your collections here, especially the `conversations` collection, which stores user interactions.

---

### 5. Making Changes and Rebuilding

**Step 1: Modify Code**

- Backend API code is located in the `discord-api` folder, specifically the `server.ts` file.
- The bot's Python logic is located in the `discord-bot-app` folder, with key files like `discord_api.py` and `openai.py`.

**Step 2: Rebuild and Restart Containers**

After making any code changes, you will need to rebuild the containers to reflect your changes:

```bash
docker-compose down -v
```

The `-v` flag will remove existing containers and volumes, ensuring that any changes to the database or configurations are fully applied.

Then start the containers again:

```bash
docker-compose up -d --build
```

**Step 3: Test Changes**

Once your containers are back up and running, test the functionality of your changes by interacting with the bot in Discord or sending API requests to the server running on [http://localhost:5000](http://localhost:5000).

---

### 6. Troubleshooting

**MongoDB Authentication Errors**

If you encounter MongoDB authentication issues, make sure the credentials in your `.env` file match those in your `init-mongo.js` or database initialization script.

**Checking Logs for Errors**

Use the following command to check container logs if any issues arise:

```bash
docker-compose logs -f
```

This will show you logs from all containers, helping you identify errors in MongoDB, the API server, or the bot.

You can also use the following command to check logs for a specific container (e.g., `discord-bot-app`):

```bash
docker-compose logs -f discord-bot-app
```

This helps in narrowing down issues to a particular service.

---

### 7. Shutting Down the Project

When you're finished working on the project, you can shut down the running containers with:

```bash
docker-compose down
```

This will stop and remove the containers but keep the database volume intact.
