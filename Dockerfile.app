# Use the official Node.js LTS version
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the project files
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose necessary ports (optional, depending on your app's behavior)
EXPOSE 4000

# Start the bot
CMD ["node", "dist/application/run.js"]
