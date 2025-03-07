import { UserWithId } from "@/firebase/users";
import { ConversationWithId, MessageWithId } from "@/firebase/conversations";

// Extended types for UI components
export interface ConversationItemProps {
  conversation: ConversationWithId;
  isActive: boolean;
  onClick: () => void;
}

export interface ConversationListProps {
  conversations: ConversationWithId[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export interface MessageItemProps {
  message: MessageWithId;
  isSender: boolean;
  showTimestamp: boolean;
}

export interface ConversationHeaderProps {
  conversation: ConversationWithId;
  otherUser: UserWithId | null;
  onBackClick?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export interface MessageInputProps {
  conversationId: string;
  receiverId: string;
  disabled?: boolean;
  placeholder?: string;
  onMessageSent?: () => void;
}

export interface ConversationFilterOptions {
  status?: string[];
  itemType?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  onlyUnread?: boolean;
}

// Types for analytics and reporting
export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  cancelledConversations: number;
  averageResponseTime: number; // in milliseconds
  averageConversationLength: number; // number of messages
  conversionRate: number; // percentage of conversations that lead to completed transactions
}

// Types for conversation actions
export interface ConversationAction {
  type: "message" | "statusChange" | "userJoined" | "userLeft";
  userId: string;
  timestamp: number;
  details?: any;
}

// Type for managing conversation participants
export interface ConversationParticipant {
  userId: string;
  role: "buyer" | "seller" | "admin" | "support";
  joinedAt: number;
  leftAt?: number;
  isActive: boolean;
}

// Interface for conversation search results
export interface ConversationSearchResult {
  conversation: ConversationWithId;
  relevanceScore: number;
  matchingMessages: MessageWithId[];
  highlightedText?: string[];
}
