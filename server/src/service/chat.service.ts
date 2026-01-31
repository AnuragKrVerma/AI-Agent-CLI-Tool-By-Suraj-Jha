import { prisma } from "../lib/prisma";

export class ChatService {
  /**
   * Create a new conversation
   * @param {string} userId
   * @param {string} mode
   * @param {string} title
   */

  async createConversation(
    userId: string,
    mode: string,
    title: string | null = null,
  ) {
    return await prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} Conversation`,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  /**
   * Get or create a conversation for user
   * @param {string} userId
   * @param {string} conversationId
   * @param {string} mode
   */

  async getOrCreateConversation(
    userId: string,
    conversationId = null,
    mode = "chat",
  ) {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
      if (conversation) {
        return conversation;
      }
    }
    return await this.createConversation(userId, mode);
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId
   * @param {string} role
   * @param {string|object} content
   */

  async addMessage(
    conversationId: string,
    role: string,
    content: string | object,
  ) {
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentStr,
      },
    });
  }

  /**
   * Get conversation messages
   * @param {string} conversationId
   */

  async getConversationMessages(conversationId: string) {
    const message = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return message.map((msg: any) => ({
      ...msg,
      content: this.parseContent(msg.content),
    }));
  }

  /**
   * Get all conversations for a user
   * @param {string} userId
   */

  async getUserConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  /**
   * Delete a conversation
   * @param {string} conversationId
   * @param {string} userId
   */

  async deleteConversation(conversationId: string, userId: string) {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  /**
   * Update conversation title
   * @param {string} conversationId
   * @param {string} title
   */

  async updateConversationTitle(conversationId: string, title: string) {
    return await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        title,
      },
    });
  }

  /**
   * Parse content string back to original format
   * @param {string} content
   */

  private parseContent(content: string) {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  /**
   * Format messages for AI model
   * @param {Array} messages
   */

  formatMessagesForAI(messages: any[]) {
    return messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));
  }
}
