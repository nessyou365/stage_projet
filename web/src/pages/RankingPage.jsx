import { ChevronDown, Crown, Filter, MoreHorizontal, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeApplications } from "@/services/recruitment";

const podiumConfig = [
  { order: 2, tone: "#3d8cff", medal: "from-slate-300 to-slate-500", lift: "mt-14", accent: "blue" },
  { order: 1, tone: "#ff9f00", medal: "from-amber-300 to-orange-500", lift: "mt-0", accent: "gold" },
  { order: 3, tone: "#8d63ff", medal: "from-orange-500 to-orange-700", lift: "mt-20", accent: "purple" },
];

const circleColor = (value) => {
  if (value >= 75) return "#ff8a00";
  if (value >= 55) return "#16c784";
  if (value >= 40) return "#8a63ff";
  return "#2d89ff";
};

const badgeClass = (rank) => {
  if (rank === 1) return "bg-[#fff2cf] text-[#f59f00]";
  if (rank === 2) return "bg-[#eef2f7] text-[#7b879a]";
  if (rank === 3) return "bg-[#edeaff] text-[#4d42ff]";
  return "bg-[#f0f3fa] text-[#5b66d8]";
};

const ScoreCircle = ({ value, label, size = 58, color = circleColor(value) }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = size > 70 ? 6 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ecf0f6" strokeWidth={stroke} />
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
        <span className="text-[12px] font-extrabold tabular-nums" style={{ color }}>{safeValue}%</span>
        <span className="mt-1 text-[8px] font-bold text-[#6e7894]">{label}</span>
      </div>
    </div>
  );
};

const MiniWave = ({ color }) => (
  <svg className="absolute bottom-0 left-0 h-16 w-full" viewBox="0 0 280 64" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 52 C 28 20, 52 24, 78 42 S 126 40, 154 46 S 204 18, 232 26 S 260 28, 280 12 L280 64 L0 64 Z" fill={color} opacity="0.12" />
    <path d="M0 52 C 28 20, 52 24, 78 42 S 126 40, 154 46 S 204 18, 232 26 S 260 28, 280 12" fill="none" stroke={color} strokeWidth="2" opacity="0.55" />
  </svg>
);

const RankingPage = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => subscribeApplications(setApplications), []);

  const ranked = useMemo(
    () => [...applications].sort((a, b) => (b.matchingScore || 0) - (a.matchingScore || 0)),
    [applications],
  );

  const fallback = [
    { id: "fallback-1", candidateName: "youness", role: "web developer", matchingScore: 75, score: 76, extractedSkills: ["React", "HTML", "CSS", "JavaScript", "Python", "PHP", "C"] },
    { id: "fallback-2", candidateName: "youness", role: "Fullstack", matchingScore: 35, score: 42, extractedSkills: ["Analyse en cours"] },
    { id: "fallback-3", candidateName: "Candidat TalentAI", role: "last job", matchingScore: 35, score: 42, extractedSkills: ["Analyse en cours"] },
    { id: "fallback-4", candidateName: "Candidat TalentAI", role: "new job", matchingScore: 35, score: 42, extractedSkills: ["Analyse en cours"] },
  ];
  const visible = ranked.length ? ranked : fallback;
  const podium = [visible[1], visible[0], visible[2]];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-10 pt-1 text-[#071341]">
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[34px] font-extrabold leading-tight tracking-normal">Candidate Ranking</h1>
          <p className="mt-2 text-[14px] font-semibold text-[#617092]">Classement automatique base sur le matching du CV PDF avec l'offre.</p>
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/70 bg-white/82 px-5 text-[13px] font-extrabold text-[#23365f] shadow-[0_12px_30px_rgba(25,54,105,0.10)] backdrop-blur-xl transition hover:bg-white">
          <Filter size={16} /> All Positions <ChevronDown size={16} />
        </button>
      </div>

      <section className="mb-7 grid min-h-[310px] grid-cols-1 items-end gap-6 md:grid-cols-3">
        {podiumConfig.map((slot, index) => {
          const candidate = podium[index];
          const score = candidate?.matchingScore ?? 0;
          return (
            <div
              key={slot.order}
              className={`relative overflow-visible rounded-[18px] border bg-white/78 px-7 pb-9 pt-12 text-center shadow-[0_18px_45px_rgba(25,54,105,0.12)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white ${slot.lift} ${
                slot.order === 1 ? "min-h-[300px] border-[#ffca67]/80 shadow-[0_22px_55px_rgba(255,159,0,0.18)]" : "min-h-[250px] border-white/72"
              }`}
            >
              <div className={`absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br ${slot.medal} text-[16px] font-extrabold text-white shadow-[0_14px_30px_rgba(25,54,105,0.22)]`}>
                {slot.order}
              </div>
              <div className="relative z-10">
                {candidate ? (
                  <CandidateAvatar
                    name={candidate.candidateName}
                    photoUrl={candidate.candidatePhotoUrl || candidate.photoUrl}
                    className="mx-auto h-[70px] w-[70px] border-4 border-[#d9e5ff] shadow-[0_12px_28px_rgba(25,54,105,0.12)]"
                    textClassName="text-xl"
                  />
                ) : (
                  <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#eef2ff] text-[#6b76a0]">
                    <Trophy size={24} />
                  </div>
                )}
                {slot.order === 1 && <Crown className="absolute left-[55%] top-12 fill-[#ffb300] text-[#ffb300]" size={26} />}
                <h3 className="mt-5 truncate text-[16px] font-extrabold">{candidate?.candidateName || "—"}</h3>
                <p className="mt-3 text-[32px] font-extrabold tabular-nums" style={{ color: slot.tone }}>{candidate ? `${score}%` : "—"}</p>
                <span className="mt-2 inline-flex rounded-xl bg-white/70 px-4 py-2 text-[11px] font-bold" style={{ color: slot.tone }}>
                  Matching Score
                </span>
              </div>
              <MiniWave color={slot.tone} />
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[18px] border border-white/72 bg-white/82 shadow-[0_18px_50px_rgba(25,54,105,0.11)] backdrop-blur-xl">
        <div className="grid grid-cols-[58px_minmax(330px,1fr)_170px_150px_40px] border-b border-[#e7ebf3] px-7 py-5 text-[12px] font-extrabold uppercase text-[#7180a0] max-lg:hidden">
          <span>#</span>
          <span>Candidate</span>
          <span className="text-center">Matching Score</span>
          <span className="text-center">AI Score</span>
          <span />
        </div>

        <div className="divide-y divide-[#e7ebf3]">
          {visible.map((candidate, index) => {
            const rank = index + 1;
            const matching = Number(candidate.matchingScore) || 0;
            const aiScore = Number(candidate.score) || 0;
            const skills = candidate.extractedSkills?.length ? candidate.extractedSkills.join(", ") : "Analyse en cours";
            const matchingColor = circleColor(matching);
            const aiColor = circleColor(aiScore);

            return (
              <div
                key={candidate.id || `${candidate.candidateName}-${index}`}
                className="grid min-h-[92px] grid-cols-[58px_minmax(330px,1fr)_170px_150px_40px] items-center px-7 py-4 transition hover:bg-white/72 max-lg:grid-cols-[44px_1fr_auto] max-lg:gap-4"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-extrabold ${badgeClass(rank)}`}>{rank}</span>
                <div className="flex min-w-0 items-center gap-4">
                  <CandidateAvatar
                    name={candidate.candidateName}
                    photoUrl={candidate.candidatePhotoUrl || candidate.photoUrl}
                    className="h-12 w-12"
                    textClassName="text-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold">{candidate.candidateName}</p>
                    <p className="mt-1 truncate text-[13px] font-semibold text-[#697693]">
                      {candidate.role} <span className="px-2 text-[#8c96ad]">•</span> {skills}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center max-lg:hidden">
                  <ScoreCircle value={matching} label="Matching" color={matchingColor} />
                </div>
                <div className="text-center max-lg:hidden">
                  <p className="text-[22px] font-extrabold tabular-nums" style={{ color: aiColor }}>{aiScore}%</p>
                  <p className="text-[12px] font-semibold text-[#697693]">AI Score</p>
                </div>
                <MoreHorizontal className="justify-self-end text-[#506082]" size={22} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default RankingPage;
