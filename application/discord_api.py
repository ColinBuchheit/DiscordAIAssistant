import os
import discord
from discord.ext import commands
from dotenv import load_dotenv
from application.openai import chatgpt_response

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
        except Exception as e:
            print(f"Error: {e}")
            await message.channel.send("Sorry, something went wrong.")

bot.run(os.getenv("DISCORD_TOKEN"))  # Run bot with token
