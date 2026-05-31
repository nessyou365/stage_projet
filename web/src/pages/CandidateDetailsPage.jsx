import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle,
  Download,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  XCircle,
} from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeApplications } from "@/services/recruitment";

const tabs = ["Overview", "AI Analysis", "Interview", "History"];
const skillColors = ["#16b461", "#106fff", "#13a8bf", "#ffad13", "#ff421d", "#8a50ec"];

const getDownloadFileName = (candidate) => {
  const rawName = candidate?.cvFileName || `cv-${candidate?.candidateName || "candidate"}.pdf`;
  return rawName.replace(/[^\w.-]+/g, "_");
};

const getCvDownloadUrl = (url, fileName) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const isCloudinaryUrl = parsedUrl.hostname.includes("cloudinary.com");

    if (!isCloudinaryUrl || !parsedUrl.pathname.includes("/upload/")) return url;
    if (parsedUrl.pathname.includes("/raw/upload/")) return url;

    const attachmentName = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") || "cv";
    if (!parsedUrl.pathname.includes("/fl_attachment")) {
      parsedUrl.pathname = parsedUrl.pathname.replace("/upload/", `/upload/fl_attachment:${attachmentName}/`);
    }
    return parsedUrl.toString();
  } catch {
    return url;
  }
};

const downloadBlob = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const openDirectDownload = (url, fileName) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const PercentCircle = ({ value, color = "#18d27b", track = "#edf0f6", size = 58, stroke = 5, children }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
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
      <div className="absolute inset-0 flex items-center justify-center text-center">{children || `${safeValue}%`}</div>
    </div>
  );
};

const MetaItem = ({ icon: Icon, children }) => (
  <span className="inline-flex min-w-0 items-center gap-2 text-[14px] font-semibold text-white/92">
    <Icon size={18} className="shrink-0" />
    <span className="truncate">{children}</span>
  </span>
);

const CandidateDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => (requestedTab === "ai-analysis" ? "AI Analysis" : "Overview"));
  const [candidate, setCandidate] = useState(null);
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (requestedTab === "ai-analysis") setActiveTab("AI Analysis");
  }, [requestedTab]);

  useEffect(() => {
    return subscribeApplications((items) => {
      const current = items.find((item) => item.id === id);
      if (!current) return;

      setCandidate({
        ...current,
        photoUrl: current.candidatePhotoUrl || current.photoUrl || "",
        yearsExp: current.experience || "Profil candidat",
        appliedDate: current.appliedDateLabel,
        phone: current.phone || "Non renseigne",
        skills: (current.extractedSkills?.length ? current.extractedSkills : current.jobSkills || []).map((skill, index) => ({
          name: skill,
          level: Math.max(60, 95 - index * 7),
          color: skillColors[index % skillColors.length],
        })),
        workHistory: [
          {
            title: current.role,
            company: "HireQ Mobile",
            period: current.appliedDateLabel,
            description: current.hrNote || "Candidature synchronisee depuis l'application mobile.",
          },
        ],
        aiSummary: current.aiSummary || current.hrNote || "Le candidat vient de l'espace mobile et son dossier est synchronise dans le dashboard.",
        skillGaps: current.skillGaps?.length ? current.skillGaps : ["Evaluation RH", "Analyse IA avancee", "Decision finale"],
        strengths: current.strengths?.length ? current.strengths : current.extractedSkills?.length ? current.extractedSkills : current.jobSkills?.length ? current.jobSkills : ["Dossier complet"],
        matchedRequirements: current.matchedRequirements || [],
        risks: current.risks || [],
        interviewQuestions: current.interviewQuestions || [],
        interviewAnswers: current.interviewAnswers || [],
        interviewStatus: current.interviewStatus || "",
        recommendation: current.recommendation || "Review",
        aiProvider: current.aiProvider || current.provider || "AI Engine",
        history: [
          { action: "Application received", date: current.appliedDateLabel, by: "Mobile App" },
          ...(current.aiStatus ? [{ action: `AI analysis ${current.aiStatus}`, date: current.appliedDateLabel, by: "AI Engine" }] : []),
          { action: `Current status: ${current.status}`, date: current.appliedDateLabel, by: "Web Dashboard" },
        ],
      });
    });
  }, [id]);

  const handleDownloadCv = async () => {
    if (!candidate?.cvUrl || downloadingCv) return;

    const fileName = getDownloadFileName(candidate);
    const downloadUrl = getCvDownloadUrl(candidate.cvUrl, fileName);
    setDownloadingCv(true);
    setDownloadError("");

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          throw new Error("Cloudinary bloque la livraison des PDF. Activez Allow delivery of PDF and ZIP files dans Cloudinary > Settings > Security.");
        }
        throw new Error(`Telechargement Cloudinary impossible (${response.status}).`);
      }
      downloadBlob(await response.blob(), fileName);
    } catch (error) {
      if (error instanceof TypeError) {
        openDirectDownload(downloadUrl, fileName);
        return;
      }
      setDownloadError(error.message || "Telechargement impossible.");
    } finally {
      setDownloadingCv(false);
    }
  };

  if (!candidate) {
    return (
      <div className="px-8 pb-10 pt-1">
        <button onClick={() => navigate(-1)} className="mb-5 text-sm font-semibold text-[#53648d] hover:text-[#071341]">Retour</button>
        <div className="rounded-2xl border border-white/70 bg-white/76 p-6 shadow-[0_18px_50px_rgba(25,54,105,0.10)] backdrop-blur-xl">
          Candidature introuvable.
        </div>
      </div>
    );
  }

  const score = Number(candidate.score) || 0;
  const matchScore = Number(candidate.matchingScore ?? candidate.score) || 0;
  const skills = candidate.skills.length
    ? candidate.skills
    : [{ name: "Aucune competence liee", level: 50, color: "#106fff" }];

  return (
    <div className="mx-auto w-full max-w-[1500px] px-7 pb-10 pt-1 text-[#071341]">
      <div className="mb-7 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#071341] transition hover:bg-white/60"
          aria-label="Retour"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-normal">Candidate Profile</h1>
          <p className="text-[16px] font-medium text-[#27385f]">Donnees synchronisees depuis Firestore</p>
        </div>
      </div>

      <section className="relative mb-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#062bc0] via-[#004fcf] to-[#001c77] px-10 py-10 text-white shadow-[0_22px_60px_rgba(0,40,130,0.26)]">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -right-14 bottom-[-130px] h-[330px] w-[620px] rounded-[100%] bg-[#138dff]/22 blur-sm" />
          <div className="absolute bottom-[-170px] right-[240px] h-[300px] w-[520px] rounded-[100%] bg-[#00115a]/28 blur-sm" />
          <div className="absolute left-[42%] top-16 h-32 w-52 bg-[radial-gradient(circle,rgba(255,255,255,0.20)_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>

        <div className="relative grid min-h-[230px] grid-cols-[1fr_220px] items-center gap-8 max-lg:grid-cols-1">
          <div className="flex min-w-0 items-center gap-8">
            <CandidateAvatar
              name={candidate.candidateName}
              photoUrl={candidate.photoUrl}
              className="h-[138px] w-[138px] border-[6px] border-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
              textClassName="text-4xl"
            />
            <div className="min-w-0">
              <h2 className="truncate text-[34px] font-extrabold leading-tight text-white">{candidate.candidateName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-xl bg-gradient-to-br from-[#436bff] to-[#07a8ff] px-4 py-2 text-[14px] font-extrabold text-white shadow-[0_12px_26px_rgba(0,36,128,0.25)]">
                  {candidate.role}
                </span>
                <span className="text-[17px] font-semibold text-white/95">• Profil candidat</span>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <MetaItem icon={Mail}>{candidate.candidateEmail || "Non renseigne"}</MetaItem>
                <MetaItem icon={Phone}>{candidate.phone}</MetaItem>
                <MetaItem icon={MapPin}>{candidate.location}</MetaItem>
                <MetaItem icon={Calendar}>Applied {candidate.appliedDate}</MetaItem>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 justify-self-end max-lg:justify-self-start">
            <PercentCircle value={score} size={166} stroke={9} color="#16d980" track="rgba(255,255,255,0.64)">
              <div>
                <p className="text-[34px] font-extrabold leading-none text-[#18d980]">{score}%</p>
                <p className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-white">AI Score</p>
                <p className="mt-2 text-[15px] font-semibold text-white">Match {matchScore}%</p>
              </div>
            </PercentCircle>
            <button
              type="button"
              onClick={handleDownloadCv}
              disabled={!candidate.cvUrl || downloadingCv}
              className="inline-flex h-12 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-7 text-[15px] font-extrabold text-[#115cff] shadow-[0_16px_34px_rgba(0,23,86,0.18)] transition hover:bg-white disabled:opacity-60"
            >
              <Download size={19} /> {downloadingCv ? "Downloading..." : "Download CV"}
            </button>
          </div>
        </div>
      </section>

      {downloadError && <p className="mb-3 text-sm font-semibold text-red-600">{downloadError}</p>}

      <div className="mb-4 flex w-fit items-center gap-6 rounded-[24px] bg-white/52 p-2 shadow-[0_14px_34px_rgba(25,54,105,0.10)] backdrop-blur-xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`h-10 rounded-[18px] px-8 text-[15px] font-extrabold transition ${
              activeTab === tab ? "bg-[#1265ff] text-white shadow-[0_12px_28px_rgba(18,101,255,0.25)]" : "text-[#425176] hover:bg-white/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1265ff]">
                <Brain size={23} />
              </div>
              <h3 className="text-[22px] font-extrabold">Skills</h3>
            </div>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div key={skill.name} className="grid grid-cols-[1fr_54px] items-center gap-5">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="truncate text-[16px] font-semibold">{skill.name}</span>
                      <span className="text-[16px] font-extrabold tabular-nums" style={{ color: skill.color || skillColors[index % skillColors.length] }}>
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#e9edf4]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${skill.level}%`, background: skill.color || skillColors[index % skillColors.length] }}
                      />
                    </div>
                  </div>
                  <PercentCircle value={skill.level} size={48} stroke={4} color={skill.color || skillColors[index % skillColors.length]}>
                    <span className="text-[11px] font-extrabold tabular-nums" style={{ color: skill.color || skillColors[index % skillColors.length] }}>
                      {skill.level}%
                    </span>
                  </PercentCircle>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1265ff]">
                <Calendar size={23} />
              </div>
              <h3 className="text-[22px] font-extrabold">Experience</h3>
            </div>
            <div className="space-y-6">
              {candidate.workHistory.map((entry, index) => (
                <div key={`${entry.title}-${index}`} className="relative pl-8">
                  <div className="absolute left-[7px] top-7 h-[74px] w-0.5 bg-[#b9cdf6]" />
                  <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-[#1265ff] shadow-[0_0_0_5px_rgba(18,101,255,0.10)]" />
                  <h4 className="text-[18px] font-extrabold">{entry.title}</h4>
                  <p className="mt-2 text-[15px] font-semibold text-[#1265ff]">{entry.company} <span className="text-[#6c7898]">• {entry.period}</span></p>
                  <p className="mt-4 text-[15px] font-medium leading-7 text-[#6c7898]">{entry.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === "AI Analysis" && (
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-start gap-4">
              <Brain size={24} className="mt-1 text-[#1265ff]" />
              <div>
                <h3 className="mb-2 text-lg font-extrabold">AI Summary - {candidate.recommendation}</h3>
                <p className="text-[15px] font-medium leading-7 text-[#5c6888]">{candidate.aiSummary}</p>
                <p className="mt-3 text-xs font-semibold text-[#7d88a3]">Provider: {candidate.aiProvider}</p>
              </div>
            </div>
          </GlassCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InfoList title="Strengths" tone="emerald" items={candidate.strengths} icon={CheckCircle} />
            <InfoList title="Skill Gaps" tone="amber" items={candidate.skillGaps} icon={XCircle} />
          </div>
          {(candidate.matchedRequirements.length > 0 || candidate.risks.length > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <InfoList title="Matched Requirements" tone="blue" items={candidate.matchedRequirements.length ? candidate.matchedRequirements : ["Aucune condition detaillee"]} icon={CheckCircle} />
              <InfoList title="Risks" tone="red" items={candidate.risks.length ? candidate.risks : ["Aucun risque detaille"]} icon={XCircle} />
            </div>
          )}
        </div>
      )}

      {activeTab === "Interview" && (
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold">Entretien candidat</h3>
              <p className="text-sm font-medium text-[#6c7898]">
                {candidate.interviewStatus === "submitted" ? "Reponses recues depuis l'application mobile." : "Passez le statut a Interview pour inviter le candidat."}
              </p>
            </div>
            <span className={`rounded-full px-4 py-2 text-xs font-extrabold ${candidate.interviewStatus === "submitted" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {candidate.interviewStatus === "submitted" ? "Recu" : candidate.status}
            </span>
          </div>
          {candidate.interviewAnswers.length > 0 ? (
            <div className="space-y-3">
              {candidate.interviewAnswers.map((item, index) => (
                <div key={`${item.question}-${index}`} className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="mb-2 text-xs font-extrabold text-emerald-700">Question {index + 1}</p>
                  <p className="mb-2 text-sm font-bold">{item.question}</p>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-[#5c6888]">{item.answer}</p>
                </div>
              ))}
            </div>
          ) : candidate.interviewQuestions.length > 0 ? (
            <div className="space-y-2">
              {candidate.interviewQuestions.map((question, index) => (
                <div key={`${question}-${index}`} className="rounded-xl border border-white/70 bg-white/56 p-3 text-sm font-semibold">
                  {question}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-[#6c7898]">Aucune reponse d'entretien pour le moment.</p>
          )}
        </GlassCard>
      )}

      {activeTab === "History" && (
        <GlassCard>
          <div className="space-y-4">
            {candidate.history.map((item, index) => (
              <div key={`${item.action}-${index}`} className="flex items-center gap-3 text-sm">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#1265ff]" />
                <div className="flex-1"><span className="font-bold">{item.action}</span></div>
                <span className="font-semibold text-[#6c7898]">{item.by}</span>
                <span className="font-semibold text-[#6c7898]">{item.date}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const GlassCard = ({ children }) => (
  <div className="min-h-[320px] rounded-[22px] border border-white/74 bg-white/82 p-8 shadow-[0_18px_50px_rgba(25,54,105,0.11)] backdrop-blur-xl">
    {children}
  </div>
);

const InfoList = ({ title, items, icon: Icon, tone }) => {
  const tones = {
    emerald: "text-emerald-600 bg-emerald-100",
    amber: "text-amber-600 bg-amber-100",
    blue: "text-blue-700 bg-blue-100",
    red: "text-red-600 bg-red-100",
  };

  return (
    <GlassCard>
      <h4 className={`mb-4 text-lg font-extrabold ${tones[tone]?.split(" ")[0] || "text-[#1265ff]"}`}>{title}</h4>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 text-[15px] font-semibold">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
              <Icon size={16} />
            </span>
            {item}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default CandidateDetailsPage;
