export class ChatRequest {
    message: string;
  
    constructor(message: string) {
      if (!message) {
        throw new Error("Message cannot be empty.");
      }
      this.message = message;
    }
  
    toDict(): { message: string } {
      return { message: this.message };
    }
  }
  
  export class ChatResponse {
    userMessage: string;
    botResponse: string;
  
    constructor(userMessage: string, botResponse: string) {
      if (!userMessage || !botResponse) {
        throw new Error("Both userMessage and botResponse are required.");
      }
      this.userMessage = userMessage;
      this.botResponse = botResponse;
    }
  
    toDict(): { user_message: string; bot_response: string } {
      return {
        user_message: this.userMessage,
        bot_response: this.botResponse
      };
    }
  }
  