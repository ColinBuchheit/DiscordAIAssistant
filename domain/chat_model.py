from typing import Dict

# Custom exception for domain-related errors
class DomainError(Exception):
    """Custom exception for domain errors in the domain layer."""
    pass

class ChatRequest:
    def __init__(self, message: str) -> None:
        if not message:
            raise DomainError("Message cannot be empty.")
        self.message: str = message

    def to_dict(self) -> Dict[str, str]:
        """Convert ChatRequest to a dictionary."""
        return {"message": self.message}

class ChatResponse:
    def __init__(self, user_message: str, bot_response: str) -> None:
        if not user_message or not bot_response:
            raise DomainError("Both user_message and bot_response are required.")
        self.user_message: str = user_message
        self.bot_response: str = bot_response

    def to_dict(self) -> Dict[str, str]:
        """Convert ChatResponse to a dictionary."""
        return {
            "user_message": self.user_message,
            "bot_response": self.bot_response
        }
