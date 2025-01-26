import * as Api from "forkgpt-api-types";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parentId: string | null;
  createdAt: Date;
  userId: string;
  children?: Message[];
}

export function mapMessage(apiMessage: Api.Message): Message {
  return {
    ...apiMessage,
    createdAt: new Date(apiMessage.createdAt),
  };
}

export function buildMessageTree(apiMessages: Api.Message[]): Message[] {
  const messageMap = new Map<string, Message>();
  const rootMessages: Message[] = [];

  // First pass: Create all message objects and store in map
  apiMessages.forEach((apiMsg) => {
    messageMap.set(apiMsg.id, {
      ...mapMessage(apiMsg),
      children: [],
    });
  });

  // Second pass: Build the tree structure
  apiMessages.forEach((apiMsg) => {
    const message = messageMap.get(apiMsg.id)!;
    if (apiMsg.parentId) {
      const parent = messageMap.get(apiMsg.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(message);
      }
    } else {
      rootMessages.push(message);
    }
  });

  return rootMessages;
}
