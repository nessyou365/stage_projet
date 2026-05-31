import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, LogOut, Upload, Send, Briefcase, Bell, User,
  Moon, Sun, CheckCircle, Clock, XCircle, ChevronRight,
  Brain, FileText, MapPin, Building2
} from "lucide-react";
import GradientOrb from "@/components/GradientOrb";

const DEMO_JOBS = [
  { id: 1, title: "Senior Frontend Developer", dept: "Engineering", location: "Paris / Remote", type: "Full-time", skills: ["React", "TypeScript", "Next.js"], posted: "il y a 2j" },
  { id: 2, title: "Product Designer", dept: "Design", location: "Remote", type: "Full-time", skills: ["Figma", "UI/UX"], posted: "il y a 5j" },
  { id: 3, title: "Data Engineer", dept: "Data", location: "Lyon", type: "Full-time", skills: ["Python", "SQL", "Spark"], posted: "il y a 1 sem" },
];

const DEMO_NOTIFS = [
  { id: 1, title: "Candidature reçue", message: "Votre candidature pour Senior Frontend Developer a été reçue.", time: "à l'instant", status: "info", read: false },
];

const CandidateHome = () => {
  const { userName, userEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState("home"); // home | jobs | spontaneous | notifications | profile
  const [selectedJob, setSelectedJob] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [spontForm, setSpontForm] = useState({ email: "", cv: null, description: "" });
  const [spontSent, setSpontSent] = useState(false);
  const [applications, setApplications] = useState([]);
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);
  const [submitMsg, setSubmitMsg] = useState("");

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleApply = (jobId) => {
    if (!cvFile) { setSubmitMsg("Veuillez uploader votre CV."); return; }
    const job = DEMO_JOBS.find(j => j.id === jobId);
    const newApp = {
      id: Date.now(), jobId, title: job.title, dept: job.dept,
      status: "En attente", date: new Date().toLocaleDateString("fr-FR"), cv: cvFile.name
    };
    setApplications(prev => [...prev, newApp]);
    const notif = { id: Date.now(), title: "Candidature envoyée", message: `Votre candidature pour ${job.title} a été reçue.`, time: "à l'instant", status: "info", read: false };
    setNotifs(prev => [notif, ...prev]);
    setCvFile(null); setCvUploaded(false); setSelectedJob(null); setSubmitMsg("");
    setTab("home");
  };

  const handleSpontSubmit = () => {
    if (!spontForm.email || !spontForm.cv || !spontForm.description) {
      setSubmitMsg("Veuillez remplir tous les champs requis.");
      return;
    }
    setSpontSent(true);
    const notif = { id: Date.now(), title: "Candidature spontanée envoyée", message: "Votre candidature spontanée a bien été transmise à l'équipe RH.", time: "à l'instant", status: "success", read: false };
    setNotifs(prev => [notif, ...prev]);
  };

  const statusIcon = (s) => {
    if (s === "En attente") return <Clock size={14} className="text-amber-500" />;
    if (s === "Accepté") return <CheckCircle size={14} className="text-emerald-500" />;
    if (s === "Rejeté") return <XCircle size={14} className="text-red-500" />;
    return null;
  };
  const statusColor = (s) => {
    if (s === "En attente") return "bg-amber-100 text-amber-700";
    if (s === "Accepté") return "bg-emerald-100 text-emerald-700";
    if (s === "Rejeté") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold gradient-text text-lg">HireQ</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDark} className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setTab("notifications")} className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors relative">
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">

        {/* HOME TAB */}
        {tab === "home" && (
          <div className="p-5 space-y-6 relative">
            <GradientOrb className="w-64 h-64 -top-20 -right-20 opacity-20" color="primary" />
            <div>
              <h2 className="text-xl font-bold">Bonjour, <span className="gradient-text">{userName || "Candidat"}</span> 👋</h2>
              <p className="text-sm text-muted-foreground mt-1">Bienvenue sur votre espace recrutement IA</p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTab("jobs")}
                className="card-premium text-left p-4 hover:shadow-md transition-all group">
                <Briefcase size={22} className="text-primary mb-2" />
                <p className="text-sm font-semibold">Offres d'emploi</p>
                <p className="text-xs text-muted-foreground">{DEMO_JOBS.length} postes disponibles</p>
              </button>
              <button onClick={() => setTab("spontaneous")}
                className="card-premium text-left p-4 hover:shadow-md transition-all">
                <Send size={22} className="text-accent mb-2" />
                <p className="text-sm font-semibold">Candidature spontanée</p>
                <p className="text-xs text-muted-foreground">Envoyez votre profil</p>
              </button>
            </div>

            {/* My applications */}
            <div>
              <h3 className="text-base font-semibold mb-3">Mes candidatures</h3>
              {applications.length === 0 ? (
                <div className="card-premium text-center py-8">
                  <FileText size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune candidature pour le moment</p>
                  <button onClick={() => setTab("jobs")} className="mt-3 text-primary text-sm font-medium">Voir les offres →</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map(app => (
                    <div key={app.id} className="card-premium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Briefcase size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{app.title}</p>
                          <p className="text-xs text-muted-foreground">{app.dept} • {app.date}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(app.status)}
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(app.status)}`}>{app.status}</span>
                        </div>
                      </div>
                      {app.status === "Rejeté" && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Brain size={14} className="text-red-500" />
                            <span className="text-xs font-semibold text-red-600">Feedback IA</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Votre profil ne correspond pas aux critères requis (React 5+ ans, TypeScript avancé). Nous vous recommandons de renforcer votre expérience sur ces technologies.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {tab === "jobs" && !selectedJob && (
          <div className="p-5 space-y-4">
            <h2 className="text-xl font-bold">Offres disponibles</h2>
            <div className="space-y-3">
              {DEMO_JOBS.map(job => (
                <div key={job.id} className="card-premium hover:shadow-md transition-all cursor-pointer"
                  onClick={() => { setSelectedJob(job); setCvFile(null); setCvUploaded(false); setSubmitMsg(""); }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{job.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><Building2 size={11} />{job.dept}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {job.skills.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">{s}</span>)}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground shrink-0 mt-1" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{job.posted}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JOB DETAIL & APPLY */}
        {tab === "jobs" && selectedJob && (
          <div className="p-5 space-y-4">
            <button onClick={() => setSelectedJob(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Retour</button>
            <div className="card-premium">
              <h2 className="text-lg font-bold mb-1">{selectedJob.title}</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Building2 size={11} />{selectedJob.dept}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{selectedJob.location}</span>
                <span>{selectedJob.type}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedJob.skills.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>)}
              </div>
              <div className="h-px bg-border/50 mb-4" />
              <h3 className="text-sm font-semibold mb-2">Postuler à cette offre</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CV (PDF / DOCX) *</label>
                  <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all ${cvUploaded ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-primary/50"}`}>
                    <Upload size={18} className={cvUploaded ? "text-emerald-500" : "text-muted-foreground"} />
                    <span className="text-sm text-muted-foreground">{cvUploaded ? cvFile.name : "Uploader votre CV"}</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                      onChange={e => { if (e.target.files[0]) { setCvFile(e.target.files[0]); setCvUploaded(true); } }} />
                  </label>
                </div>
                {submitMsg && <p className="text-xs text-destructive">{submitMsg}</p>}
                <button onClick={() => handleApply(selectedJob.id)}
                  className="btn-primary-gradient w-full flex items-center justify-center gap-2">
                  <Send size={16} /> Envoyer ma candidature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SPONTANEOUS TAB */}
        {tab === "spontaneous" && (
          <div className="p-5 space-y-4">
            <h2 className="text-xl font-bold">Candidature spontanée</h2>
            {spontSent ? (
              <div className="card-premium text-center py-10">
                <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Candidature envoyée !</h3>
                <p className="text-sm text-muted-foreground">L'équipe RH a bien reçu votre candidature et vous contactera prochainement.</p>
                <button onClick={() => { setSpontSent(false); setSpontForm({ email: "", cv: null, description: "" }); setTab("home"); }}
                  className="mt-4 text-primary text-sm font-medium">Retour à l'accueil →</button>
              </div>
            ) : (
              <div className="card-premium space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email entreprise *</label>
                  <input type="email" placeholder="rh@entreprise.com" value={spontForm.email}
                    onChange={e => setSpontForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CV (PDF / DOCX) *</label>
                  <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all ${spontForm.cv ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-primary/50"}`}>
                    <Upload size={18} className={spontForm.cv ? "text-emerald-500" : "text-muted-foreground"} />
                    <span className="text-sm text-muted-foreground">{spontForm.cv ? spontForm.cv.name : "Uploader votre CV"}</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                      onChange={e => { if (e.target.files[0]) setSpontForm(f => ({ ...f, cv: e.target.files[0] })); }} />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message de motivation *</label>
                  <textarea rows={4} placeholder="Présentez-vous et exprimez votre motivation..." value={spontForm.description}
                    onChange={e => setSpontForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" />
                </div>
                {submitMsg && <p className="text-xs text-destructive">{submitMsg}</p>}
                <button onClick={handleSpontSubmit} className="btn-primary-gradient w-full flex items-center justify-center gap-2">
                  <Send size={16} /> Envoyer ma candidature
                </button>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === "notifications" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Notifications</h2>
              <button onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
                className="text-xs text-primary font-medium">Tout lire</button>
            </div>
            {notifs.length === 0 ? (
              <div className="card-premium text-center py-10">
                <Bell size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifs.map(n => (
                  <div key={n.id}
                    className={`card-premium cursor-pointer ${!n.read ? "border-l-2 border-l-primary bg-primary/[0.02]" : ""}`}
                    onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                        <Bell size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="p-5 space-y-4">
            <h2 className="text-xl font-bold">Mon profil</h2>
            <div className="card-premium text-center py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-3">
                {(userName || "C")[0].toUpperCase()}
              </div>
              <h3 className="font-semibold text-lg">{userName || "Candidat"}</h3>
              <p className="text-sm text-muted-foreground">{userEmail || "email@example.com"}</p>
            </div>
            <div className="card-premium space-y-3">
              <p className="text-sm font-semibold">Statistiques</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-xl font-bold text-primary">{applications.length}</p>
                  <p className="text-xs text-muted-foreground">Candidatures</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-xl font-bold text-emerald-500">{applications.filter(a => a.status === "En attente").length}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </div>
            <button onClick={() => { logout(); }}
              className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive hover:bg-destructive/10 py-3 rounded-xl text-sm transition-colors">
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border/50 bg-background/90 backdrop-blur-xl px-4 py-2 z-50">
        <div className="flex items-center justify-around">
          {[
            { id: "home", icon: Sparkles, label: "Accueil" },
            { id: "jobs", icon: Briefcase, label: "Offres" },
            { id: "spontaneous", icon: Send, label: "Spontané" },
            { id: "notifications", icon: Bell, label: "Notifs", badge: unreadCount },
            { id: "profile", icon: User, label: "Profil" },
          ].map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSelectedJob(null); setSubmitMsg(""); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 relative transition-all ${tab === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <item.icon size={20} className={tab === item.id ? "fill-primary/10" : ""} />
              {item.badge > 0 && <span className="absolute -top-0.5 right-2 w-2 h-2 bg-destructive rounded-full" />}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
export default CandidateHome;
