import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import hireqBackground from "@/assets/hireq-login-background.png";
import { useAuth } from "@/contexts/AuthContext";

const featureDetails = [
  {
    title: "Candidatures centralisees",
    text: "Gerez toutes vos candidatures en un seul endroit.",
    icon: UsersRound,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Matching IA precis",
    text: "Trouvez les meilleurs profils grace a notre IA.",
    icon: Sparkles,
    color: "from-orange-400 to-orange-600",
  },
  {
    title: "Analyses avancees",
    text: "Prenez des decisions basees sur des donnees.",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Plateforme RH intelligente",
    text: "Automatisez et optimisez vos processus RH.",
    icon: Rocket,
    color: "from-orange-400 to-orange-600",
  },
];

const WelcomePage = () => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isRegister = mode === "register";
  const nameError = isRegister && !name.trim() ? "Le nom complet est obligatoire." : "";
  const emailError = !email ? "L'email RH est obligatoire." : !email.includes("@") ? "Email invalide." : "";
  const passwordError = !password ? "Le mot de passe est obligatoire." : password.length < 6 ? "Minimum 6 caracteres." : "";

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (nameError || emailError || passwordError) {
      setError(nameError || emailError || passwordError);
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Connexion RH impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-100 text-[#071341]">
      <img
        src={hireqBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-white/[0.015]" />

      <section className="absolute left-[2.55vw] top-[20.4vh] z-10 w-[28.2vw] min-w-[360px] max-w-[520px] animate-slide-up">
        <h1 className="text-[clamp(2.15rem,3.05vw,4rem)] font-extrabold leading-[1.18] tracking-[-0.01em]">
          Le talent ideal,
          <br />
          <span className="text-blue-600">au bon moment.</span>
        </h1>
        <p className="mt-[3.2vh] max-w-[430px] text-[clamp(0.88rem,0.96vw,1.05rem)] font-medium leading-7 text-[#17264d]">
          HireQ utilise l'intelligence artificielle pour vous aider a attirer, evaluer et recruter les meilleurs talents plus rapidement et plus efficacement.
        </p>
        <div className="mt-[2.8vh] h-1 w-16 rounded-full bg-blue-600 animate-pulse-slow" />

        <div className="mt-[5.1vh] space-y-[2.35vh]">
          {featureDetails.map((item, index) => (
            <div
              key={item.title}
              className="flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${140 + index * 90}ms`, animationFillMode: "both" }}
            >
              <div className={`flex h-[clamp(3rem,4vw,4.15rem)] w-[clamp(3rem,4vw,4.15rem)] shrink-0 items-center justify-center rounded-[17px] bg-gradient-to-br ${item.color} text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] animate-float`}>
                <item.icon size={28} />
              </div>
              <div>
                <p className="text-[clamp(0.86rem,0.95vw,1.05rem)] font-extrabold leading-5">{item.title}</p>
                <p className="mt-1 max-w-[245px] text-[clamp(0.76rem,0.82vw,0.93rem)] font-medium leading-5 text-[#17264d]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="absolute right-[5.15vw] top-1/2 z-20 w-[30.8vw] min-w-[430px] max-w-[575px] -translate-y-1/2 rounded-[32px] border border-white/70 bg-white/60 p-[clamp(1.45rem,2.15vw,2.3rem)] shadow-[0_30px_90px_rgba(25,54,105,0.22)] backdrop-blur-2xl animate-scale-in">
        <div className="mb-[clamp(1.45rem,2.75vh,2.1rem)] flex items-center gap-5">
          <div className="flex h-[clamp(4.25rem,5.1vw,5.6rem)] w-[clamp(4.25rem,5.1vw,5.6rem)] items-center justify-center rounded-[21px] bg-blue-600 text-white shadow-[0_20px_42px_rgba(37,99,235,0.34)] animate-float">
            <UsersRound size={36} />
          </div>
          <div>
            <h2 className="text-[clamp(1.65rem,2.05vw,2.55rem)] font-extrabold leading-tight">{isRegister ? "Compte RH" : "Acces RH"}</h2>
            <p className="mt-2 max-w-[330px] text-[clamp(0.82rem,0.9vw,1rem)] font-medium leading-6 text-[#17264d]">
              {isRegister
                ? "Creez votre espace recruteur HireQ."
                : "Bienvenue aux ressources humaines. Espace reserve aux ressources humaines."}
            </p>
          </div>
        </div>

        <form className="space-y-[clamp(0.86rem,1.55vh,1.12rem)]" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 rounded-[18px] border border-white/70 bg-white/55 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-[14px] px-3 py-3 text-sm font-bold transition ${
                !isRegister ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)]" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-[14px] px-3 py-3 text-sm font-bold transition ${
                isRegister ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)]" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Register
            </button>
          </div>

          {isRegister && (
            <Field label="Nom complet" error={name && nameError}>
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Admin RH"
                className="h-[clamp(2.85rem,5.05vh,3.6rem)] w-full rounded-[13px] border border-white/70 bg-white/88 px-12 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </Field>
          )}

          <Field label="Email professionnel" error={email && emailError}>
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ex: rh@entreprise.com"
              className="h-[clamp(2.85rem,5.05vh,3.6rem)] w-full rounded-[13px] border border-white/70 bg-white/88 px-12 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </Field>

          <Field label="Mot de passe" error={password && passwordError}>
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 caracteres"
              className="h-[clamp(2.85rem,5.05vh,3.6rem)] w-full rounded-[13px] border border-white/70 bg-white/88 px-12 pr-12 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900">
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </Field>

          {!isRegister && (
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Se souvenir de moi
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700">
                Mot de passe oublie ?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-[13px] border border-red-200 bg-red-50/90 px-4 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="relative flex h-[clamp(3rem,5.45vh,3.9rem)] w-full items-center justify-center rounded-[15px] bg-gradient-to-r from-blue-600 via-[#4c4cf4] to-[#ff8200] px-5 text-[clamp(0.9rem,1vw,1.08rem)] font-extrabold text-white shadow-[0_18px_36px_rgba(255,130,0,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 group"
          >
            {loading ? "Validation..." : isRegister ? "Creer mon compte RH" : "Acceder a ma console RH"}
            <ArrowRight className="absolute right-5 transition-transform group-hover:translate-x-1" size={21} />
          </button>

          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
            className="w-full text-center text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            {isRegister ? "Deja un compte ? Se connecter" : "Pas encore de compte ? Creer un compte RH"}
          </button>
        </form>
      </section>
    </main>
  );
};

const Field = ({ label, error, children }) => (
  <div>
    <label className="mb-2 block text-sm font-extrabold text-[#071341]">{label}</label>
    <div className="relative">{children}</div>
    {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
  </div>
);

export default WelcomePage;
