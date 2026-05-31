import { ArrowLeft, Brain, CheckCircle, MessageSquare, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { subscribeApplications } from "@/services/recruitment";

const DetailList = ({ title, items, icon: Icon, color }) => (
  <div className="card-premium">
    <h4 className={`text-sm font-semibold mb-3 ${color}`}>{title}</h4>
    <div className="space-y-2">
      {(items.length ? items : ["Aucun element"]).map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-start gap-2 text-sm">
          <Icon size={14} className={`${color} mt-0.5 shrink-0`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

const AIAnalysisDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);

  useEffect(() => subscribeApplications(setApplications), []);

  const candidate = useMemo(
    () => applications.find((item) => item.id === id),
    [applications, id],
  );

  const strengths = candidate?.strengths?.length
    ? candidate.strengths
    : candidate?.extractedSkills?.length
      ? candidate.extractedSkills
      : candidate?.jobSkills?.length
        ? candidate.jobSkills
        : ["Dossier complet"];
  const matchedRequirements = candidate?.matchedRequirements?.length
    ? candidate.matchedRequirements
    : candidate?.extractedSkills || [];
  const skillGaps = candidate?.skillGaps || [];
  const risks = candidate?.risks || [];
  const interviewQuestions = candidate?.interviewQuestions || [];

  if (!candidate) {
    return (
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/ai-analysis")} className="text-sm text-muted-foreground hover:text-foreground">
          Retour aux analyses
        </button>
        <div className="card-premium">Analyse introuvable.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/ai-analysis")} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">AI Analysis Details</h1>
          <p className="text-sm text-muted-foreground">{candidate.candidateName} - {candidate.role}</p>
        </div>
      </div>

      <div className="card-premium bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Brain size={20} className="text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm mb-1">AI Summary - {candidate.recommendation || "Review"}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{candidate.aiSummary || "Analyse automatique terminee."}</p>
            <p className="text-[10px] text-muted-foreground mt-2">Provider: {candidate.aiProvider || candidate.provider || "AI Engine"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetailList title="Strengths" items={strengths} icon={CheckCircle} color="text-emerald-500" />
        <DetailList title="Skill Gaps" items={skillGaps} icon={XCircle} color="text-amber-500" />
        <DetailList title="Matched Requirements" items={matchedRequirements} icon={CheckCircle} color="text-primary" />
        <DetailList title="Risks" items={risks} icon={XCircle} color="text-red-500" />
      </div>

      {interviewQuestions.length > 0 && (
        <DetailList title="Interview Questions" items={interviewQuestions} icon={MessageSquare} color="text-primary" />
      )}

      {candidate.cvTextPreview && (
        <div className="card-premium">
          <h4 className="text-sm font-semibold mb-3">Extrait du PDF analyse</h4>
          <p className="text-xs text-muted-foreground leading-6 whitespace-pre-wrap">{candidate.cvTextPreview}</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisDetails;
