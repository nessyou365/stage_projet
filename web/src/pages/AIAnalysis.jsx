import { AlertTriangle, Brain, CheckCircle, FileText, Sparkles, TrendingUp, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CandidateAvatar from "@/components/CandidateAvatar";
import { analyzeCvAgainstJob } from "@/services/aiAnalysis";
import { saveApplicationAnalysis, subscribeApplications, subscribeJobs, updateApplicationAiStatus } from "@/services/recruitment";

const recommendationStyles = {
  Shortlist: "bg-emerald-100 text-emerald-700",
  Review: "bg-amber-100 text-amber-700",
  Reject: "bg-red-100 text-red-700",
};

const scoreColor = (value) => {
  if (value >= 75) return "#1265ff";
  if (value >= 50) return "#16b979";
  if (value >= 25) return "#ff941f";
  return "#f33f48";
};

const needsAnalysis = (candidate) =>
  candidate?.id &&
  !candidate.id.startsWith?.("fallback") &&
  candidate.cvUrl &&
  candidate.aiStatus !== "completed" &&
  !candidate.aiSummary &&
  Number(candidate.matchingScore || candidate.score || 0) === 0;

const buildJobForCandidate = (candidate, jobs) => {
  const linkedJob = jobs.find((job) => job.id === candidate.jobId);

  return {
    id: candidate.jobId || linkedJob?.id || "application-job",
    title: linkedJob?.title || candidate.jobTitle || candidate.role || "Offre",
    department: linkedJob?.department || candidate.department || "",
    location: linkedJob?.location || candidate.location || "",
    type: linkedJob?.type || candidate.type || "",
    salaryMin: linkedJob?.salaryMin || "",
    salaryMax: linkedJob?.salaryMax || "",
    skills: linkedJob?.skills || candidate.jobSkills || [],
    description: linkedJob?.description || candidate.jobDescription || "",
  };
};

const fileNameFromCandidate = (candidate) =>
  candidate.cvFileName || decodeURIComponent(String(candidate.cvUrl || "cv.pdf").split("/").pop()?.split("?")[0] || "cv.pdf");

const fetchCandidateCv = async (candidate) => {
  const response = await fetch(candidate.cvUrl);
  if (!response.ok) throw new Error(`CV indisponible (${response.status}).`);

  const blob = await response.blob();
  return new File([blob], fileNameFromCandidate(candidate), {
    type: blob.type || "application/pdf",
  });
};

const toMillis = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const analysisPriority = (candidate) => {
  const hasScore = Number(candidate.matchingScore || candidate.score || 0) > 0;
  if (!candidate.cvUrl) return 1;
  if (candidate.aiStatus === "completed" || candidate.aiSummary || hasScore) return 2;
  return 0;
};

const CircleMetric = ({ value, label, color = scoreColor(value), size = 132, light = false, children }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = size > 120 ? 8 : 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={light ? "rgba(255,255,255,0.26)" : "#e8edf5"} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={light ? "#ffffff" : color}
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        {children || (
          <span className={`${size > 120 ? "text-[31px]" : "text-[25px]"} font-extrabold tabular-nums ${light ? "text-white" : ""}`} style={light ? undefined : { color }}>
            {safeValue}%
          </span>
        )}
        {label && <span className={`mt-2 text-[11px] font-bold ${light ? "text-white/90" : "text-[#53607f]"}`}>{label}</span>}
      </div>
    </div>
  );
};

const AIAnalysis = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const processingRef = useRef(new Set());
  const attemptedRef = useRef(new Set());

  useEffect(() => subscribeApplications(setApplications), []);
  useEffect(() => subscribeJobs(setJobs), []);

  useEffect(() => {
    const candidatesToAnalyze = applications.filter(needsAnalysis).slice(0, 2);

    candidatesToAnalyze.forEach((candidate) => {
      if (processingRef.current.has(candidate.id)) return;
      if (attemptedRef.current.has(candidate.id)) return;
      processingRef.current.add(candidate.id);
      attemptedRef.current.add(candidate.id);

      const run = async () => {
        try {
          await updateApplicationAiStatus(candidate.id, { aiStatus: "analyzing", aiError: "" });
          const file = await fetchCandidateCv(candidate);
          const job = buildJobForCandidate(candidate, jobs);
          const analysis = await analyzeCvAgainstJob({ file, job });
          await saveApplicationAnalysis(candidate.id, analysis);
        } catch (error) {
          await updateApplicationAiStatus(candidate.id, {
            aiStatus: "error",
            aiError: error.message || "Analyse IA impossible pour ce CV.",
          });
        } finally {
          processingRef.current.delete(candidate.id);
        }
      };

      run();
    });
  }, [applications, jobs]);

  const analysisApplications = applications;

  const metrics = useMemo(() => {
    if (!analysisApplications.length) return { avgMatch: 0, topCandidates: 0, skillGaps: 0 };

    const completed = analysisApplications.filter((item) => item.aiStatus === "completed" || item.aiSummary || Number(item.matchingScore || item.score || 0) > 0);
    const totalMatch = completed.reduce((sum, item) => sum + Number(item.matchingScore || item.score || 0), 0);
    const topCandidates = completed.filter((item) => Number(item.matchingScore || item.score || 0) >= 80).length;
    const skillGaps = completed.reduce((sum, item) => sum + (item.skillGaps?.length || 0), 0);

    return {
      avgMatch: completed.length ? Math.round(totalMatch / completed.length) : 0,
      topCandidates,
      skillGaps,
    };
  }, [analysisApplications]);

  const topMatches = useMemo(
    () => [...analysisApplications].sort((a, b) => {
      const priorityDiff = analysisPriority(a) - analysisPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      const dateDiff = toMillis(b.createdAt) - toMillis(a.createdAt);
      if (dateDiff !== 0) return dateDiff;

      return Number(b.matchingScore || b.score || 0) - Number(a.matchingScore || a.score || 0);
    }),
    [analysisApplications],
  );

  const visible = topMatches;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 pb-8 pt-0 text-[#071341] dark:text-slate-100">
      <div className="mb-6 flex items-center gap-4">
        <Sparkles size={31} className="fill-[#2f6bff] text-[#2f6bff]" />
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-normal">AI Analysis</h1>
          <p className="mt-1.5 text-[14px] font-semibold text-[#617092] dark:text-slate-300">Les CV sont analyses automatiquement quand le candidat postule.</p>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#2f68ff] to-[#0848d8] p-6 text-white shadow-[0_18px_45px_rgba(18,101,255,0.20)]">
          <div className="pointer-events-none absolute -bottom-20 right-0 h-44 w-72 rounded-[100%] bg-white/10" />
          <div className="relative flex items-center gap-6">
            <CircleMetric value={metrics.avgMatch} light label="" size={112} />
            <div>
              <h2 className="text-[18px] font-extrabold">Avg Match Score</h2>
              <p className="mt-2 text-[14px] font-semibold text-white/90">Score moyen de correspondance</p>
            </div>
          </div>
        </div>

        <MetricCard icon={TrendingUp} value={metrics.topCandidates} title="Top Candidates" note="Candidats les mieux correspondants" color="#16b979" percent={Math.min(100, metrics.topCandidates * 20)} />
        <MetricCard icon={AlertTriangle} value={metrics.skillGaps} title="Skill Gaps Found" note="Ecarts de competences detectes" color="#ff941f" percent={Math.min(100, metrics.skillGaps * 7)} />
      </section>

      <section className="rounded-[18px] border border-white/74 bg-white/82 p-6 shadow-[0_16px_42px_rgba(25,54,105,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1629]/82">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1265ff]">
            <Brain size={23} />
          </div>
          <div>
            <h2 className="text-[21px] font-extrabold">Automatic CV Analysis Results</h2>
            <div className="mt-2 h-1 w-14 rounded-full bg-[#1265ff]" />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center">
            <div className="max-w-sm text-center">
              <FileText size={38} className="mx-auto mb-3 text-[#9aa6c2]" />
              <p className="text-sm font-semibold text-[#617092]">Aucune analyse pour le moment. Les resultats apparaitront ici des qu'un candidat postule avec un CV PDF.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((candidate) => {
              const matchScore = Number(candidate.matchingScore || candidate.score || 0);
              const matched = candidate.matchedRequirements || candidate.extractedSkills || [];
              const gaps = candidate.skillGaps || [];
              const isCompleted = candidate.aiStatus === "completed" || candidate.aiSummary || matchScore > 0;
              const statusLabel = candidate.aiStatus === "error"
                ? "Analyse echouee"
                : isCompleted
                  ? candidate.recommendation || "Review"
                  : candidate.cvUrl
                    ? "Analyse en cours"
                    : "CV manquant";
              const statusClass = candidate.aiStatus === "error" || !candidate.cvUrl
                ? "bg-red-100 text-red-700"
                : isCompleted
                  ? recommendationStyles[candidate.recommendation] || recommendationStyles.Review
                  : "bg-blue-100 text-[#1265ff]";

              return (
                <Link
                  key={candidate.id}
                  to={candidate.id.startsWith?.("fallback") ? "/ai-analysis" : `/ai-analysis/${candidate.id}`}
                  className="block rounded-[15px] border border-[#e1e8f3] bg-white/72 p-5 transition hover:border-[#1265ff]/30 hover:bg-white dark:border-white/10 dark:bg-[#101d33]/76 dark:hover:bg-[#14243d]"
                >
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_140px]">
                    <div>
                      <div className="mb-4 flex items-center gap-4">
                        <CandidateAvatar name={candidate.candidateName} photoUrl={candidate.candidatePhotoUrl || candidate.photoUrl} className="h-12 w-12 shadow-[0_10px_22px_rgba(18,101,255,0.16)]" textClassName="text-base" />
                        <div>
                          <h3 className="text-[18px] font-extrabold">{candidate.candidateName}</h3>
                          <p className="text-[13px] font-extrabold text-[#1265ff]">{candidate.role}</p>
                          <p className="mt-1 text-[12px] font-semibold text-[#617092] dark:text-slate-400">{candidate.aiProvider || (isCompleted ? "AI Engine" : "AI analysis queue")}</p>
                        </div>
                      </div>
                      <p className="max-w-[900px] text-[14px] font-medium leading-7 text-[#53607f] dark:text-slate-300">
                        {candidate.aiSummary || candidate.aiError || (candidate.cvUrl ? "Analyse automatique en cours. Le resultat apparaitra ici des que le CV est traite." : "Cette candidature est bien recue, mais aucun CV n'est attache. L'analyse IA ne peut pas demarrer sans CV.")}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-3">
                      <CircleMetric value={matchScore} label="Match Score" size={118} color={scoreColor(matchScore)} />
                      <span className={`inline-flex rounded-xl px-4 py-1.5 text-[12px] font-extrabold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <MiniList title="Matched" items={matched} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50/70" />
                    <MiniList title="Gaps" items={gaps} icon={XCircle} color="text-orange-500" bg="bg-orange-50/70" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const MetricCard = ({ icon: Icon, value, title, note, color, percent }) => (
  <div className="rounded-[16px] border border-white/74 bg-white/82 p-6 shadow-[0_16px_38px_rgba(25,54,105,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1d35]/78">
    <div className="flex items-center gap-6">
      <CircleMetric value={percent} size={112} color={color}>
        <Icon size={36} style={{ color }} />
      </CircleMetric>
      <div>
        <p className="text-[29px] font-extrabold leading-none" style={{ color }}>{value}</p>
        <h2 className="mt-3 text-[15px] font-extrabold">{title}</h2>
        <p className="mt-2 max-w-[210px] text-[13px] font-medium leading-6 text-[#617092] dark:text-slate-300">{note}</p>
      </div>
    </div>
  </div>
);

const MiniList = ({ title, items, icon: Icon, color, bg }) => (
  <div className={`rounded-[14px] ${bg} p-4 dark:bg-white/5`}>
    <p className={`mb-3 flex items-center gap-2.5 text-[14px] font-extrabold ${color}`}>
      <Icon size={18} /> {title}
    </p>
    <div className="space-y-2">
      {(items.length ? items.slice(0, 5) : ["Aucun element"]).map((item) => (
        <div key={item} className="flex items-start gap-2.5 text-[13px] font-semibold text-[#33415f] dark:text-slate-200">
          <Icon size={15} className={`${color} mt-0.5 shrink-0`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

export default AIAnalysis;
