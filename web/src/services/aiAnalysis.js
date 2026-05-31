const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("Impossible de lire le PDF."));
    reader.readAsDataURL(file);
  });

const cleanJson = (value) => {
  const raw = String(value || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || raw;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("La reponse IA ne contient pas de JSON valide.");
  }

  return JSON.parse(source.slice(start, end + 1));
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeAnalysis = (data, job) => {
  const score = Math.max(0, Math.min(100, Math.round(Number(data.matchingScore ?? data.score ?? 0))));

  return {
    matchingScore: score,
    recommendation: data.recommendation || (score >= 75 ? "Shortlist" : score >= 55 ? "Review" : "Reject"),
    summary: data.summary || "Analyse terminee.",
    extractedSkills: normalizeList(data.extractedSkills),
    matchedRequirements: normalizeList(data.matchedRequirements),
    missingRequirements: normalizeList(data.missingRequirements ?? data.skillGaps),
    strengths: normalizeList(data.strengths),
    risks: normalizeList(data.risks),
    interviewQuestions: normalizeList(data.interviewQuestions),
    jobTitle: job?.title || "Offre selectionnee",
    analyzedAt: new Date().toISOString(),
    provider: data.provider || "AI API",
  };
};

const buildPrompt = (job) => `
Tu es un assistant RH senior. Analyse le CV PDF fourni et compare-le strictement avec cette offre.

Offre:
- Titre: ${job?.title || "Non renseigne"}
- Departement: ${job?.department || "Non renseigne"}
- Localisation: ${job?.location || "Non renseigne"}
- Type: ${job?.type || "Non renseigne"}
- Salaire: ${job?.salaryMin || ""} ${job?.salaryMax ? `- ${job.salaryMax}` : ""}
- Competences requises: ${(job?.skills || []).join(", ") || "Non renseignees"}
- Description: ${job?.description || "Non renseignee"}

Retourne uniquement un JSON valide avec ces champs:
{
  "matchingScore": number de 0 a 100,
  "recommendation": "Shortlist" | "Review" | "Reject",
  "summary": "resume court en francais",
  "extractedSkills": ["competences detectees dans le CV"],
  "matchedRequirements": ["conditions de l'offre satisfaites"],
  "missingRequirements": ["conditions manquantes ou faibles"],
  "strengths": ["points forts"],
  "risks": ["risques RH ou points a verifier"],
  "interviewQuestions": ["questions d'entretien ciblees"]
}
`;

const analyzeWithProxy = async ({ file, job }) => {
  const formData = new FormData();
  formData.append("cv", file);
  formData.append("job", JSON.stringify(job));

  const response = await fetch(import.meta.env.VITE_AI_ANALYSIS_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API d'analyse indisponible (${response.status}).`);
  }

  return normalizeAnalysis(await response.json(), job);
};

const analyzeWithGemini = async ({ file, job }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
  const base64 = await fileToBase64(file);

  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(job) },
            {
              inline_data: {
                mime_type: file.type || "application/pdf",
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API indisponible (${response.status}).`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n");
  return normalizeAnalysis({ ...cleanJson(text), provider: "Gemini" }, job);
};

export const analyzeCvAgainstJob = async ({ file, job }) => {
  if (!file) throw new Error("Veuillez uploader un CV PDF.");
  if (!job?.id) throw new Error("Veuillez selectionner une offre.");

  if (import.meta.env.VITE_AI_ANALYSIS_API_URL) {
    return analyzeWithProxy({ file, job });
  }

  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return analyzeWithGemini({ file, job });
  }

  throw new Error("Configurez VITE_AI_ANALYSIS_API_URL ou VITE_GEMINI_API_KEY pour activer l'analyse PDF.");
};
