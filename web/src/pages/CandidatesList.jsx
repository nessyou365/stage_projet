import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  MapPin,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeApplications } from "@/services/recruitment";

const filters = ["All", "Applied", "Reviewed", "Interview", "Offered", "Accepted", "Rejected"];

const statusStyles = {
  Applied: {
    pill: "bg-[#e5f1ff] text-[#1c7df5]",
    ring: "#2d89ff",
  },
  Reviewed: {
    pill: "bg-[#eee7ff] text-[#7a48df]",
    ring: "#8a50ec",
  },
  Interview: {
    pill: "bg-[#fff1df] text-[#f4931f]",
    ring: "#ffae3d",
  },
  Offered: {
    pill: "bg-[#dbf6e9] text-[#12a266]",
    ring: "#35be78",
  },
  Accepted: {
    pill: "bg-[#ddf5eb] text-[#139b64]",
    ring: "#ffb85b",
  },
  Rejected: {
    pill: "bg-[#ffe3e5] text-[#ef3c45]",
    ring: "#ff3f48",
  },
};

const scoreTone = (candidate) => {
  if (statusStyles[candidate.status]) return statusStyles[candidate.status].ring;
  if (candidate.score >= 80) return "#35be78";
  if (candidate.score >= 60) return "#ffb85b";
  if (candidate.score >= 40) return "#8a50ec";
  return "#2d89ff";
};

const ScoreCircle = ({ score, color }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#edf0f6"
          strokeWidth="4"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[12px] font-extrabold tabular-nums" style={{ color }}>
        {safeScore}%
      </span>
    </div>
  );
};

const CandidateMeta = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#52628c]">
    <Icon className="h-4 w-4 text-[#6f7fa9]" strokeWidth={2.2} />
    <span className="truncate">{children}</span>
  </div>
);

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeApplications((items) => {
      setCandidates(
        items.map((item) => ({
          id: item.id,
          name: item.candidateName,
          role: item.role,
          experience: item.experience,
          location: item.location,
          score: item.score,
          status: item.status,
          appliedDateLabel: item.appliedDateLabel,
          photoUrl: item.candidatePhotoUrl || item.photoUrl || "",
        })),
      );
    });
  }, []);

  const filtered = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          (statusFilter === "All" || candidate.status === statusFilter) &&
          ((candidate.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (candidate.role || "").toLowerCase().includes(search.toLowerCase())),
      ),
    [candidates, search, statusFilter],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-10 pt-1">
      <div className="mb-6">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-normal text-[#071341]">Candidats</h1>
        <p className="mt-1 text-[14px] font-semibold text-[#53648d]">{candidates.length} candidatures synchronisees</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-12 min-w-[260px] flex-1">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f7fa9]" />
          <input
            placeholder="Rechercher par nom ou poste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full rounded-xl border border-white/70 bg-white/84 pl-14 pr-14 text-[14px] font-semibold text-[#071341] shadow-[0_12px_32px_rgba(25,54,105,0.10)] outline-none backdrop-blur-xl transition placeholder:text-[#9aa6c2] focus:border-[#2f5cff]/40 focus:ring-4 focus:ring-[#2f5cff]/12"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#1e53ff] transition hover:bg-[#edf2ff]"
            aria-label="Filtres de recherche"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3 overflow-x-auto pb-1">
          {filters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`h-11 min-w-[88px] rounded-xl px-5 text-[12px] font-extrabold shadow-[0_12px_28px_rgba(25,54,105,0.09)] transition ${
                statusFilter === status
                  ? "bg-gradient-to-br from-[#2e63ff] to-[#193ae6] text-white shadow-[0_16px_35px_rgba(39,82,255,0.28)]"
                  : "border border-white/70 bg-white/78 text-[#29395f] hover:bg-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-xl border border-white/70 bg-white/76 py-16 text-center shadow-[0_18px_50px_rgba(25,54,105,0.10)] backdrop-blur-xl">
          <Users size={40} className="mx-auto mb-3 text-[#93a1bf]" />
          <p className="mb-1 text-base font-bold text-[#53648d]">0 candidats</p>
          <p className="text-sm text-[#6d7898]">Les candidats apparaitront ici des qu'une candidature mobile sera soumise.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((candidate) => {
            const tone = scoreTone(candidate);
            const statusStyle = statusStyles[candidate.status] || {
              pill: "bg-slate-100 text-slate-600",
              ring: tone,
            };

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                className="group grid min-h-[120px] w-full grid-cols-[minmax(230px,1.15fr)_minmax(180px,0.9fr)_minmax(150px,0.7fr)_76px_118px_30px] items-center gap-6 rounded-xl border border-white/72 bg-white/82 px-7 py-5 text-left shadow-[0_16px_42px_rgba(25,54,105,0.11)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_52px_rgba(25,54,105,0.15)] max-lg:grid-cols-[1fr_auto] max-lg:gap-4"
              >
                <div className="flex min-w-0 items-center gap-5">
                  <CandidateAvatar
                    name={candidate.name}
                    photoUrl={candidate.photoUrl}
                    className="h-14 w-14"
                    textClassName="text-[17px]"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-extrabold text-[#071341] transition group-hover:text-[#1d50ff]">
                      {candidate.name}
                    </h3>
                    <p className="mt-1 truncate text-[13px] font-semibold text-[#52628c]">{candidate.role}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#1d50ff]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1d50ff]" />
                      Profil candidat
                    </p>
                  </div>
                </div>

                <div className="grid min-w-0 gap-2 max-lg:hidden">
                  <CandidateMeta icon={BriefcaseBusiness}>{candidate.location || "Remote"}</CandidateMeta>
                  <CandidateMeta icon={Clock3}>{candidate.experience || "Full-time"}</CandidateMeta>
                  <CandidateMeta icon={CalendarDays}>{candidate.appliedDateLabel || "Aujourd'hui"}</CandidateMeta>
                </div>

                <div className="min-w-0 max-lg:hidden">
                  <CandidateMeta icon={MapPin}>{candidate.location || "Remote"}</CandidateMeta>
                </div>

                <ScoreCircle score={candidate.score} color={tone} />

                <span className={`justify-self-start rounded-lg px-4 py-2 text-[12px] font-extrabold ${statusStyle.pill}`}>
                  {candidate.status}
                </span>

                <MoreHorizontal className="justify-self-end text-[#53648d]" size={22} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-white/70 bg-white/76 py-10 text-center text-sm font-semibold text-[#53648d] shadow-[0_18px_50px_rgba(25,54,105,0.10)] backdrop-blur-xl">
              Aucun candidat pour ce filtre.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidatesList;
