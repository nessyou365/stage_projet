import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, GitBranch, Mail, MoreHorizontal, UserRound } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeApplications, updateApplicationDecision } from "@/services/recruitment";

const stageMeta = {
  Applied: { top: "border-t-primary", bg: "bg-primary/5", label: "Applied" },
  Reviewed: { top: "border-t-secondary", bg: "bg-secondary/5", label: "Reviewed" },
  Interview: { top: "border-t-accent", bg: "bg-accent/5", label: "Interview" },
  Offered: { top: "border-t-emerald-500", bg: "bg-emerald-500/5", label: "Offered" },
  Accepted: { top: "border-t-emerald-600", bg: "bg-emerald-600/5", label: "Accepted" },
  Rejected: { top: "border-t-destructive", bg: "bg-destructive/5", label: "Rejected" },
};

const stages = ["Applied", "Reviewed", "Interview", "Offered", "Accepted", "Rejected"];

const normalizePipelineStatus = (status) => {
  if (status === "Approved") return "Accepted";
  if (stages.includes(status)) return status;
  return "Applied";
};

const scoreColor = (score) => score >= 85 ? "text-emerald-500" : score >= 70 ? "text-amber-500" : "text-red-500";

const PipelineCard = ({ candidate, onMove }) => {
  const stageIndex = stages.indexOf(candidate.pipelineStatus);
  const canMoveBack = stageIndex > 0;
  const canMoveNext = stageIndex >= 0 && stageIndex < stages.length - 1;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <CandidateAvatar name={candidate.candidateName} photoUrl={candidate.candidatePhotoUrl || candidate.photoUrl} className="h-9 w-9" textClassName="text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold truncate">{candidate.candidateName}</h4>
            <span className={`text-sm font-bold ${scoreColor(candidate.score || 0)}`}>{candidate.score || 0}%</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{candidate.role}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1.5 truncate"><Mail size={11} /> {candidate.candidateEmail}</p>
        <p className="flex items-center gap-1.5"><Calendar size={11} /> {candidate.appliedDateLabel}</p>
        <p className="flex items-center gap-1.5"><UserRound size={11} /> Match {candidate.matchingScore || 0}%</p>
      </div>

      {candidate.aiSummary && (
        <p className="mt-3 line-clamp-2 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
          {candidate.aiSummary}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={!canMoveBack}
          onClick={() => onMove(candidate, stages[stageIndex - 1])}
          className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-35 disabled:pointer-events-none"
          title="Etape precedente"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          type="button"
          disabled={!canMoveNext}
          onClick={() => onMove(candidate, stages[stageIndex + 1])}
          className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-35 disabled:pointer-events-none"
        >
          Move to {canMoveNext ? stages[stageIndex + 1] : candidate.pipelineStatus}
        </button>
        <button
          type="button"
          disabled={!canMoveNext}
          onClick={() => onMove(candidate, stages[stageIndex + 1])}
          className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-35 disabled:pointer-events-none"
          title="Etape suivante"
        >
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

const Pipeline = () => {
  const [applications, setApplications] = useState([]);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => subscribeApplications(setApplications), []);

  const grouped = useMemo(() => {
    const initial = Object.fromEntries(stages.map((stage) => [stage, []]));

    applications.forEach((application) => {
      const pipelineStatus = normalizePipelineStatus(application.status);
      initial[pipelineStatus].push({ ...application, pipelineStatus });
    });

    return initial;
  }, [applications]);

  const handleMove = async (candidate, nextStatus) => {
    setError("");
    setUpdatingId(candidate.id);

    try {
      await updateApplicationDecision(candidate.id, nextStatus);
    } catch (err) {
      setError(err.message || "Mise a jour du pipeline impossible.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recruitment Pipeline</h1>
        <p className="text-sm text-muted-foreground">Suivez et deplacez les candidats entre les etapes du recrutement</p>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const candidates = grouped[stage] || [];
          const meta = stageMeta[stage];

          return (
            <div key={stage} className="min-w-[280px] flex-shrink-0">
              <div className={`rounded-xl border border-border/50 ${meta.bg} border-t-4 ${meta.top}`}>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{meta.label}</h3>
                    <span className="bg-muted text-muted-foreground text-[10px] rounded-full h-5 px-2 flex items-center font-medium">{candidates.length}</span>
                  </div>
                  <button className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                <div className="px-3 pb-3 space-y-2 min-h-[160px]">
                  {candidates.length === 0 ? (
                    <div className="text-center py-8">
                      <GitBranch size={20} className="mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Pas de candidats</p>
                    </div>
                  ) : (
                    candidates.map((candidate) => (
                      <div key={candidate.id} className={updatingId === candidate.id ? "opacity-60 pointer-events-none" : ""}>
                        <PipelineCard candidate={candidate} onMove={handleMove} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
