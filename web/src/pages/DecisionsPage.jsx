import { useEffect, useMemo, useState } from "react";
import { Send, ThumbsDown, ThumbsUp } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";
import {
  subscribeApplications,
  subscribeSpontaneousApplications,
  updateApplicationDecision,
  updateSpontaneousDecision,
} from "@/services/recruitment";

const statusStyles = {
  Applied: "bg-[#fff0df] text-[#ff7a00]",
  New: "bg-[#fff0df] text-[#ff7a00]",
  Reviewed: "bg-[#ece8ff] text-[#6248f4]",
  Interview: "bg-[#e6f0ff] text-[#1265ff]",
  Accepted: "bg-[#dcf7e8] text-[#10a96a]",
  Approved: "bg-[#dcf7e8] text-[#10a96a]",
  Rejected: "bg-[#ffe3e8] text-[#f33f48]",
  Archived: "bg-slate-100 text-slate-600",
};

const scoreColor = (score) => {
  if (score >= 75) return "#16b979";
  if (score >= 45) return "#ff941f";
  if (score > 0) return "#1265ff";
  return "#f33f48";
};

const getRecommendation = (item) => {
  if (item.source === "spontaneous") return "Spontaneous";
  if (item.score >= 85) return "Strongly Recommend";
  if (item.score >= 70) return "Recommend";
  if (item.score >= 50) return "Consider";
  return "Review Needed";
};

const ScoreCircle = ({ value, label = "AI Score", size = 82, color = scoreColor(value) }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = size > 78 ? 6 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8edf5" strokeWidth={stroke} />
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
        <span className="text-[20px] font-extrabold tabular-nums" style={{ color }}>{safeValue}%</span>
        <span className="mt-2 text-[10px] font-bold text-[#65728f]">{label}</span>
      </div>
    </div>
  );
};

const DecisionsPage = () => {
  const [applications, setApplications] = useState([]);
  const [spontaneous, setSpontaneous] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const unsubApps = subscribeApplications((items) => {
      setApplications(items.map((item) => ({ ...item, source: "application" })));
    });
    const unsubSpontaneous = subscribeSpontaneousApplications(setSpontaneous);

    return () => {
      unsubApps();
      unsubSpontaneous();
    };
  }, []);

  const decisions = useMemo(() => {
    return [...applications, ...spontaneous]
      .map((item) => ({
        ...item,
        name: item.candidateName || item.email || "Candidat",
        role: item.source === "spontaneous" ? "Candidature spontanee" : item.role,
        photoUrl: item.candidatePhotoUrl || item.photoUrl || "",
        recommendation: getRecommendation(item),
      }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
  }, [applications, spontaneous]);

  const fallback = [
    { id: "fallback-1", source: "application", name: "youness", candidateName: "youness", role: "post travaille", candidateEmail: "yourshopbusiness@gmail.com", status: "Rejected", score: 22, recommendation: "Review Needed", aiSummary: "Le candidat est un etudiant en 2eme annee de DUT en Conception et Developpement de Logiciels, recherchant un stage de 2 mois. Son profil est fortement oriente developpement web et IT." },
    { id: "fallback-2", source: "application", name: "youness", candidateName: "youness", role: "web developer", candidateEmail: "yourshopbusiness@gmail.com", status: "Accepted", score: 76, recommendation: "Recommend" },
    { id: "fallback-3", source: "spontaneous", name: "youness", candidateName: "youness", role: "Candidature spontanee", candidateEmail: "yourshopbusiness@gmail.com", status: "Reviewed", score: 0, recommendation: "Spontaneous" },
    { id: "fallback-4", source: "spontaneous", name: "entreprise", candidateName: "entreprise", role: "Candidature spontanee", candidateEmail: "entreprise@gmail.com", status: "Accepted", score: 0, recommendation: "Spontaneous" },
    { id: "fallback-5", source: "application", name: "youness", candidateName: "youness", role: "Fullstack", candidateEmail: "yourshopbusiness@gmail.com", status: "Accepted", score: 42, recommendation: "Review Needed" },
  ];

  const visible = decisions.length ? decisions : fallback;
  const pending = visible.filter((item) => !["Accepted", "Rejected", "Archived"].includes(item.status));
  const current = visible.find((item) => `${item.source}:${item.id}` === selected) || visible[0];

  const handleSelect = (item) => {
    setSelected(`${item.source}:${item.id}`);
    setNote(item.hrNote || "");
  };

  const handleDecision = async (item, action) => {
    if (item.id?.startsWith?.("fallback")) return;
    const status = action === "approve" ? "Accepted" : "Rejected";

    if (item.source === "spontaneous") {
      await updateSpontaneousDecision(item.id, status, note);
    } else {
      await updateApplicationDecision(item.id, status, note);
    }

    setSelected(null);
    setNote("");
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-7 pb-10 pt-1 text-[#071341]">
      <div className="mb-7">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-normal">Hiring Decisions</h1>
        <p className="mt-2 text-[16px] font-semibold text-[#617092]">{pending.length} demandes en attente • {visible.length} total</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_440px]">
        <section className="space-y-4">
          {visible.map((item) => {
            const itemKey = `${item.source}:${item.id}`;
            const isSelected = `${current?.source}:${current?.id}` === itemKey;
            const score = Number(item.score) || 0;

            return (
              <button
                key={itemKey}
                type="button"
                onClick={() => handleSelect(item)}
                className={`grid min-h-[124px] w-full grid-cols-[1fr_auto_auto] items-center gap-6 rounded-[18px] border bg-white/84 px-7 py-5 text-left shadow-[0_16px_42px_rgba(25,54,105,0.10)] backdrop-blur-xl transition hover:bg-white ${
                  isSelected ? "border-[#246bff] ring-2 ring-[#246bff]/12" : "border-white/74"
                }`}
              >
                <div className="flex min-w-0 items-center gap-5">
                  <CandidateAvatar name={item.name} photoUrl={item.photoUrl} className="h-[66px] w-[66px]" textClassName="text-xl" />
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="truncate text-[20px] font-extrabold">{item.name}</h3>
                      <span className={`rounded-full px-4 py-1.5 text-[13px] font-extrabold ${statusStyles[item.status] || "bg-slate-100 text-slate-600"}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="truncate text-[15px] font-semibold text-[#617092]">{item.role}</p>
                    <p className="mt-2 truncate text-[14px] font-medium text-[#617092]">{item.candidateEmail || item.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#eef4ff] px-5 py-2 text-[13px] font-extrabold text-[#1265ff]">
                  {item.recommendation}
                </span>
                <ScoreCircle value={score} color={scoreColor(score)} />
              </button>
            );
          })}
        </section>

        <aside className="rounded-[18px] border border-white/74 bg-white/84 p-7 shadow-[0_18px_50px_rgba(25,54,105,0.12)] backdrop-blur-xl">
          <h2 className="mb-6 text-[22px] font-extrabold">Decision Panel</h2>

          {current && (
            <div className="space-y-6">
              <div className="rounded-[16px] bg-[#f4f7fc]/88 px-5 py-7 text-center">
                <CandidateAvatar name={current.name} photoUrl={current.photoUrl} className="mx-auto mb-4 h-[76px] w-[76px]" textClassName="text-2xl" />
                <h3 className="text-[21px] font-extrabold">{current.name}</h3>
                <p className="mt-2 text-[15px] font-semibold text-[#617092]">{current.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-[14px] bg-[#f4f7fc]/88 p-5">
                  <p className="text-[26px] font-extrabold tabular-nums" style={{ color: scoreColor(current.score || 0) }}>{current.score || 0}%</p>
                  <p className="mt-2 text-[13px] font-semibold text-[#617092]">AI Score</p>
                </div>
                <div className="rounded-[14px] bg-[#f4f7fc]/88 p-5">
                  <p className="text-[24px] font-extrabold text-[#1265ff]">{current.source === "spontaneous" ? "SP" : "JOB"}</p>
                  <p className="mt-2 text-[13px] font-semibold text-[#617092]">Source</p>
                </div>
              </div>

              {(current.aiSummary || current.description) && (
                <div>
                  <p className="mb-3 text-[14px] font-extrabold">Notes</p>
                  <p className="rounded-[14px] bg-[#f4f7fc]/88 p-5 text-[14px] font-medium leading-7 text-[#40506f]">
                    {current.aiSummary || current.description}
                  </p>
                </div>
              )}

              <div className="flex min-h-[86px] items-end gap-3 rounded-[14px] border border-[#d9e2f1] bg-white/70 p-3">
                <textarea
                  placeholder="Ajouter une note..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="min-h-[54px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] font-semibold text-[#071341] outline-none placeholder:text-[#7d88a3]"
                />
                <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1265ff] text-white shadow-[0_12px_24px_rgba(18,101,255,0.26)]">
                  <Send size={19} />
                </button>
              </div>

              {!["Accepted", "Rejected", "Archived"].includes(current.status) ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleDecision(current, "approve")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#13c980] to-[#0da86b] text-[13px] font-extrabold text-white shadow-[0_12px_24px_rgba(16,185,129,0.22)]">
                    <ThumbsUp size={16} /> Approve
                  </button>
                  <button onClick={() => handleDecision(current, "reject")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-[13px] font-extrabold text-red-600">
                    <ThumbsDown size={16} /> Reject
                  </button>
                </div>
              ) : (
                <div className={`rounded-xl py-3 text-center text-sm font-extrabold ${statusStyles[current.status]}`}>
                  Decision : {current.status}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DecisionsPage;
