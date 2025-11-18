// ChatProvider.js
import React, { createContext, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";

const ChatContext = createContext();

export const ChatProvider = ({ children, apiKey, user, token }) => {
  const chatClient = useRef(null);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (!user?.id || !token || connectionAttempted.current) return;

    const initChat = async () => {
      connectionAttempted.current = true;
      try {
        const client = StreamChat.getInstance(apiKey);

        if (chatClient.current) {
          await chatClient.current.disconnectUser();
        }

        await client.connectUser(
          {
            id: user.id,
            name: user.name || "Anonymous",
            image:
              user.image ||
              `https://getstream.io/random_png/?name=${user.name || "user"}`,
          },
          token
        );

        chatClient.current = client;
      } catch (err) {
        console.error("Chat connection failed:", err);
      }
    };

    initChat();

    return () => {
      if (chatClient.current) {
        chatClient.current.disconnectUser();
      }
    };
  }, [apiKey, user, token]);

  return (
    <ChatContext.Provider value={chatClient.current}>
      {children}
    </ChatContext.Provider>
  );
};