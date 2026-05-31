import { Mail, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/services/firebase";

const TopBar = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const notificationsQuery = query(
      collection(db, "notifications", "hr", "items"),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadCount(snapshot.docs.filter((docSnap) => !docSnap.data().read).length);
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 flex min-h-[82px] items-center justify-end gap-3 px-8 py-4">
      <button
        type="button"
        onClick={() => navigate("/notifications")}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/74 text-[#071341] shadow-[0_16px_34px_rgba(25,54,105,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        aria-label="Messages"
      >
        <Mail size={20} />
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff5c00] px-1 text-xs font-extrabold text-white">
          {unreadCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => navigate("/settings")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/74 text-[#071341] shadow-[0_16px_34px_rgba(25,54,105,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>
    </header>
  );
};

export default TopBar;
