
# Discord AI Assistant - Developer Setup Guide

This project is a Discord bot integrated with OpenAI's GPT model and MongoDB for storing conversations. The following guide is intended for developers contributing to or continuing development on this project. It provides detailed steps for setting up the project locally using Docker and configuring the required environment.

---

## Prerequisites

Ensure you have the following installed before proceeding:

- [Docker and Docker Compose](https://www.docker.com/products/docker-desktop)
- [Node.js (with npm)](https://nodejs.org/)
- A [Discord Developer Account](https://discord.com/developers/applications) with a bot token (`DISCORD_TOKEN`)
- An OpenAI API Key for ChatGPT integration ([Get your API Key here](https://platform.openai.com/))

---

## Setup Instructions

### 1. Clone the Repository

Start by cloning the repository to your local machine:

```bash
git clone https://github.com/ColinBuchheit/DiscordAIAssistant.git
cd DiscordAIAssistant
```

---

### 2. Add Environment Variables

Create a `.env` file in the root directory of the project. Use the following template for reference:

```env
# .env Template for Discord AI Assistant

## MongoDB connection information
MONGODB_URI=mongodb://devUser:devPassword@mongo:27017/discordBotDB?authSource=discordBotDB
PORT=5000

## Discord and OpenAI API Keys
DISCORD_TOKEN=<your_discord_token>
CHATGPT_API_KEY=<your_openai_api_key>
ASSISTANT_KEY=<your_assistant_key>

## Discord Channel IDs (comma-separated list)
DISCORD_CHANNEL_IDS=<comma_separated_channel_ids>

## MongoDB root credentials for initial setup
MONGO_INITDB_ROOT_USERNAME=devUser
MONGO_INITDB_ROOT_PASSWORD=devPassword
```

### Instructions for `.env`

1. Replace `<your_discord_token>`, `<your_openai_api_key>`, `<your_assistant_key>`, and `<comma_separated_channel_ids>` with the appropriate values.
2. Save this file as `.env` in the root directory of your project.

**Important:** Ensure the `.env` file is added to your `.gitignore` file to keep sensitive information secure.

---

### 3. Install Dependencies

In the project directory, install the required dependencies for the application:

```bash
npm install
```

This ensures that all necessary Node.js packages are installed for the bot and API to function correctly.

---

### 4. Start the Application with Docker

The project is containerized using Docker for easy setup.

#### Step 1: Ensure Docker Desktop is Running

Before running the project, make sure that [Docker Desktop](https://www.docker.com/products/docker-desktop) is open and running on your machine. This is necessary for the containers to start correctly.

#### Step 2: Build and Start Containers

Run the following command to build and start the Docker containers:

```bash
docker-compose up -d --build
```

This will:

- Set up a MongoDB instance and initialize the `discordBotDB` database.
- Start the Node.js API server for handling requests.
- Launch the Discord bot, ready to listen for commands.

#### Step 3: Verify Running Containers

Check the status of the containers to ensure everything is running correctly:

```bash
docker-compose ps
```

You should see the following containers:

- `mongo`
- `discord-api`
- `discord-bot-app`

---

### 5. Viewing Chat History

To view the stored chat history in MongoDB, use the following commands in your terminal:

1. Access the MongoDB container:

   ```bash
   docker exec -it discordaiassistant-mongodb-1 mongosh
   ```

2. Use Admin:

   ```bash
   use admin
   ```

3. Login and Auth:

   ```bash
   db.auth('devUser', 'devPassword')
   ```

4. Switch to the `discordBotDB` database:

   ```bash
   use discordBotDB
   ```

5. Query the `conversations` collection to view chat history:

   ```bash
   db.conversations.find().pretty()
   ```

This will display all stored conversations in a readable format.

---

### 6. Access MongoDB

For debugging or testing purposes, you can access MongoDB using MongoDB Compass or a command-line interface.

- **MongoDB Compass:**  
  Use this connection string to access the database:

  ```bash
  mongodb://devUser:devPassword@localhost:27017/discordBotDB?authSource=discordBotDB
  ```

  Here, you can manage collections such as `conversations`, which store user interactions.

---

### 7. Modify and Rebuild the Application

#### Step 1: Edit Code

- Backend API code is in the `discord-api` folder (e.g., `server.ts`).
- Bot-related logic is in the `discord-bot-app` folder (e.g., `discord_api.ts`, `openai.ts`, etc.).

#### Step 2: Rebuild the Application

After making changes, rebuild and restart the containers to apply the updates:

```bash
docker-compose down -v
docker-compose up -d --build
```

This ensures that all code changes and dependencies are applied cleanly.

#### Step 3: Test Changes

Once the containers are running, you can:

- Interact with the bot on Discord.
- Send API requests to the server running at `http://localhost:5000`.

---

### 8. Troubleshooting

#### Common Issues

- **MongoDB Authentication Errors:** Ensure `.env` credentials match those in the database initialization script.
- **Missing Dependencies:** Always run `npm install` in the project directory after pulling new code to ensure dependencies are up-to-date.
- **API Errors:** Check your `.env` file for accurate values and verify that all required environment variables are set.

#### Checking Logs

Use the following commands to view logs for debugging:

- View All Logs:

  ```bash
  docker-compose logs -f
  ```

- View Logs for a Specific Container:

  ```bash
  docker-compose logs -f <container_name>
  ```

  Replace `<container_name>` with `mongo`, `discord-api`, or `discord-bot-app`.

---

### 9. Shut Down the Project

When you’re done working on the project, stop and remove the containers with:

```bash
docker-compose down
```

This will stop all containers but keep your database volume intact.

---

## Key Features of This Setup

- **Conversation Memory:** User conversations are stored in MongoDB and retrieved during bot interactions for personalized responses.
- **TypeScript Integration:** All components have been rewritten in TypeScript for better compatibility and maintainability.
- **Dockerized Setup:** Simplifies development and deployment by using containerized services.
