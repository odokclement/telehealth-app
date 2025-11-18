import React, { useEffect, useState } from "react";
import { StreamVideoClient } from "@stream-io/video-client";
import { StreamVideo, StreamCall } from "@stream-io/video-react-sdk";
import { useNavigate } from "react-router-dom";
import { MyUILayout } from "./MyUiLayout";
import { useStream } from "../hooks/useStream";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

function VideoStream() {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const { user, token } = useStream();
  const navigate = useNavigate();

  useEffect(() => {
    let clientInstance;
    let callInstance;
    let isMounted = true;

    const setup = async () => {
      try {

        console.log("User object for connectUser:", user);

        if (!apiKey || !user || !token) return;
        console.log(token);

        clientInstance = StreamVideoClient.getOrCreateInstance(
          { apiKey },
          {
            user: {
              id: user.id,
              name: user.name || "Anonymous",
              image:
                user.image ||
                `https://getstream.io/random_png/?name=${user.name || "User"}`,
            },
            token,
          }
        );

        const callId = `call_${user.id}_${Date.now()}`;

        callInstance = clientInstance.call("default", callId);

        await callInstance.join({ create: true });

        // Set up error listeners before joining
        callInstance.on("call.ended", () => {
          if (isMounted) {
            setError("Call has ended");
            setTimeout(() => navigate("/dashboard"), 2000);
          }
        });

        callInstance.on("call.failed", (err) => {
          if (isMounted) setError(`Call failed: ${err.message}`);
        });

        callInstance.on("call.session_participant_joined", (participant) => {
          console.log("Participant joined:", participant);
        });

        callInstance.on("call.session_participant_left", (participant) => {
          console.log("Participant left:", participant);
        });
        await callInstance.join({ create: true });
        // await new Promise((res) => setTimeout(res, 1000));
        // await callInstance.camera.enable();

        if (isMounted) {
          setClient(clientInstance);
          setCall(callInstance);
        }
      } catch (err) {
        if (isMounted) setError(`Failed to join call: ${err.message}`);
        console.error("Call setup error:", err);
      }
    };

    setup();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        try {
          if (callInstance) {
            callInstance.off("call.ended");
            callInstance.off("call.failed");
            await callInstance.leave().catch(console.warn);
          }
          if (clientInstance) {
            await clientInstance.disconnectUser().catch(console.warn);
          }
        } catch (err) {
          console.warn("Cleanup error:", err);
        }
      };
      cleanup();
    };
  }, [user, token, navigate]);

  const handleLeaveCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      if (client) {
        await client.disconnectUser();
      }
      navigate("/dashboard");
    } catch (err) {
      console.warn("Leave call error:", err);
      navigate("/dashboard");
    }
  };

  if (!apiKey)
    return <div className="p-4 text-red-600">Missing Stream API Key</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
        {" "}
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>{" "}
          <h2 className="text-xl font-semibold text-white">
            Setting up your call...
          </h2>
          <p className="text-gray-100 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <MyUILayout onLeaveCall={handleLeaveCall} />
        </StreamCall>
      </StreamVideo>
    </div>
  );
}

export default VideoStream;