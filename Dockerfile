# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the Node.js dependencies
RUN npm install

# Copy the remaining application code to the container
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port your API will run on
EXPOSE 5000

# Run the compiled API server
CMD ["node", "dist/application/server.js"]
