import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv('CHATGPT_API_KEY')

def chatgpt_response(prompt: str) -> str:
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.7
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error interacting with GPT: {e}")
        return "Error processing your request."
