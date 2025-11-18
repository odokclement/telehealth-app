
import {
  useCall,
  useCallStateHooks,
  CallingState,
  CallControls,
  SpeakerLayout,
  StreamTheme,
} from "@stream-io/video-react-sdk";

export function MyUILayout({ onLeaveCall }) {
  const call = useCall();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const getLayout = () => {
    if (participantCount <= 2) {
      return <SpeakerLayout participantsBarPosition="bottom" />;
    } else if (participantCount <= 4) {
      return <SpeakerLayout participantsBarPosition="right" />;
    } else {
      return <PaginatedGridLayout groupSize={participantCount <= 9 ? 9 : 16} />;
    }
  };

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <h2 className="text-xl font-medium">
          {callingState === CallingState.JOINING
            ? "Joining call..."
            : "Loading..."}
        </h2>
        <p className="text-gray-400 mt-2">
          {participantCount > 0
            ? `${participantCount} participant${
                participantCount > 1 ? "s" : ""
              } in call`
            : "Connecting..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white gap-5">
      {/* HEADER */}
      <div className="bg-gray-800 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
          <p className="flex items-center gap-3">
            <span className="font-medium">Call:</span>{" "}
            <span className="text-blue-500">{call.id}</span>
          </p>
        </div>
      </div>
      {/* CALL */}
      <StreamTheme className="px-5 h-full w-full flex flex-col items-center justify-center">
        <div className="">{getLayout()}</div>

        <CallControls onLeave={onLeaveCall} />
      </StreamTheme>
    </div>
  );
}