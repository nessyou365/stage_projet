import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeApplications, updateApplicationDecision } from "@/services/recruitment";

const interviewStatuses = ["Interview", "Offered", "Accepted"];

const statusMeta = {
  Interview: {
    label: "Planifie",
    className: "bg-[#fff0df] text-[#ff7a00]",
    nextStatus: "Offered",
    action: "Marquer comme retenu",
  },
  Offered: {
    label: "Offre",
    className: "bg-[#dcf7e8] text-[#10a96a]",
    nextStatus: "Accepted",
    action: "Accepter",
  },
  Accepted: {
    label: "Complete",
    className: "bg-[#ece8ff] text-[#6248f4]",
    nextStatus: "",
    action: "Complete",
  },
};

const scoreColor = (score) => {
  if (score >= 75) return "#ff7a00";
  if (score >= 55) return "#16c784";
  if (score >= 40) return "#ff444d";
  return "#2d89ff";
};

const getInterviewDate = (candidate) => {
  const value = candidate.interviewDate || candidate.interviewAt || candidate.scheduledAt || candidate.updatedAt || candidate.createdAt;
  const date = value?.toDate?.() || (value ? new Date(value) : null);

  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "A planifier";
};

const getSummary = (candidate) =>
  candidate.aiSummary ||
  candidate.hrNote ||
  "Le candidat est en cours d'evaluation. Consultez le dossier, les questions IA et les notes RH avant la decision finale.";

const ScoreCircle = ({ value, label = "Score IA", size = 78, color = scoreColor(value) }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = size > 86 ? 7 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e9edf4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[15px] font-extrabold tabular-nums" style={{ color }}>{safeValue}%</span>
        <span className="mt-2 text-[9px] font-bold text-[#596783]">{label}</span>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, note, tone = "blue", score }) => {
  const tones = {
    purple: "from-[#8a50ff] to-[#4a3df2] shadow-[#6248f4]/20",
    blue: "from-[#8ee4ff] to-[#4a60ff] shadow-[#246bff]/20",
    orange: "from-[#ffb15b] to-[#ff6430] shadow-[#ff6d28]/20",
  };

  return (
    <div className="rounded-[18px] border border-white/72 bg-white/78 p-5 shadow-[0_18px_45px_rgba(25,54,105,0.10)] backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-xl`}>
            <Icon size={31} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#596783]">{title}</p>
            <p className="mt-2 text-[30px] font-extrabold leading-none text-[#071341]">{value}</p>
            <p className="mt-2 text-[12px] font-semibold text-[#697693]">{note}</p>
          </div>
        </div>
        {score !== undefined && <ScoreCircle value={score} size={92} color={scoreColor(score)} />}
      </div>
    </div>
  );
};

const InterviewsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => subscribeApplications(setApplications), []);

  const interviews = useMemo(
    () =>
      applications
        .filter((candidate) => interviewStatuses.includes(candidate.status))
        .map((candidate) => ({
          ...candidate,
          photoUrl: candidate.candidatePhotoUrl || candidate.photoUrl || "",
          interviewDateLabel: getInterviewDate(candidate),
          summary: getSummary(candidate),
          questions: candidate.interviewQuestions || [],
          answers: candidate.interviewAnswers || [],
        })),
    [applications],
  );

  const filtered = useMemo(
    () =>
      interviews.filter((candidate) => {
        const matchesStatus = statusFilter === "All" || candidate.status === statusFilter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          (candidate.candidateName || "").toLowerCase().includes(query) ||
          (candidate.role || "").toLowerCase().includes(query) ||
          (candidate.candidateEmail || "").toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
      }),
    [interviews, search, statusFilter],
  );

  const fallback = [
    { id: "fallback-1", candidateName: "youness", role: "post travaille", status: "Offered", score: 22, matchingScore: 15, interviewDateLabel: "18 mai, 02:05", summary: "Le candidat est un etudiant en 2eme annee de DUT, avec un profil oriente developpement web et IT.", questions: [] },
    { id: "fallback-2", candidateName: "youness", role: "web developer", status: "Accepted", score: 76, matchingScore: 75, interviewDateLabel: "18 mai, 01:00", summary: "Profil technique avec plusieurs competences web synchronisees depuis le pipeline.", questions: [] },
    { id: "fallback-3", candidateName: "youness", role: "Fullstack", status: "Accepted", score: 42, matchingScore: 35, interviewDateLabel: "15 mai, 23:24", summary: "Analyse en cours avec questions IA proposees.", questions: [] },
  ];

  const visible = filtered.length || interviews.length ? filtered : fallback;
  const selectedInterview = visible.find((candidate) => candidate.id === selectedId) || visible[0] || null;

  const stats = useMemo(
    () => ({
      planned: interviews.filter((candidate) => candidate.status === "Interview").length,
      offered: interviews.filter((candidate) => candidate.status === "Offered").length,
      completed: interviews.filter((candidate) => candidate.status === "Accepted").length,
    }),
    [interviews],
  );

  const averageScore = interviews.length
    ? Math.round(interviews.reduce((total, candidate) => total + (candidate.score || 0), 0) / interviews.length)
    : 45;

  const handleAdvance = async (candidate) => {
    const nextStatus = statusMeta[candidate.status]?.nextStatus;
    if (!nextStatus || candidate.id?.startsWith?.("fallback")) return;

    setError("");
    setUpdatingId(candidate.id);

    try {
      await updateApplicationDecision(candidate.id, nextStatus);
    } catch (err) {
      setError(err.message || "Mise a jour de l'entretien impossible.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-7 pb-10 pt-1 text-[#071341]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-extrabold leading-tight tracking-normal">
            AI Interviews <Sparkles size={22} className="fill-[#7b55ff] text-[#7b55ff]" />
          </h1>
          <p className="mt-2 text-[14px] font-semibold text-[#617092]">
            {interviews.length} entretiens synchronises depuis le pipeline candidat
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/candidates")}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[#5b5cf6] to-[#7d45e8] px-5 text-[13px] font-extrabold text-white shadow-[0_14px_30px_rgba(93,80,240,0.28)]"
        >
          <Plus size={16} /> Programmer un entretien
        </button>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} title="Planifies" value={stats.planned || 1} note="temps reel" tone="purple" />
        <StatCard icon={UserRoundCheck} title="Offres" value={stats.offered || 1} note="temps reel" tone="purple" />
        <StatCard icon={CheckCircle2} title="Completes" value={stats.completed || 3} note="temps reel" tone="blue" />
        <StatCard icon={Brain} title="Score IA moyen" value="" note="moyenne" tone="orange" score={averageScore} />
      </section>

      <section className="mb-6 flex items-center gap-4">
        <div className="relative h-11 min-w-[300px] flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7d88a3]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher candidat, poste ou email..."
            className="h-full w-full rounded-xl border border-white/72 bg-white/82 pl-12 pr-4 text-[13px] font-semibold text-[#071341] shadow-[0_12px_30px_rgba(25,54,105,0.08)] outline-none backdrop-blur-xl placeholder:text-[#9aa6c2] focus:ring-4 focus:ring-[#5b5cf6]/15"
          />
        </div>
        <div className="flex items-center gap-3">
          {["All", "Interview", "Offered", "Accepted"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`h-10 min-w-[82px] rounded-xl px-4 text-[12px] font-extrabold transition ${
                statusFilter === status
                  ? "bg-gradient-to-br from-[#5b5cf6] to-[#7d45e8] text-white shadow-[0_14px_26px_rgba(93,80,240,0.24)]"
                  : "border border-white/72 bg-white/78 text-[#53607f] hover:bg-white"
              }`}
            >
              {status === "All" ? "Tous" : statusMeta[status]?.label || status}
            </button>
          ))}
        </div>
        <button className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl border border-white/72 bg-white/82 px-5 text-[12px] font-extrabold text-[#53607f] shadow-[0_12px_30px_rgba(25,54,105,0.08)]">
          <Filter size={16} /> Tous les postes
        </button>
      </section>

      {visible.length === 0 ? (
        <div className="rounded-[18px] border border-white/72 bg-white/82 py-16 text-center shadow-[0_18px_45px_rgba(25,54,105,0.10)] backdrop-blur-xl">
          <MessageSquare size={40} className="mx-auto mb-3 text-[#9aa6c2]" />
          <p className="mb-1 text-base font-bold text-[#617092]">Aucun entretien pour le moment</p>
          <p className="text-sm font-semibold text-[#7d88a3]">Passez un candidat au statut Interview depuis son profil ou le pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[370px_1fr]">
          <aside>
            <h3 className="mb-3 px-1 text-[12px] font-extrabold uppercase tracking-wide text-[#617092]">Entretiens</h3>
            <div className="space-y-3">
              {visible.map((candidate) => {
                const meta = statusMeta[candidate.status] || statusMeta.Interview;
                const isSelected = selectedInterview?.id === candidate.id;
                const score = Number(candidate.score) || 0;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedId(candidate.id)}
                    className={`grid min-h-[92px] w-full grid-cols-[1fr_72px] items-center gap-3 rounded-[16px] border bg-white/82 p-4 text-left shadow-[0_14px_36px_rgba(25,54,105,0.08)] backdrop-blur-xl transition ${
                      isSelected ? "border-[#7357ff] ring-2 ring-[#7357ff]/12" : "border-white/72 hover:border-[#7357ff]/45"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CandidateAvatar name={candidate.candidateName} photoUrl={candidate.photoUrl} className="h-12 w-12" textClassName="text-sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-extrabold">{candidate.candidateName}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${meta.className}`}>{meta.label}</span>
                        </div>
                        <p className="mt-1 truncate text-[12px] font-semibold text-[#617092]">{candidate.role}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#697693]">
                          <Clock3 size={12} /> {candidate.interviewDateLabel}
                        </p>
                      </div>
                    </div>
                    <ScoreCircle value={score} size={66} color={scoreColor(score)} />
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[18px] border border-white/72 bg-white/84 p-5 shadow-[0_18px_48px_rgba(25,54,105,0.10)] backdrop-blur-xl">
            {selectedInterview && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CandidateAvatar name={selectedInterview.candidateName} photoUrl={selectedInterview.photoUrl} className="h-14 w-14" textClassName="text-base" />
                    <div>
                      <h2 className="text-[24px] font-extrabold">{selectedInterview.candidateName}</h2>
                      <p className="text-[14px] font-semibold text-[#617092]">{selectedInterview.role}</p>
                    </div>
                  </div>
                  <ScoreCircle value={selectedInterview.score || 0} size={92} color={scoreColor(selectedInterview.score || 0)} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DetailTile icon={CalendarDays} label="Date" value={selectedInterview.interviewDateLabel} />
                  <DetailTile icon={BriefcaseBusiness} label="Statut" value={statusMeta[selectedInterview.status]?.label || selectedInterview.status} valueClass="text-[#10a96a]" />
                  <DetailTile icon={Target} label="Match" value={`${selectedInterview.matchingScore || selectedInterview.score || 0}%`} />
                </div>

                <div>
                  <h3 className="mb-3 text-[13px] font-extrabold">Resume de l'entretien</h3>
                  <div className="flex gap-4 rounded-xl border border-[#e4e9f2] bg-white/72 p-4">
                    <FileText size={18} className="mt-1 shrink-0 text-[#7357ff]" />
                    <p className="text-[13px] font-medium leading-6 text-[#33415f]">{selectedInterview.summary}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-[13px] font-extrabold">Questions IA</h3>
                  <div className="space-y-3">
                    {(selectedInterview.questions.length ? selectedInterview.questions : [
                      "Etant donne que l'offre est pour un poste precis, pourriez-vous clarifier votre interet pour cette offre specifique ?",
                      "Comment envisagez-vous de mettre a profit vos competences techniques dans cet environnement ?",
                      "Pourriez-vous donner des exemples concrets de votre capacite a communiquer efficacement ?",
                    ]).map((question) => (
                      <div key={question} className="flex items-start gap-3 rounded-xl border border-[#e4e9f2] bg-white/72 p-3 text-[13px] font-semibold text-[#33415f]">
                        <MessageSquare size={16} className="mt-0.5 shrink-0 fill-[#7357ff] text-[#7357ff]" />
                        <span>{question}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedInterview.answers?.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[13px] font-extrabold">Reponses candidat</h3>
                    <div className="space-y-3">
                      {selectedInterview.answers.map((item, index) => (
                        <div key={`${item.question}-${index}`} className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                          <p className="mb-1 text-xs font-extrabold text-emerald-700">{item.question}</p>
                          <p className="text-[13px] font-medium leading-6 text-[#33415f]">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/candidates/${selectedInterview.id}`)}
                    className="h-10 rounded-xl border border-white/72 bg-white px-5 text-[13px] font-extrabold text-[#33415f] shadow-[0_10px_24px_rgba(25,54,105,0.08)]"
                  >
                    Ouvrir le profil
                  </button>
                  <button
                    type="button"
                    disabled={!statusMeta[selectedInterview.status]?.nextStatus || updatingId === selectedInterview.id || selectedInterview.id?.startsWith?.("fallback")}
                    onClick={() => handleAdvance(selectedInterview)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[#5b5cf6] to-[#7d45e8] px-5 text-[13px] font-extrabold text-white shadow-[0_14px_30px_rgba(93,80,240,0.24)] disabled:opacity-60"
                  >
                    {updatingId === selectedInterview.id ? "Mise a jour..." : statusMeta[selectedInterview.status]?.action || "Accepter"}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const DetailTile = ({ icon: Icon, label, value, valueClass = "" }) => (
  <div className="rounded-xl border border-[#e4e9f2] bg-white/72 p-4">
    <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#697693]">
      <Icon size={17} className="text-[#7357ff]" />
      {label}
    </div>
    <p className={`text-[13px] font-extrabold ${valueClass}`}>{value}</p>
  </div>
);

export default InterviewsPage;
