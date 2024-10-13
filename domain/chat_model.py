class ChatRequest:
    def __init__(self, message: str):
        self.message = message

class ChatResponse:
    def __init__(self, user_message: str, bot_response: str):
        self.user_message = user_message
        self.bot_response = bot_response
