import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/services/firebase";

const toDateLabel = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("fr-FR") : "Aujourd'hui";
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeApplication = (docSnap) => {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    ...data,
    candidateName: data.candidateName || "Candidat",
    candidateEmail: data.candidateEmail || "Non renseigne",
    role: data.role || data.jobTitle || "Candidature",
    experience: data.experience || "Profil candidat",
    location: data.location || "Non renseigne",
    status: data.status || "Applied",
    score: toNumber(data.score),
    matchingScore: toNumber(data.matchingScore ?? data.score),
    appliedDateLabel: toDateLabel(data.createdAt),
  };
};

const normalizeSpontaneousApplication = (docSnap) => {
  const data = docSnap.data();
  const fallbackName = data.candidateName || data.name || data.email?.split("@")?.[0] || "Candidat";

  return {
    id: docSnap.id,
    ...data,
    source: "spontaneous",
    candidateName: fallbackName,
    candidateEmail: data.candidateEmail || data.email || "Non renseigne",
    role: data.role || "Candidature spontanee",
    status: data.status || "New",
    score: toNumber(data.score, 0),
    matchingScore: toNumber(data.matchingScore ?? data.score, 0),
    description: data.description || data.message || "",
    appliedDateLabel: toDateLabel(data.createdAt),
  };
};


// ================= JOBS =================

export const subscribeJobs = (callback) => {
  return onSnapshot(
    query(collection(db, "jobs"), orderBy("createdAt", "desc")),
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  );
};


export const saveJob = async (job, user) => {
  const payload = {
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    salaryMin: job.salaryMin || "",
    salaryMax: job.salaryMax || "",
    skills: job.skills || [],
    description: job.description,
    status: job.status || "Published",

    createdByName: user?.userName || "RH",
    createdByEmail: user?.userEmail || "",

    updatedAt: serverTimestamp(),
  };

  if (job.id) {
    await updateDoc(doc(db, "jobs", job.id), payload);
    return job.id;
  }

  const created = await addDoc(collection(db, "jobs"), {
    ...payload,
    applicants: 0,
    createdAt: serverTimestamp(),
  });

  return created.id;
};


export const removeJob = async (jobId) => {
  await deleteDoc(doc(db, "jobs", jobId));
};


// ================= APPLICATIONS =================

export const subscribeApplications = (callback) => {
  return onSnapshot(
    query(collection(db, "applications"), orderBy("createdAt", "desc")),
    async (snap) => {

      const apps = snap.docs.map(normalizeApplication);

      callback(apps);
    }
  );
};

export const updateApplicationAiStatus = async (id, payload) => {
  await updateDoc(doc(db, "applications", id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const saveApplicationAnalysis = async (id, analysis) => {
  await updateApplicationAiStatus(id, {
    aiStatus: "completed",
    aiProvider: analysis.provider || "AI Engine",
    recommendation: analysis.recommendation || "Review",
    score: Number(analysis.aiScore ?? analysis.matchingScore ?? 0),
    aiScore: Number(analysis.aiScore ?? analysis.matchingScore ?? 0),
    matchingScore: Number(analysis.matchingScore ?? analysis.score ?? 0),
    aiSummary: analysis.aiSummary || analysis.summary || "Analyse automatique terminee.",
    extractedSkills: analysis.extractedSkills || [],
    skillGaps: analysis.skillGaps || analysis.missingRequirements || [],
    matchedRequirements: analysis.matchedRequirements || [],
    strengths: analysis.strengths || [],
    risks: analysis.risks || [],
    interviewQuestions: analysis.interviewQuestions || [],
    cvTextPreview: analysis.cvTextPreview || "",
    analyzedAt: analysis.analyzedAt || new Date().toISOString(),
  });
};

export const subscribeSpontaneousApplications = (callback) => {
  return onSnapshot(
    query(collection(db, "spontaneous"), orderBy("createdAt", "desc")),
    (snap) => {
      callback(snap.docs.map(normalizeSpontaneousApplication));
    },
  );
};


// ================= DASHBOARD =================

export const subscribeDashboardData = (callback) => {
  let jobs = [];
  let applications = [];

  const publish = () => {
    const uniqueCandidates = new Set(applications.map((app) => app.userId || app.candidateEmail || app.candidateName));
    const activeJobs = jobs.filter((job) => job.status === "Published").length;
    const hired = applications.filter((app) => app.status === "Accepted").length;
    const currentMonth = new Date().getMonth();
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const visibleMonths = Array.from({ length: 4 }, (_, index) => (currentMonth - 3 + index + 12) % 12);
    const statuses = ["Applied", "Reviewed", "Interview", "Offered"];

    callback({
      stats: [
        { label: "Total Candidates", value: uniqueCandidates.size, icon: "users", note: `${applications.length} candidatures` },
        { label: "Active Jobs", value: activeJobs, icon: "briefcase", note: `${jobs.length} offres` },
        { label: "Applications", value: applications.length, icon: "brain", note: "synchronisees" },
        { label: "Hired This Month", value: hired, icon: "check", note: "statut Accepted" },
      ],
      applicationData: visibleMonths.map((month) => ({
        month: monthLabels[month],
        applications: applications.filter((app) => app.createdAt?.toDate?.().getMonth() === month).length,
        hired: applications.filter((app) => app.status === "Accepted" && app.updatedAt?.toDate?.().getMonth() === month).length,
      })),
      pipelineData: statuses.map((status) => ({
        name: status,
        value: applications.filter((app) => app.status === status).length,
        color: {
          Applied: "hsl(230, 75%, 55%)",
          Reviewed: "hsl(265, 60%, 55%)",
          Interview: "hsl(25, 95%, 55%)",
          Offered: "hsl(150, 60%, 45%)",
        }[status],
      })),
      recentCandidates: applications.slice(0, 5),
    });
  };

  const unsubscribeJobs = subscribeJobs((items) => {
    jobs = items;
    publish();
  });

  const unsubscribeApplications = subscribeApplications((items) => {
    applications = items;
    publish();
  });

  return () => {
    unsubscribeJobs();
    unsubscribeApplications();
  };
};


// ================= UPDATE STATUS =================

export const updateApplicationDecision = async (id, status, hrNote = "") => {

  const ref = doc(db, "applications", id);

  const appSnap = await getDoc(ref);
  const data = appSnap.data();
  const wasInterview = data?.status === "Interview";

  // update status
  const interviewPayload = status === "Interview" && !wasInterview
    ? {
        interviewStatus: data?.interviewStatus || "pending",
        interviewRequestedAt: serverTimestamp(),
      }
    : {};

  await updateDoc(ref, {
    status,
    hrNote,
    ...interviewPayload,
    updatedAt: serverTimestamp(),
  });

  // 🔔 send notification to candidate
  if (data?.userId) {
    const notificationContent = {
      Interview: {
        title: "Entretien a passer",
        message: `Votre candidature pour ${data.role || data.jobTitle || "l'offre"} passe a l'etape entretien. Ouvrez cette notification pour repondre aux questions.`,
        type: "interview",
      },
      Offered: {
        title: "Suite favorable",
        message: `Votre entretien pour ${data.role || data.jobTitle || "l'offre"} avance vers l'etape offre.`,
        type: "status",
      },
      Accepted: {
        title: "Candidature acceptee",
        message: `Bonne nouvelle, votre candidature pour ${data.role || data.jobTitle || "l'offre"} a ete acceptee.`,
        type: "status",
      },
      Rejected: {
        title: "Candidature refusee",
        message: `Votre candidature pour ${data.role || data.jobTitle || "l'offre"} n'a pas ete retenue.`,
        type: "status",
      },
    }[status] || {
      title: "Mise a jour de votre candidature",
      message: `Votre candidature est maintenant: ${status}`,
      type: "status",
    };

    await addDoc(
      collection(db, "notifications", data.userId, "items"),
      {
        title: "Mise à jour de votre candidature",
        message: `Votre candidature est maintenant: ${status}`,
        type: "status",
        ...notificationContent,
        applicationId: id,
        status,
        jobTitle: data.role || data.jobTitle || "Offre",
        read: false,
        createdAt: serverTimestamp(),
      }
    );
  }
};

export const updateSpontaneousDecision = async (id, status, hrNote = "") => {
  const ref = doc(db, "spontaneous", id);
  const snap = await getDoc(ref);
  const data = snap.data();

  await updateDoc(ref, {
    status,
    hrNote,
    updatedAt: serverTimestamp(),
  });

  if (data?.userId) {
    await addDoc(
      collection(db, "notifications", data.userId, "items"),
      {
        title: "Mise a jour de votre candidature spontanee",
        message: `Votre candidature spontanee est maintenant: ${status}`,
        type: "status",
        read: false,
        createdAt: serverTimestamp(),
      },
    );
  }
};
