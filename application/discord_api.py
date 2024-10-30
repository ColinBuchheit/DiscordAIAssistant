import discord
import aiohttp
import os
from discord.ext import commands
from dotenv import load_dotenv
from openai import chatgpt_response

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)
API_BASE_URL = "http://api-service:5000/api/v1"

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    response = chatgpt_response(message.content.strip())
    await save_conversation(message.author.id, message.content, response)
    await message.channel.send(response)

async def save_conversation(discord_id, user_message, bot_response):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(f"{API_BASE_URL}/saveConversation", json={
                "discordId": discord_id,
                "userMessage": user_message,
                "botResponse": bot_response
            }) as resp:
                resp.raise_for_status()
        except aiohttp.ClientError as e:
            print(f"Error saving conversation: {e}")

bot.run(os.getenv("DISCORD_TOKEN"))
