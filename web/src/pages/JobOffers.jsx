import { useEffect, useState } from "react";
import { Plus, Search, MapPin, Clock, Users, Edit2, Trash2, X, Save, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { removeJob, saveJob, subscribeJobs } from "@/services/recruitment";

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Finance", "Data", "Infrastructure", "Sales", "HR", "Product", "Research"];
const LOCATIONS = ["Paris", "Remote", "Lyon", "Bordeaux", "Londres", "Berlin", "Casablanca", "Autre"];
const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"];

const statusStyles = {
  Published: "bg-emerald-100 text-emerald-700",
  Draft: "bg-amber-100 text-amber-700",
  Closed: "bg-muted text-muted-foreground",
};

const emptyForm = {
  title: "",
  department: "",
  location: "",
  type: "Full-time",
  salaryMin: "",
  salaryMax: "",
  skills: [],
  newSkill: "",
  description: "",
  status: "Published",
};

const JobOffers = () => {
  const auth = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => subscribeJobs(setJobs), []);

  const filtered = jobs.filter(
    (job) =>
      (filter === "All" || job.status === filter) &&
      (job.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleAddSkill = () => {
    const skill = form.newSkill.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, skill], newSkill: "" }));
    }
  };

  const handleRemoveSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((item) => item !== skill) }));
  };

  const handleSave = async () => {
    if (!form.title || !form.department || !form.location) return;
    await saveJob({ ...form, id: editingId }, auth);
    resetForm();
  };

  const handleEdit = (job) => {
    setForm({
      ...job,
      newSkill: "",
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      skills: job.skills || [],
    });
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await removeJob(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offres d'emploi</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} positions • {jobs.filter((job) => job.status === "Published").length} actives •{" "}
            {jobs.reduce((count, job) => count + Number(job.applicants || 0), 0)} candidatures
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="btn-primary-gradient flex items-center gap-2 !py-2.5 !px-4 !rounded-xl text-sm"
        >
          <Plus size={16} /> Nouvelle offre
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h2 className="text-base font-semibold">{editingId ? "Modifier l'offre" : "Nouvelle offre"}</h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Titre du poste *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="ex: Senior Frontend Developer"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Département *</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {DEPARTMENTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Localisation *</label>
                  <select
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {LOCATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de contrat</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    {JOB_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fourchette salariale</label>
                <div className="flex items-center gap-2">
                  <input
                    value={form.salaryMin}
                    onChange={(e) => setForm((prev) => ({ ...prev, salaryMin: e.target.value }))}
                    placeholder="Min"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    value={form.salaryMax}
                    onChange={(e) => setForm((prev) => ({ ...prev, salaryMax: e.target.value }))}
                    placeholder="Max"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compétences requises</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={form.newSkill}
                    onChange={(e) => setForm((prev) => ({ ...prev, newSkill: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    placeholder="Ajouter une compétence..."
                    className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <button onClick={handleAddSkill} className="btn-primary-gradient !py-2 !px-4 !rounded-xl text-sm">
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description du poste</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez les responsabilités, le profil recherché, les avantages..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
              </div>
              {(!form.title || !form.department || !form.location) && (
                <p className="text-xs text-destructive">* Les champs titre, département et localisation sont obligatoires.</p>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={resetForm} className="flex-1 border border-border/50 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title || !form.department || !form.location}
                  className="flex-1 btn-primary-gradient !py-2.5 !rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} /> {editingId ? "Enregistrer" : "Créer l'offre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            placeholder="Rechercher des offres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full h-9 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        {["All", "Published", "Draft", "Closed"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === item ? "bg-primary text-white" : "border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="card-premium text-center py-16">
          <Briefcase size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-base font-medium text-muted-foreground mb-1">Aucune offre d'emploi</p>
          <p className="text-sm text-muted-foreground mb-4">Créez votre première offre pour commencer</p>
          <button
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }}
            className="btn-primary-gradient inline-flex items-center gap-2 !py-2.5 !px-4 !rounded-xl text-sm"
          >
            <Plus size={16} /> Créer une offre
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <div key={job.id} className="card-premium hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{job.title}</h3>
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${statusStyles[job.status]}`}>{job.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                    <span>{job.department}</span>
                    <span>{job.type}</span>
                    {(job.salaryMin || job.salaryMax) && <span className="font-medium text-foreground">{job.salaryMin}-{job.salaryMax} EUR/an</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(job.skills || []).map((skill) => (
                      <span key={skill} className="text-[10px] px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground font-normal">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-sm mb-1">
                    <Users size={14} className="text-muted-foreground" />
                    <span className="font-semibold">{job.applicants || 0}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} />{job.createdAt?.toDate?.().toLocaleDateString("fr-FR") || "Aujourd'hui"}</p>
                  <div className="flex items-center gap-1 mt-3">
                    <button onClick={() => handleEdit(job)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {job.description && <p className="mt-3 text-xs text-muted-foreground line-clamp-2 border-t border-border/30 pt-3">{job.description}</p>}
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">Aucune offre trouvée pour ce filtre.</div>}
        </div>
      )}
    </div>
  );
};

export default JobOffers;
