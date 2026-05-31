import { User, Shield, Bell, Key, LogOut, Save, X, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Settings = () => {
  const { userName, userEmail, userDept, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [formData, setFormData] = useState({
    name: userName || "Admin User",
    email: userEmail || "admin@hireq.com",
    dept: userDept || "Human Resources",
  });
  const [notifStates, setNotifStates] = useState({ apps: true, ai: true, interviews: true, digest: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ name: formData.name, email: formData.email, dept: formData.dept });
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setFormData({ name: userName || "Admin User", email: userEmail || "admin@hireq.com", dept: userDept || "Human Resources" });
    setEditMode(false);
  };

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérer votre compte et vos préférences</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <Save size={14} /> Profil mis à jour avec succès
        </div>
      )}

      {/* Profile */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-primary" />
          <h3 className="text-base font-semibold">Profil</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {(formData.name || "A")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{formData.name || "Admin User"}</h3>
            <p className="text-xs text-muted-foreground">HR Manager • HireQ</p>
          </div>
          {!editMode ? (
            <button onClick={() => setEditMode(true)}
              className="border border-border/50 px-3 py-1.5 rounded-xl text-xs hover:bg-muted/50 transition-colors flex items-center gap-1.5">
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel}
                className="border border-border/50 px-3 py-1.5 rounded-xl text-xs hover:bg-muted/50 transition-colors flex items-center gap-1.5">
                <X size={12} /> Annuler
              </button>
              <button onClick={handleSave}
                className="btn-primary-gradient !py-1.5 !px-3 !rounded-xl text-xs flex items-center gap-1.5">
                <Save size={12} /> Sauvegarder
              </button>
            </div>
          )}
        </div>
        <div className="h-px bg-border/50 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nom complet", key: "name", placeholder: "Jean Dupont" },
            { label: "Email", key: "email", placeholder: "admin@hireq.com", type: "email" },
            { label: "Rôle", key: "role", value: "HR Manager", disabled: true },
            { label: "Département", key: "dept", placeholder: "Human Resources" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
              <input
                type={f.type || "text"}
                value={f.disabled ? (f.value || "HR Manager") : (formData[f.key] || "")}
                onChange={e => !f.disabled && setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                disabled={f.disabled || !editMode}
                placeholder={f.placeholder}
                className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4">
          {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
          <h3 className="text-base font-semibold">Apparence</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Mode sombre</p>
            <p className="text-xs text-muted-foreground">Basculer entre le thème clair et sombre</p>
          </div>
          <button onClick={toggleDark}
            className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${darkMode ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4"><Bell size={18} className="text-primary" /><h3 className="text-base font-semibold">Notifications</h3></div>
        <div className="space-y-4">
          {[
            { key: "apps", label: "Nouvelles candidatures", desc: "Notifié quand des candidats postulent" },
            { key: "ai", label: "Analyse IA complète", desc: "Quand l'IA termine une analyse" },
            { key: "interviews", label: "Entretien complété", desc: "Quand un candidat termine un entretien" },
            { key: "digest", label: "Digest hebdomadaire", desc: "Résumé hebdomadaire de l'activité" },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <button onClick={() => setNotifStates(s => ({ ...s, [n.key]: !s[n.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifStates[n.key] ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifStates[n.key] ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4"><Shield size={18} className="text-primary" /><h3 className="text-base font-semibold">Sécurité</h3></div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Authentification à deux facteurs</p>
            <p className="text-xs text-muted-foreground">Sécurité supplémentaire pour votre compte</p>
          </div>
          <button className="relative w-11 h-6 bg-muted rounded-full">
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
          </button>
        </div>
        <button className="flex items-center gap-2 border border-border/50 px-4 py-2 rounded-xl text-xs hover:bg-muted/50 transition-colors">
          <Key size={14} /> Changer le mot de passe
        </button>
      </div>

      <button onClick={() => { logout(); navigate("/"); }}
        className="flex items-center gap-2 border border-destructive text-destructive hover:bg-destructive/10 px-4 py-2.5 rounded-xl text-sm transition-colors">
        <LogOut size={16} /> Se déconnecter
      </button>
    </div>
  );
};
export default Settings;
