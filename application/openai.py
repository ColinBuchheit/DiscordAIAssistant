import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set OpenAI API key
openai.api_key = os.getenv('CHATGPT_API_KEY')

def chatgpt_response(prompt: str) -> str:
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",  # Use 'gpt-4' if needed
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=150,
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return "I'm sorry, I couldn't process your request."
