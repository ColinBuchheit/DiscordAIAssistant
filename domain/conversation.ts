export class Conversation {
    userId: string;
    userMessage: string;
    botResponse: string;
    timestamp: string;
  
    constructor(userId: string, userMessage: string, botResponse: string) {
      if (!userId || !userMessage || !botResponse) {
        throw new Error("All fields are required.");
      }
      this.userId = userId;
      this.userMessage = userMessage;
      this.botResponse = botResponse;
      this.timestamp = new Date().toISOString();
    }
  
    toDict(): { user_id: string; user_message: string; bot_response: string; timestamp: string } {
      return {
        user_id: this.userId,
        user_message: this.userMessage,
        bot_response: this.botResponse,
        timestamp: this.timestamp
      };
    }
  
    static fromDict(data: { user_id: string; user_message: string; bot_response: string }): Conversation {
      return new Conversation(data.user_id, data.user_message, data.bot_response);
    }
  }
  