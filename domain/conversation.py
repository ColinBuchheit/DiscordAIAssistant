from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field, ValidationError

# Optional: Use Pydantic for data validation and serialization
class PydanticConversation(BaseModel):
    user_id: str
    user_message: str
    bot_response: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        orm_mode = True

class Conversation:
    def __init__(self, user_id: str, user_message: str, bot_response: str) -> None:
        if not user_id or not user_message or not bot_response:
            raise ValueError("All fields are required.")
        self._user_id: str = user_id
        self._user_message: str = user_message
        self._bot_response: str = bot_response
        self._timestamp: str = datetime.utcnow().isoformat()

    @property
    def user_id(self) -> str:
        """Get the user ID (read-only)."""
        return self._user_id

    @property
    def user_message(self) -> str:
        """Get the user message (read-only)."""
        return self._user_message

    @property
    def bot_response(self) -> str:
        """Get the bot response (read-only)."""
        return self._bot_response

    @property
    def timestamp(self) -> str:
        """Get the timestamp of the conversation (read-only)."""
        return self._timestamp

    def to_dict(self) -> Dict[str, str]:
        """Convert Conversation to a dictionary for storage."""
        return {
            "user_id": self.user_id,
            "user_message": self.user_message,
            "bot_response": self.bot_response,
            "timestamp": self.timestamp
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Optional[str]]) -> "Conversation":
        """Create a Conversation instance from a dictionary."""
        instance = cls(
            user_id=data["user_id"],
            user_message=data["user_message"],
            bot_response=data["bot_response"]
        )
        instance._timestamp = data.get("timestamp", datetime.utcnow().isoformat())
        return instance
