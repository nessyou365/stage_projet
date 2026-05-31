import { Bell, CheckCheck, Clock, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

const iconByType = {
  application: Briefcase,
};

const Notifications = () => {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const notificationsQuery = query(
      collection(db, "notifications", "hr", "items"),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      setItems(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
          time:
            typeof doc.data().createdAt?.toDate === "function"
              ? doc.data().createdAt.toDate().toLocaleString("fr-FR")
              : "Maintenant",
        })),
      );
    });
  }, []);

  const unread = items.filter((item) => !item.read).length;
  const filtered = items.filter(
    (item) =>
      filter === "All" ||
      (filter === "Unread" && !item.read) ||
      item.type === filter.toLowerCase(),
  );

  const markAllRead = async () => {
    await Promise.all(items.filter((item) => !item.read).map((item) => updateDoc(item.ref, { read: true })));
  };

  const markRead = async (item) => {
    if (!item.read) {
      await updateDoc(item.ref, { read: true });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} non lu(s)</p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 border border-border/50 px-4 py-2 rounded-xl text-xs hover:bg-muted/50 transition-colors"
        >
          <CheckCheck size={14} /> Tout marquer lu
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["All", "Unread", "Application"].map((filterValue) => (
          <button
            key={filterValue}
            onClick={() => setFilter(filterValue)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === filterValue ? "bg-primary text-white" : "border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
          >
            {filterValue}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card-premium text-center py-16">
          <Bell size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-base font-medium text-muted-foreground mb-1">Aucune notification</p>
          <p className="text-sm text-muted-foreground">Les nouvelles candidatures apparaîtront ici en temps réel.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const Icon = iconByType[item.type] || Bell;
            return (
              <div
                key={item.id}
                onClick={() => markRead(item)}
                className={`card-premium cursor-pointer transition-all hover:shadow-sm ${!item.read ? "bg-primary/[0.02] border-l-2 border-l-primary" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!item.read ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm ${!item.read ? "font-semibold" : "font-medium"}`}>{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock size={10} />
                    {item.time}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">Aucune notification pour ce filtre.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
