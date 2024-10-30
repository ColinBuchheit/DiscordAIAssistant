# Dockerfile.app

# Use the official Python 3.9 slim image (change version if needed)
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements.txt and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the bot code into the container
COPY . .

# Run the Discord bot service
CMD ["python", "application/discord_api.py"]
