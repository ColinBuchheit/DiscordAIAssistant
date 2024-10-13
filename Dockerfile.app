# Use Python image for the bot application
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy the application directory into the container
COPY ./application /app/application

# Copy discord_api.py, chat_model.py, conversation.py, and other dependencies
COPY discord_api.py chat_model.py conversation.py requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONPATH="/app"

# Expose necessary ports (optional, only needed for debugging or specific operations)
EXPOSE 8000

# Run the bot
CMD ["python", "discord_api.py"]
