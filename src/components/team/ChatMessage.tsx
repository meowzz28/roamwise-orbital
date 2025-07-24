import { auth } from "../firebase";

type Message = {
  id: string;
  text: string;
  uid: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  createdBy: string;
  user_name: string;
};

function ChatMessage({ message }: { message: Message }) {
  const { text, createdBy, user_name, createdAt } = message;
  const currentUser = auth.currentUser;
  const isSentByCurrentUser = currentUser?.uid === createdBy;

  const timeString = createdAt
    ? new Date(createdAt.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`flex px-4 mb-4 ${
        isSentByCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex flex-col max-w-[75%] text-sm ${
          isSentByCurrentUser ? "items-end" : "items-start"
        }`}
      >
        {!isSentByCurrentUser && (
          <div className="flex items-center mb-1">
            <div className="bg-gray-300 text-gray-700 font-semibold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-2">
              {(user_name?.charAt(0) || "?").toUpperCase()}
            </div>
            <span className="text-xs text-gray-700 font-medium">
              {user_name}
            </span>
          </div>
        )}

        <div
          className={`rounded-xl px-4 py-2 shadow-md whitespace-pre-line text-base ${
            isSentByCurrentUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-100 text-gray-900 rounded-bl-none"
          }`}
        >
          {text}
        </div>

        <span className="text-[11px] text-gray-400 mt-1">{timeString}</span>
      </div>
    </div>
  );
}

export default ChatMessage;
