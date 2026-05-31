import { useEffect, useState } from "react";
import { Search, Clock, Archive, Download, Inbox, UserCheck } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeSpontaneousApplications, updateSpontaneousDecision } from "@/services/recruitment";

const statusStyles = {
  New: "bg-primary/10 text-primary",
  Reviewed: "bg-emerald-100 text-emerald-700",
  Archived: "bg-muted text-muted-foreground",
  Accepted: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};

const getDownloadFileName = (app) => {
  const rawName = app?.cvFileName || `cv-${app?.candidateName || app?.email || "candidate"}.pdf`;
  return rawName.replace(/[^\w.-]+/g, "_");
};

const downloadCv = async (app) => {
  if (!app?.cvUrl) return;

  const response = await fetch(app.cvUrl);
  if (!response.ok) throw new Error(`Telechargement impossible (${response.status}).`);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = getDownloadFileName(app);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const SpontaneousApps = () => {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => subscribeSpontaneousApplications(setApplications), []);

  const filtered = applications.filter((app) => {
    const haystack = `${app.candidateName} ${app.candidateEmail} ${app.description}`.toLowerCase();
    return (filter === "All" || app.status === filter) && haystack.includes(search.toLowerCase());
  });

  const handleDownload = async (app) => {
    setError("");
    try {
      await downloadCv(app);
    } catch (err) {
      setError(err.message || "Telechargement CV impossible.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateSpontaneousDecision(id, newStatus);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spontaneous Applications</h1>
        <p className="text-sm text-muted-foreground">
          {applications.filter((app) => app.status === "New").length} new • {applications.length} total
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 w-full h-9 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        {["All", "New", "Reviewed", "Accepted", "Rejected", "Archived"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === item ? "bg-primary text-white" : "border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {applications.length === 0 ? (
        <div className="card-premium text-center py-16">
          <Inbox size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-base font-medium text-muted-foreground mb-1">0 new • 0 total</p>
          <p className="text-sm text-muted-foreground">Aucune candidature spontanee pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((app) => (
            <div key={app.id} className="card-premium hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-4">
                <CandidateAvatar name={app.candidateName || app.email} photoUrl={app.candidatePhotoUrl || app.photoUrl} className="w-11 h-11" textClassName="text-sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm">{app.candidateName}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{app.candidateEmail}</span>
                    <select
                      value={app.status}
                      onChange={(event) => handleStatusChange(app.id, event.target.value)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border border-border/50 bg-background cursor-pointer focus:outline-none ${statusStyles[app.status] || ""}`}
                    >
                      <option value="New">New</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{app.description || "Aucun message."}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> {app.appliedDateLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Marquer reviewed"
                    onClick={() => handleStatusChange(app.id, "Reviewed")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <UserCheck size={15} />
                  </button>
                  <button
                    title="Telecharger CV"
                    onClick={() => handleDownload(app)}
                    disabled={!app.cvUrl}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    title="Archiver"
                    onClick={() => handleStatusChange(app.id, "Archived")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground"
                  >
                    <Archive size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">Aucun resultat pour ce filtre.</div>}
        </div>
      )}
    </div>
  );
};

export default SpontaneousApps;
