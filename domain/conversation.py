from datetime import datetime

class Conversation:
    def __init__(self, user_id: str, user_message: str, bot_response: str):
        if not user_id or not user_message or not bot_response:
            raise ValueError("All fields are required.")
        self.user_id = user_id
        self.user_message = user_message
        self.bot_response = bot_response
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        """Returns a dictionary representation of the conversation for storage."""
        return {
            "user_id": self.user_id,
            "user_message": self.user_message,
            "bot_response": self.bot_response,
            "timestamp": self.timestamp
        }

    @classmethod
    def from_dict(cls, data: dict):
        """Creates a Conversation instance from a dictionary."""
        return cls(
            user_id=data["user_id"],
            user_message=data["user_message"],
            bot_response=data["bot_response"]
        )
