import { caseStudies } from '../data/caseStudies.js';

export const DECISION = Object.freeze({
  STRONG_FIT: 'Strong Fit',
  POSSIBLE_FIT: 'Possible Fit',
  NOT_RECOMMENDED: 'Not Recommended',
});

export const PROJECT_TYPE = Object.freeze({
  DOCUMENT_WEB_EXTRACTION: 'document-web-extraction',
  WORKFLOW_AUTOMATION: 'workflow-automation',
  COMPUTER_VISION: 'computer-vision',
  OUT_OF_SCOPE: 'out-of-scope',
  UNKNOWN: 'unknown',
});

// This order is the public decision contract. The first applicable rule wins.
export const DECISION_PRECEDENCE = Object.freeze([
  'unsafe-boundary',
  'out-of-scope',
  'missing-or-unclear-requirements',
  'computer-vision-limited-proof',
  'unknown-input',
  'supported-reviewed-work',
]);

const CASE_STUDY_PROOF = Object.freeze({
  n8n: { claimId: 'n8n-document-web-extraction-workflow', slug: 'n8n-openai-data-extraction' },
  invoice: { claimId: 'ocr-client-fields-to-spreadsheet', slug: 'invoice-ocr-extraction' },
  pose: { claimId: 'yolo-still-image-pose-estimation', slug: 'yolo-computer-vision-optimization' },
});

const DOMAIN = Object.freeze({
  [PROJECT_TYPE.DOCUMENT_WEB_EXTRACTION]: {
    label: 'document and web-data extraction',
    proof: [CASE_STUDY_PROOF.n8n, CASE_STUDY_PROOF.invoice],
    reason: 'Published work supports mapping available document or web inputs to explicit fields and reviewable records.',
    risk: 'Published proof covers defined extraction paths and review handoffs; each source layout and field mapping still needs checking.',
    nextStep: 'Review representative source material against the exact fields, destination, and exception owner.',
  },
  [PROJECT_TYPE.WORKFLOW_AUTOMATION]: {
    label: 'workflow automation',
    proof: [CASE_STUDY_PROOF.n8n],
    reason: 'Published work supports inspectable extraction, validation, and handoff stages for a defined workflow.',
    risk: 'Published proof covers a reviewed workflow pattern; integrations, exceptions, and handoff ownership need checking in the proposed environment.',
    nextStep: 'Map the current inputs, handoffs, exceptions, and the person responsible for reviewing them.',
  },
  [PROJECT_TYPE.COMPUTER_VISION]: {
    label: 'computer vision',
    proof: [CASE_STUDY_PROOF.pose],
    reason: 'Published work supports evaluating pose-overlay output from supplied still images with a review path.',
    risk: 'Published proof is limited to pose overlays on still images; it does not establish video, latency, accuracy, or application-delivery support.',
    nextStep: 'Provide representative still images, the intended output, and the reviewer who will assess the overlays.',
  },
  [PROJECT_TYPE.UNKNOWN]: {
    label: 'the request',
    proof: [],
    reason: 'The request type is not yet within a published support category.',
    risk: 'Published support is limited to document or web-data extraction, workflow automation, and still-image computer vision.',
    nextStep: 'Describe the input, intended output, operating context, and who reviews exceptions before assessing fit.',
  },
});

const MISSING_REQUIREMENT = Object.freeze({
  sourceAccess: {
    label: 'source material or system access',
    nextStep: 'Provide representative source material or the access needed to inspect it.',
  },
  outputContract: {
    label: 'the required fields, destination, or handoff',
    nextStep: 'Define the required fields, destination, handoff, and exception path.',
  },
  expectation: {
    label: 'a bounded evaluation expectation',
    nextStep: 'State the evaluation boundary and the evidence that will be reviewed.',
  },
  humanReview: {
    label: 'the person who reviews exceptions and business decisions',
    nextStep: 'Name the human reviewer and the decisions that remain with them.',
  },
  aliasConflict: {
    label: 'conflicting answers',
    nextStep: 'Resolve the conflicting answers before relying on this scope check.',
  },
});

const normalizedText = (value) => (typeof value === 'string'
  ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  : '');

const readRecord = (input) => (input && typeof input === 'object' && !Array.isArray(input) ? input : {});
const hasOwnValue = (record, key) => Object.prototype.hasOwnProperty.call(record, key) && record[key] !== undefined;
const hasTruthyFlag = (value) => value === true || ['yes', 'true', 'included', 'autonomous', 'guaranteed', 'required'].includes(normalizedText(value));

function normalizeProjectType(value) {
  const type = normalizedText(value);
  if (['document-web-extraction', 'document-and-web-extraction', 'document-extraction', 'web-extraction'].includes(type)) return PROJECT_TYPE.DOCUMENT_WEB_EXTRACTION;
  if (['workflow-automation', 'automation-workflow', 'n8n-workflow'].includes(type)) return PROJECT_TYPE.WORKFLOW_AUTOMATION;
  if (['computer-vision', 'vision', 'cv'].includes(type)) return PROJECT_TYPE.COMPUTER_VISION;
  if (['out-of-scope', 'other', 'unsupported'].includes(type)) return PROJECT_TYPE.OUT_OF_SCOPE;
  return PROJECT_TYPE.UNKNOWN;
}

function normalizeAvailability(value) {
  if (value === true || ['available', 'usable', 'granted', 'clear', 'included'].includes(normalizedText(value))) return 'available';
  if (['missing', 'none', 'unavailable'].includes(normalizedText(value))) return 'missing';
  return 'unclear';
}

function normalizeOutputContract(value) {
  if (value === true || ['clear', 'defined', 'explicit'].includes(normalizedText(value))) return 'clear';
  return 'unclear';
}

function normalizeReview(value) {
  if (value === true || ['included', 'yes', 'human-review', 'reviewable'].includes(normalizedText(value))) return 'included';
  if (value === false || ['none', 'no', 'autonomous'].includes(normalizedText(value))) return 'none';
  return 'unclear';
}

function normalizeExpectation(value) {
  if (['bounded', 'reviewable', 'defined'].includes(normalizedText(value))) return 'bounded';
  if (['guaranteed', 'guaranteed-results', 'guaranteed-accuracy', 'guaranteed-savings'].includes(normalizedText(value))) return 'guaranteed';
  return 'unclear';
}

function resolveAliases(answers, keys, normalizer, fallback) {
  const values = keys.filter((key) => hasOwnValue(answers, key)).map((key) => normalizer(answers[key]));
  if (values.length === 0) return { value: fallback, conflict: false, values: [] };
  const conflict = new Set(values).size > 1;
  return { value: conflict ? fallback : values[0], conflict, values };
}

function missingRequirements(answers) {
  return [
    answers.sourceAccess !== 'available' && 'sourceAccess',
    answers.outputContract !== 'clear' && 'outputContract',
    answers.expectation !== 'bounded' && 'expectation',
    answers.humanReview !== 'included' && 'humanReview',
    answers.aliasConflict && 'aliasConflict',
  ].filter(Boolean);
}

export function normalizeProjectFitAnswers(input) {
  const answers = readRecord(input);
  const projectType = resolveAliases(answers, ['projectType', 'type'], normalizeProjectType, PROJECT_TYPE.UNKNOWN);
  const sourceAccess = resolveAliases(answers, ['sourceAccess', 'access'], normalizeAvailability, 'unclear');
  const outputContract = resolveAliases(answers, ['outputContract', 'output', 'fieldsAndDestination'], normalizeOutputContract, 'unclear');
  const expectation = resolveAliases(answers, ['expectation', 'expectedResult'], normalizeExpectation, 'unclear');
  const humanReview = resolveAliases(answers, ['humanReview', 'reviewPath'], normalizeReview, 'unclear');
  const aliasConflict = answers.aliasConflict === true
    || [projectType, sourceAccess, outputContract, expectation, humanReview].some(({ conflict }) => conflict);
  const unsafePromise = expectation.values.includes('guaranteed')
    || [answers.guaranteedResults, answers.guaranteedAccuracy, answers.guaranteedSavings, answers.unsafePromise].some(hasTruthyFlag);
  const autonomousHighStakesDecision = [answers.highStakesDecision, answers.autonomousHighStakesDecision].some(hasTruthyFlag);
  const normalized = {
    projectType: projectType.values.includes(PROJECT_TYPE.OUT_OF_SCOPE) ? PROJECT_TYPE.OUT_OF_SCOPE : projectType.value,
    sourceAccess: sourceAccess.value,
    outputContract: outputContract.value,
    expectation: expectation.value,
    humanReview: humanReview.values.includes('none') ? 'none' : humanReview.value,
    unsafePromise,
    autonomousHighStakesDecision,
    aliasConflict,
  };
  return Object.freeze({ ...normalized, missingRequirements: Object.freeze(missingRequirements(normalized)) });
}

function proofFor(projectType) {
  const requiredProof = DOMAIN[projectType]?.proof ?? [];
  return requiredProof.flatMap(({ claimId, slug }) => {
    const caseStudy = caseStudies.find((record) => record.slug === slug);
    if (!caseStudy || !caseStudy.claimIds.includes(claimId)) return [];
    return [{
      id: claimId,
      slug: caseStudy.slug,
      title: caseStudy.title,
      scope: caseStudy.story.limitations[0] ?? caseStudy.summary,
    }];
  });
}

function result({ decision, reasons, risks, proof = [], nextSteps, alternative = null }) {
  return Object.freeze({
    decision,
    reasons: Object.freeze(reasons),
    risks: Object.freeze(risks),
    proof: Object.freeze(proof.map((reference) => Object.freeze({ ...reference }))),
    nextSteps: Object.freeze(nextSteps),
    alternative,
  });
}

function hasUnclearRequirements(answers) {
  return answers.missingRequirements.length > 0;
}

function domainFor(projectType) {
  return DOMAIN[projectType] ?? DOMAIN[PROJECT_TYPE.UNKNOWN];
}

function nextStepsFor(domain, missing = []) {
  return [...new Set([
    domain.nextStep,
    ...missing.map((key) => MISSING_REQUIREMENT[key]?.nextStep).filter(Boolean),
  ])];
}

function listRequirementLabels(missing) {
  return missing.map((key) => MISSING_REQUIREMENT[key].label).join(', ');
}

export function classifyProjectFit(input) {
  const answers = normalizeProjectFitAnswers(input);
  const domain = domainFor(answers.projectType);

  if (answers.unsafePromise) {
    return result({
      decision: DECISION.NOT_RECOMMENDED,
      reasons: ['The request asks for a guaranteed result, which published evidence cannot support as a project boundary.'],
      risks: ['A guaranteed outcome would hide the uncertainty in source quality, implementation conditions, and evaluation.'],
      nextSteps: ['Use an independent discovery process to assess the evidence and define accountable acceptance criteria.'],
      alternative: 'Seek an appropriate specialist or independent discovery engagement to assess the evidence and decide whether a bounded project is viable.',
    });
  }

  if (answers.autonomousHighStakesDecision || answers.humanReview === 'none') {
    return result({
      decision: DECISION.NOT_RECOMMENDED,
      reasons: ['The request removes the accountable human review needed for exceptions or high-stakes business decisions.'],
      risks: ['Published work does not support delegating high-stakes decisions without a responsible human owner.'],
      nextSteps: ['Identify the accountable decision owner and the qualified domain review needed before selecting a solution.'],
      alternative: 'Seek an appropriate qualified specialist and accountable decision owner to design a governed process for this decision.',
    });
  }

  if (answers.projectType === PROJECT_TYPE.OUT_OF_SCOPE) {
    return result({
      decision: DECISION.NOT_RECOMMENDED,
      reasons: ['This request is outside the published document, web-data, workflow, and computer-vision support scope.'],
      risks: ['The published case studies do not provide relevant proof for this request type.'],
      nextSteps: ['Identify the specialist capability, evidence, and review owner the request requires.'],
      alternative: 'Seek a specialist with published work in the required domain, or use an independent discovery process to identify the right capability.',
    });
  }

  if (hasUnclearRequirements(answers)) {
    return result({
      decision: DECISION.POSSIBLE_FIT,
      reasons: [`For ${domain.label}, clarify ${listRequirementLabels(answers.missingRequirements)} before assessing fit.`],
      risks: [domain.risk],
      proof: proofFor(answers.projectType),
      nextSteps: nextStepsFor(domain, answers.missingRequirements),
    });
  }

  if (answers.projectType === PROJECT_TYPE.COMPUTER_VISION) {
    return result({
      decision: DECISION.POSSIBLE_FIT,
      reasons: [domain.reason],
      risks: [domain.risk],
      proof: proofFor(answers.projectType),
      nextSteps: nextStepsFor(domain),
    });
  }

  if (answers.projectType === PROJECT_TYPE.UNKNOWN) {
    return result({
      decision: DECISION.POSSIBLE_FIT,
      reasons: [domain.reason],
      risks: [domain.risk],
      nextSteps: nextStepsFor(domain),
    });
  }

  return result({
    decision: DECISION.STRONG_FIT,
    reasons: [domain.reason],
    risks: [domain.risk],
    proof: proofFor(answers.projectType),
    nextSteps: nextStepsFor(domain),
  });
}
