from datetime import datetime

class Conversation:
    def __init__(self, user_id: str, user_message: str, bot_response: str):
        self.user_id = user_id
        self.user_message = user_message
        self.bot_response = bot_response
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self):
        """Returns a dictionary representation of the conversation for storage."""
        return {
            "user_id": self.user_id,
            "user_message": self.user_message,
            "bot_response": self.bot_response,
            "timestamp": self.timestamp
        }
