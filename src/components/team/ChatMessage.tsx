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
      className={`flex ${
        isSentByCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`rounded-lg px-4 py-2 max-w-xs break-words ${
          isSentByCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        {/* Display avatar initial, sender name, and timestamp */}
        <div className="d-flex align-items-center">
          <div className="bg-light rounded-circle p-2 me-2 text-primary fw-bold">
            {(user_name?.charAt(0) || "?").toUpperCase()}{" "}
          </div>
          <span>{user_name}</span>
          <div className="text-end text-xs ml-2"> {timeString}</div>
        </div>
        {text}
      </div>
    </div>
  );
}
export default ChatMessage;
