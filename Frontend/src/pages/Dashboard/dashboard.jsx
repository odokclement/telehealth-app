import React, { useState, useEffect } from "react";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { useNavigate } from "react-router-dom";
import { useStream } from "../../hooks/useStream";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

function Dashboard() {
  const { user, token, Logout } = useStream();
  const [channel, setChannel] = useState(null);
  const [clientReady, setClientReady] = useState(false);
  const navigate = useNavigate();

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: { id: user.id },
  });

  useEffect(() => {
    const setupChannel = async () => {
      if (!chatClient || !user?.id) {
        return;
      }

      try {
        const newChannel = chatClient.channel("messaging", "my_general_chat", {
          name: "General Chat",
          members: [user.id],
        });

        await newChannel.watch();
        setChannel(newChannel);
        setClientReady(true);
      } catch (err) {
        console.error("Error connecting user:", err);
      }
    };

    setupChannel();
  }, [chatClient, user.id]);

  const handleVideoCallClick = () => {
    navigate("/videoCall");
  };

  const handleLogout = async () => {
    await Logout();
    navigate("/login");
  };

  if (!clientReady || !channel) return <div>Loading chat...</div>;

  return (
    <div className="w-full min-h-screen p-2 sm:p-4 bg-gray-100">
      <Chat client={chatClient} theme="str-chat__theme-light">
        <Channel channel={channel}>
          <Window>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2">
              <button
                onClick={handleVideoCallClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm sm:text-base"
              >
                Video Call
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm sm:text-base"
              >
                Logout
              </button>
            </div>

            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}

export default Dashboard;