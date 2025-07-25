import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";

type Notifications = {
  id: string;
  userId: string;
  trigger: string;
  message: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
  read: boolean;
  link: string;
};

const Notification = () => {
  const [list, setList] = useState<Notifications[]>([]);
  const shownNotiIds = useRef<Set<string>>(new Set());
  const onlineSince = useRef<number>(0);
  const [showNoti, setShowNoti] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [justMarkedAsRead, setJustMarkedAsRead] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navigate = useNavigate();

  // Fetch user's noti
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onlineSince.current = Date.now();
        unsubscribe = fetchNotiList(user.uid);
      } else {
        // Clear state on logout
        setList([]);
        setUnreadCount(0);
        setShowNoti(false);
        shownNotiIds.current.clear();
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Retrieve list of teams user belongs to
  const fetchNotiList = (uid: string) => {
    const queries = query(
      collection(db, "Notifications"),
      where("userId", "==", uid),
      orderBy("Time", "desc")
    );

    const unsubscribe = onSnapshot(queries, (querySnapshot) => {
      const notiData: Notifications[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const noti: Notifications = {
          id: doc.id,
          userId: data.userId,
          trigger: data.trigger,
          message: data.message,
          Time: data.Time,
          read: data.read,
          link: data.link,
        };

        // Only toast if it's new
        //(created after user came online & never shown before)
        const createdAtMillis = noti.Time?.seconds
          ? noti.Time.seconds * 1000
          : 0;
        if (
          createdAtMillis > (onlineSince.current ?? 0) &&
          !shownNotiIds.current.has(noti.id)
        ) {
          toast.info(`🔔 ${noti.message}`, {
            position: "top-right",
            autoClose: 5000,
          });
          shownNotiIds.current.add(noti.id);
        }

        notiData.push(noti);
      });

      setList(notiData);
      setUnreadCount(notiData.filter((n) => !n.read).length);
    });

    return unsubscribe;
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotis = list.filter((noti) => !noti.read);
      const updatePromises = unreadNotis.map((noti) =>
        updateDoc(doc(db, "Notifications", noti.id), {
          read: true,
        })
      );
      const updatedList = list.map((noti) =>
        noti.read ? noti : { ...noti, read: true }
      );
      setList(updatedList);
      setUnreadCount(0);
      setJustMarkedAsRead(true);

      await Promise.all(updatePromises);
      setTimeout(() => setJustMarkedAsRead(false), 1000);
      toast.success("All notifications marked as read", {
        position: "bottom-center",
      });
    } catch (err) {
      toast.error("Failed to mark all as read", {
        position: "bottom-center",
      });
    }
  };

  const markAsRead = async (noti: Notifications) => {
    if (noti.link) {
      navigate(noti.link);
    }
    setShowNoti(false);
    if (!noti.read) {
      try {
        await updateDoc(doc(db, "Notifications", noti.id), {
          read: true,
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
  };

  const clearNoti = async () => {
    try {
      const daletePromises = list.map((noti) =>
        deleteDoc(doc(db, "Notifications", noti.id))
      );

      setList([]);
      setUnreadCount(0);
      setJustMarkedAsRead(true);

      await Promise.all(daletePromises);
      setTimeout(() => setJustMarkedAsRead(false), 1000);
      toast.success("All notifications are cleared", {
        position: "bottom-center",
      });
    } catch (err) {
      toast.error("Failed to clear all notification", {
        position: "bottom-center",
      });
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="relative rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white flex items-center gap-1"
        onClick={() => setShowNoti((prev) => !prev)}
        role="button"
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
            <div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {list.map((noti) => (
                  <li
                    key={noti.id}
                    onClick={() => markAsRead(noti)}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
