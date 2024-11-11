import os
import discord
from discord.ext import commands
from dotenv import load_dotenv
from application.openai import chatgpt_response
import requests

# Load environment variables
load_dotenv()

# Initialize Discord bot with necessary intents
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return  # Avoid replying to itself

    if message.content:
        try:
            response = chatgpt_response(message.content)  # Call OpenAI logic
            await message.channel.send(response)

            # Save the conversation by calling your API
            api_base_url = os.getenv("API_BASE_URL") #Fetches the base URL of the API from the environment variables.
            if api_base_url: 
                data = { #builds the data type with ID, message, and response
                    "discordId": str(message.author.id),
                    "userMessage": message.content,
                    "botResponse": response,
                }
                headers = {"Content-Type": "application/json"} #sets header type to 
                api_endpoint = f"{api_base_url}/saveConversation" #creates whole url using saveconversation as endpoint

                try:
                    response = requests.post(api_endpoint, json=data, headers=headers) #converts data to json type for storage
                    response.raise_for_status()
                    print("Conversation saved successfully.")
                except requests.exceptions.RequestException as e:
                    print(f"Failed to save conversation: {e}")
        except Exception as e:
            print(f"Error: {e}")
            await message.channel.send("Sorry, something went wrong.")

bot.run(os.getenv("DISCORD_TOKEN"))  # Run bot with token