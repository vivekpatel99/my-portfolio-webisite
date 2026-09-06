export const PROJECT_TYPE = {
  DOCUMENT_WEB_EXTRACTION: "document-web-extraction",
  WORKFLOW_AUTOMATION: "workflow-automation",
  COMPUTER_VISION: "computer-vision",
} as const;

export const TIMELINE = {
  EXPLORING: "exploring",
  WITHIN_ONE_MONTH: "within-one-month",
  ONE_TO_THREE_MONTHS: "one-to-three-months",
  FLEXIBLE: "flexible",
} as const;

export const CURRENT_BLOCKER = {
  DEFINING_INPUTS: "defining-inputs",
  DEFINING_HANDOFF: "defining-handoff",
  WORKFLOW_RELIABILITY: "workflow-reliability",
  REVIEW_OWNERSHIP: "review-ownership",
} as const;

export const INQUIRY_ORIGIN = {
  SERVICE: "service",
  CASE_STUDY: "case-study",
  FIT_DIAGNOSTIC: "fit-diagnostic",
} as const;

export const FIT_DECISION = {
  STRONG: "strong-fit",
  POSSIBLE: "possible-fit",
  NOT_RECOMMENDED: "not-recommended",
} as const;

export const PROJECT_TYPE_OPTIONS = [
  [PROJECT_TYPE.DOCUMENT_WEB_EXTRACTION, "Document or web-data extraction"],
  [PROJECT_TYPE.WORKFLOW_AUTOMATION, "Workflow automation"],
  [PROJECT_TYPE.COMPUTER_VISION, "Computer vision with supplied still images"],
] as const;

export const TIMELINE_OPTIONS = [
  [TIMELINE.EXPLORING, "Exploring the scope"],
  [TIMELINE.WITHIN_ONE_MONTH, "Within one month"],
  [TIMELINE.ONE_TO_THREE_MONTHS, "One to three months"],
  [TIMELINE.FLEXIBLE, "Flexible timing"],
] as const;

export const CURRENT_BLOCKER_OPTIONS = [
  [CURRENT_BLOCKER.DEFINING_INPUTS, "Clarifying available inputs or access"],
  [CURRENT_BLOCKER.DEFINING_HANDOFF, "Defining fields, destination, or handoff"],
  [CURRENT_BLOCKER.WORKFLOW_RELIABILITY, "Making an existing workflow more reviewable"],
  [CURRENT_BLOCKER.REVIEW_OWNERSHIP, "Clarifying who reviews exceptions"],
] as const;

const caseStudies = {
  "n8n-openai-data-extraction": {
    projectType: PROJECT_TYPE.DOCUMENT_WEB_EXTRACTION,
    label: "n8n + OpenAI Data Extraction",
  },
  "invoice-ocr-extraction": {
    projectType: PROJECT_TYPE.DOCUMENT_WEB_EXTRACTION,
    label: "Invoice OCR Client-Field Extraction",
  },
  "yolo-computer-vision-optimization": {
    projectType: PROJECT_TYPE.COMPUTER_VISION,
    label: "YOLO Pose Estimation on Still Images",
  },
} as const;

export const INQUIRY_CONTEXT_CASE_STUDY_SLUGS = [
  "n8n-openai-data-extraction",
  "invoice-ocr-extraction",
  "yolo-computer-vision-optimization",
] as const;

const serviceByProjectType = {
  [PROJECT_TYPE.DOCUMENT_WEB_EXTRACTION]: "document-web-extraction",
  [PROJECT_TYPE.WORKFLOW_AUTOMATION]: "workflow-automation",
  [PROJECT_TYPE.COMPUTER_VISION]: "computer-vision",
} as const;

const labels = {
  projectType: Object.fromEntries(PROJECT_TYPE_OPTIONS),
  timeline: Object.fromEntries(TIMELINE_OPTIONS),
  currentBlocker: Object.fromEntries(CURRENT_BLOCKER_OPTIONS),
  fitDecision: {
    [FIT_DECISION.STRONG]: "Strong Fit (scope check)",
    [FIT_DECISION.POSSIBLE]: "Possible Fit (scope check)",
    [FIT_DECISION.NOT_RECOMMENDED]: "Not Recommended (scope check)",
  },
  service: {
    "document-web-extraction": "Document and web-data extraction",
    "workflow-automation": "Workflow automation",
    "computer-vision": "Computer vision with supplied still images",
  },
} as const;

export type InquiryContext = {
  origin?: (typeof INQUIRY_ORIGIN)[keyof typeof INQUIRY_ORIGIN];
  projectType?: (typeof PROJECT_TYPE)[keyof typeof PROJECT_TYPE];
  serviceId?: (typeof serviceByProjectType)[keyof typeof serviceByProjectType];
  caseStudySlug?: keyof typeof caseStudies;
  fitDecision?: (typeof FIT_DECISION)[keyof typeof FIT_DECISION];
  timeline?: (typeof TIMELINE)[keyof typeof TIMELINE];
  currentBlocker?: (typeof CURRENT_BLOCKER)[keyof typeof CURRENT_BLOCKER];
};

const hasOwn = (record: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key);
const hasValue = <T extends Record<string, unknown>>(record: T, key: string) =>
  hasOwn(record, key) && record[key] !== undefined;
const isOneOf = (value: unknown, options: readonly string[]) =>
  typeof value === "string" && options.includes(value);
const projectTypes = PROJECT_TYPE_OPTIONS.map(([value]) => value);
const timelines = TIMELINE_OPTIONS.map(([value]) => value);
const blockers = CURRENT_BLOCKER_OPTIONS.map(([value]) => value);
const origins = Object.values(INQUIRY_ORIGIN);
const decisions = Object.values(FIT_DECISION);
const caseStudySlugs = INQUIRY_CONTEXT_CASE_STUDY_SLUGS;

export function serviceForProjectType(projectType: string | undefined) {
  return projectType ? serviceByProjectType[projectType as keyof typeof serviceByProjectType] : undefined;
}

export function createDirectInquiryContext(fields: {
  projectType?: string;
  timeline?: string;
  currentBlocker?: string;
}): InquiryContext | undefined {
  const projectType = isOneOf(fields.projectType, projectTypes) ? fields.projectType : undefined;
  const timeline = isOneOf(fields.timeline, timelines) ? fields.timeline : undefined;
  const currentBlocker = isOneOf(fields.currentBlocker, blockers) ? fields.currentBlocker : undefined;
  if (!projectType && !timeline && !currentBlocker) return undefined;
  return {
    ...(projectType ? { projectType } : {}),
    ...(timeline ? { timeline } : {}),
    ...(currentBlocker ? { currentBlocker } : {}),
  } as InquiryContext;
}

export function createServiceInquiryContext(serviceId: string): InquiryContext | undefined {
  const projectType = Object.entries(serviceByProjectType)
    .find(([, value]) => value === serviceId)?.[0];
  if (!projectType) return undefined;
  return { origin: INQUIRY_ORIGIN.SERVICE, serviceId, projectType } as InquiryContext;
}

export function createCaseStudyInquiryContext(caseStudySlug: string): InquiryContext | undefined {
  const caseStudy = caseStudies[caseStudySlug as keyof typeof caseStudies];
  if (!caseStudy) return undefined;
  return {
    origin: INQUIRY_ORIGIN.CASE_STUDY,
    caseStudySlug,
    projectType: caseStudy.projectType,
    serviceId: serviceForProjectType(caseStudy.projectType),
  } as InquiryContext;
}

export function createFitDiagnosticInquiryContext(
  decision: string,
  projectType?: string,
): InquiryContext | undefined {
  if (!isOneOf(decision, decisions)) return undefined;
  const safeProjectType = isOneOf(projectType, projectTypes) ? projectType : undefined;
  return {
    origin: INQUIRY_ORIGIN.FIT_DIAGNOSTIC,
    fitDecision: decision,
    ...(safeProjectType ? { projectType: safeProjectType } : {}),
    ...(serviceForProjectType(safeProjectType) ? { serviceId: serviceForProjectType(safeProjectType) } : {}),
  } as InquiryContext;
}

export function normalizeInquiryContext(input: unknown): InquiryContext | undefined {
  if (input === undefined || input === null) return undefined;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid estimate context.");
  }
  const context = input as Record<string, unknown>;
  if (Object.keys(context).length === 0) return undefined;
  const allowedKeys = ["origin", "projectType", "serviceId", "caseStudySlug", "fitDecision", "timeline", "currentBlocker"];
  if (Object.keys(context).some((key) => !allowedKeys.includes(key))) {
    throw new Error("Invalid estimate context.");
  }
  if (hasValue(context, "origin") && !isOneOf(context.origin, origins)) throw new Error("Invalid estimate context.");
  for (const [key, options] of Object.entries({
    projectType: projectTypes,
    serviceId: Object.values(serviceByProjectType),
    caseStudySlug: caseStudySlugs,
    fitDecision: decisions,
    timeline: timelines,
    currentBlocker: blockers,
  })) {
    if (hasValue(context, key) && !isOneOf(context[key], options)) {
      throw new Error("Invalid estimate context.");
    }
  }
  const projectType = context.projectType as string | undefined;
  const expectedService = serviceForProjectType(projectType);
  if (context.origin === INQUIRY_ORIGIN.SERVICE) {
    if (!expectedService || context.serviceId !== expectedService || hasValue(context, "caseStudySlug") || hasValue(context, "fitDecision")) {
      throw new Error("Invalid estimate context.");
    }
  }
  if (context.origin === INQUIRY_ORIGIN.CASE_STUDY) {
    const caseStudy = caseStudies[context.caseStudySlug as keyof typeof caseStudies];
    if (!caseStudy || projectType !== caseStudy.projectType || context.serviceId !== expectedService || context.fitDecision !== undefined) {
      throw new Error("Invalid estimate context.");
    }
  }
  if (context.origin === INQUIRY_ORIGIN.FIT_DIAGNOSTIC) {
    if (!hasOwn(context, "fitDecision") || hasValue(context, "caseStudySlug") || (hasValue(context, "serviceId") && context.serviceId !== expectedService)) {
      throw new Error("Invalid estimate context.");
    }
  }
  if (context.origin === undefined && (hasValue(context, "serviceId") || hasValue(context, "caseStudySlug") || hasValue(context, "fitDecision"))) {
    throw new Error("Invalid estimate context.");
  }
  if (!projectType && !context.timeline && !context.currentBlocker && !context.fitDecision) {
    throw new Error("Invalid estimate context.");
  }
  return {
    ...(context.origin ? { origin: context.origin as string } : {}),
    ...(projectType ? { projectType } : {}),
    ...(context.serviceId ? { serviceId: context.serviceId as string } : {}),
    ...(context.caseStudySlug ? { caseStudySlug: context.caseStudySlug as string } : {}),
    ...(context.fitDecision ? { fitDecision: context.fitDecision as string } : {}),
    ...(context.timeline ? { timeline: context.timeline as string } : {}),
    ...(context.currentBlocker ? { currentBlocker: context.currentBlocker as string } : {}),
  } as InquiryContext;
}

export function formatInquiryContext(context: InquiryContext | undefined): string[] {
  if (!context) return [];
  const lines = ["Estimate context (informational only):"];
  if (context.projectType) lines.push(`Project type: ${labels.projectType[context.projectType as keyof typeof labels.projectType]}`);
  if (context.serviceId) lines.push(`Published service area: ${labels.service[context.serviceId as keyof typeof labels.service]}`);
  if (context.caseStudySlug) lines.push(`Case study viewed: ${caseStudies[context.caseStudySlug as keyof typeof caseStudies].label}`);
  if (context.fitDecision) lines.push(`Scope-check result: ${labels.fitDecision[context.fitDecision as keyof typeof labels.fitDecision]}`);
  if (context.timeline) lines.push(`Timing: ${labels.timeline[context.timeline as keyof typeof labels.timeline]}`);
  if (context.currentBlocker) lines.push(`Current blocker: ${labels.currentBlocker[context.currentBlocker as keyof typeof labels.currentBlocker]}`);
  return lines;
}

export function inquiryContextSummary(context: InquiryContext | undefined): string[] {
  return formatInquiryContext(context).slice(1);
}
