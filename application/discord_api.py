import os
import requests
import discord
from discord.ext import commands
from application.openai import chatgpt_response  # Import the GPT logic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up intents for your bot
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True  # Required for reading message content in newer versions

# Set up bot command prefix and intents
bot = commands.Bot(command_prefix="!", intents=intents)

# List of target channels to monitor for GPT interactions
TARGET_CHANNEL_IDS = [1234567890, 9876543210]  # Replace with your actual channel IDs

# REST API Base URL
API_BASE_URL = "http://localhost:5001/api"

# Function to save a conversation via the REST API
def save_conversation(discord_id, user_message, bot_response):
    url = f"{API_BASE_URL}/saveConversation"
    data = {
        "discordId": discord_id,
        "userMessage": user_message,
        "botResponse": bot_response
    }
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.RequestException as e:
        print(f"Error saving conversation: {e}")
TARGET_CHANNEL_IDS = [1290814086246039652, 1290814307541712906]  # Replace with actual channel ID


@bot.command(name='ask')
async def ask_gpt(ctx, *, question):
    try:
        # Assuming you're using a function like chatgpt_response to get the response from GPT
        response = chatgpt_response(question)

        # Insert into MongoDB before sending the response back to the user
        try:
            collection.insert_one({"prompt": question, "response": response})
        except Exception as e:
            print(f"Database error: {e}")
            await ctx.send("Error processing your request.")
            return  # Stop here since we couldn't log the request

        # Send the response back to the user
        await ctx.send(response)

    except Exception as e:
        # Catch any error while getting response from GPT or sending message to Discord
        print(f"Error generating response: {e}")
        await ctx.send("Sorry, I encountered an error while processing your request.")



@bot.event
async def on_message(message):
    if message.channel.id not in TARGET_CHANNEL_IDS:
        return
    if message.author == bot.user:
        return

    user_message = message.content.strip()

    if user_message.lower() == 'bing':
        bot_response = "Bong"
        await message.channel.send(bot_response)

    # Call GPT to get a response
    bot_response = chatgpt_response(user_message)
    
    # Save the conversation via the REST API
    save_conversation(str(message.author.id), user_message, bot_response)
    
    # Send the GPT response back to the channel
    await message.channel.send(f"Answer: {bot_response}")



@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')


# Additional command for starting a conversation directly via a command (if necessary)
@bot.command(name='startchat')
async def start_chat(ctx):
    await ctx.send("Let's start chatting! Feel free to ask me anything.")

# Run the bot with the token from the .env file
bot.run(os.getenv("DISCORD_TOKEN"))
