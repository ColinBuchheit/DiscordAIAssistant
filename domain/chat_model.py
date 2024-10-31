class ChatRequest:
    def __init__(self, message: str):
        if not message:
            raise ValueError("Message cannot be empty.")
        self.message = message

    def to_dict(self) -> dict:
        return {"message": self.message}

class ChatResponse:
    def __init__(self, user_message: str, bot_response: str):
        if not user_message or not bot_response:
            raise ValueError("Both user_message and bot_response are required.")
        self.user_message = user_message
        self.bot_response = bot_response

    def to_dict(self) -> dict:
        return {
            "user_message": self.user_message,
            "bot_response": self.bot_response
        }
