import os
import subprocess
import time
from dotenv import load_dotenv
from application.discord_api import bot  # Make sure your bot is imported here

load_dotenv()

def gpt_bing_check():
    """ Function to simulate a message to GPT and receive a response """
    print("Checking GPT connection with 'Bing'...")
    try:
        # Assuming chatgpt_response is defined in your openai.py file
        from application.openai import chatgpt_response
        
        # Send "Bing" and expect "Bong"
        response = chatgpt_response("Bing")
        if response.strip().lower() == "bong":
            print("GPT connection verified: Bong received.")
        else:
            print(f"Unexpected GPT response: {response}")
    except Exception as e:
        print(f"Error checking GPT connection: {e}")

def start_bot():
    """ Starts the Discord bot and opens a PowerShell window for logs """
    print("Starting Discord Bot...")
    try:
        gpt_bing_check()  # Check GPT connection first
        bot.run(os.getenv("DISCORD_TOKEN"))
    except Exception as e:
        print(f"Error starting the bot: {e}")

def show_startup_details():
    """ Opens a PowerShell window to show startup details """
    print("Opening PowerShell window for logs...")
    try:
        subprocess.Popen(['powershell.exe'], shell=True)
    except Exception as e:
        print(f"Error opening PowerShell window: {e}")

if __name__ == "__main__":
    show_startup_details()
    start_bot()
