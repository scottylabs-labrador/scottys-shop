import React, { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  sending: boolean;
  isActive: boolean;
  onChangeMessage: (message: string) => void;
  onSendMessage: (e: FormEvent) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  sending,
  isActive,
  onChangeMessage,
  onSendMessage,
}) => {
  return (
    <form onSubmit={onSendMessage} className="mt-4 flex gap-2">
      <Input
        value={newMessage}
        onChange={(e) => onChangeMessage(e.target.value)}
        placeholder={
          isActive
            ? "Type your message..."
            : "This conversation is no longer active"
        }
        className="flex-1"
        disabled={sending || !isActive}
      />
      <Button
        type="submit"
        disabled={sending || !newMessage.trim() || !isActive}
      >
        {sending ? (
          <span className="animate-pulse">Sending...</span>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};

export default MessageInput;
