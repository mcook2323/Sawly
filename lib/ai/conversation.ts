import type { DesignAnswers, DesignAnswerValue, DesignProfile, DesignQuestion, DesignQuestionId } from "@/types/ai";

const PROJECT_DEPENDENCIES: DesignQuestionId[] = ["dimensions", "capacity"];

export function updateConversationAnswer(answers: DesignAnswers, order: DesignQuestionId[], id: DesignQuestionId, value: DesignAnswerValue) {
  const invalidated = id === "projectType" ? PROJECT_DEPENDENCIES : [];
  const nextAnswers = Object.fromEntries(Object.entries(answers).filter(([key]) => !invalidated.includes(key as DesignQuestionId))) as DesignAnswers;
  nextAnswers[id] = value;
  return { answers: nextAnswers, order: [...order.filter((item) => !invalidated.includes(item)), ...(!order.includes(id) ? [id] : [])] };
}

export function getConversationQuestions(profile: DesignProfile, answers: DesignAnswers): DesignQuestion[] {
  const questions: DesignQuestion[] = [];
  if (profile.projectType === "unknown" && !("projectType" in answers)) questions.push({ id: "projectType", prompt: "Which kind of project do you mean?", helpText: "This helps Sawly avoid recommending the wrong kind of outdoor furniture.", type: "choice", required: true, options: [{ label: "Outdoor Table", value: "table" }, { label: "Outdoor Bench", value: "bench" }, { label: "Something else", value: "unknown" }] });
  if (!profile.environment && !("environment" in answers)) questions.push({ id: "environment", prompt: "Where will you use it?", type: "choice", required: true, options: [{ label: "Outdoors", value: "outdoor" }, { label: "Indoors", value: "indoor" }, { label: "Either", value: "either" }] });
  if (!answers.intendedUse) questions.push({ id: "intendedUse", prompt: "How do you plan to use it?", helpText: "A short phrase is enough—for example, family dining or extra patio seating.", type: "text", required: true });
  if (Object.keys(profile.dimensions).length === 0 && !("dimensions" in answers)) questions.push({ id: "dimensions", prompt: "What approximate size should it be?", helpText: "Enter length × width/depth × height in inches. You can refine exact measurements later.", type: "dimensions", required: false });
  if ((profile.projectType === "table" || profile.projectType === "bench") && !profile.capacity && !("capacity" in answers)) questions.push({ id: "capacity", prompt: profile.projectType === "table" ? "How many people should it seat?" : "How many people should fit comfortably?", type: "number", required: false });
  if (!profile.material && !("material" in answers)) questions.push({ id: "material", prompt: "Do you have a material preference?", type: "choice", required: false, options: [{ label: "Pine", value: "pine" }, { label: "Cedar", value: "cedar" }, { label: "Pressure-treated", value: "treated" }, { label: "No preference", value: "unspecified" }] });
  if (!profile.style && !("style" in answers)) questions.push({ id: "style", prompt: "Which style feels right?", type: "choice", required: false, options: [{ label: "Modern", value: "modern" }, { label: "Minimal", value: "minimal" }, { label: "Rustic", value: "rustic" }, { label: "Traditional", value: "traditional" }, { label: "No preference", value: "unspecified" }] });
  if (!answers.budget) questions.push({ id: "budget", prompt: "What material budget are you aiming for?", type: "choice", required: false, options: [{ label: "Under $100", value: "under-100" }, { label: "$100–$250", value: "100-250" }, { label: "$250–$500", value: "250-500" }, { label: "Flexible", value: "flexible" }] });
  return questions;
}

export function getNextQuestion(profile: DesignProfile, answers: DesignAnswers) { return getConversationQuestions(profile, answers)[0] ?? null; }
