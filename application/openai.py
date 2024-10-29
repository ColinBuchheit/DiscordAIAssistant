import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv('CHATGPT_API_KEY')

def chatgpt_response(prompt: str) -> str:
    try:
        print(f"Prompt: {prompt}")
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.7
        )
        print(f"Response from OpenAI: {response}")
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error: {e}")
        return "Error processing your request."