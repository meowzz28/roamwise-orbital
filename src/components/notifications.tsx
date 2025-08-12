import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  clearNoti,
  Notification as NotificationType,
} from "../services/notificationService";

const Notification = () => {
  const { list, unreadCount } = getNotifications();
  const [showNoti, setShowNoti] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowNoti(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onNotificationClick = (noti: NotificationType) => {
    if (noti.link) navigate(noti.link);
    setShowNoti(false);
    markAsRead(noti);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="relative rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white flex items-center gap-1"
        onClick={() => setShowNoti((prev) => !prev)}
        aria-expanded={showNoti}
      >
        <Bell className="w-5 h-5" />
        <span>Notifications</span>
        <ChevronDown className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 ${
          showNoti ? "" : "hidden"
        }`}
      >
        <div className="p-4">
          <h4 className="text-lg font-bold mb-2">Notifications</h4>
          {list.length === 0 ? (
            <p>No notifications found.</p>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {list.map((noti) => (
                  <li
                    key={noti.id}
                    onClick={() => onNotificationClick(noti)}
                    className="border p-2 rounded cursor-pointer hover:bg-gray-200 transition flex items-start gap-2"
                  >
                    {!noti.read && (
                      <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className={!noti.read ? "font-semibold" : ""}>
                        {noti.message}
                      </p>
                      <small className="text-gray-500">
                        {noti.Time?.seconds
                          ? new Date(noti.Time.seconds * 1000).toLocaleString()
                          : "No timestamp"}
                      </small>
                    </div>
                  </li>
                ))}
              </div>
              <div className="flex justify-between mt-3 px-1 text-center">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark all as read
                </button>
                <button
                  onClick={clearNoti}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
