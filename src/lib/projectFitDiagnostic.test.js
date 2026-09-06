import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DECISION,
  DECISION_PRECEDENCE,
  PROJECT_TYPE,
  classifyProjectFit,
  normalizeProjectFitAnswers,
} from './projectFitDiagnostic.js';
import { caseStudies } from '../data/caseStudies.js';

const CANONICAL_ANSWERS = Object.freeze({
  projectType: ['document-web-extraction', 'workflow-automation', 'computer-vision', 'out-of-scope'],
  sourceAccess: ['available', 'unclear', 'missing'],
  outputContract: ['clear', 'unclear'],
  expectation: ['bounded', 'guaranteed', 'unclear'],
  humanReview: ['included', 'none', 'unclear'],
});

const reviewedDocumentExtraction = Object.freeze({
  projectType: 'document-web-extraction',
  sourceAccess: 'available',
  outputContract: 'clear',
  expectation: 'bounded',
  humanReview: 'included',
});

const expectedDecisionForCanonicalAnswer = (answers) => {
  if (answers.expectation === 'guaranteed' || answers.humanReview === 'none' || answers.projectType === 'out-of-scope') {
    return DECISION.NOT_RECOMMENDED;
  }
  if (answers.sourceAccess !== 'available' || answers.outputContract !== 'clear' || answers.expectation !== 'bounded' || answers.humanReview !== 'included') return DECISION.POSSIBLE_FIT;
  if (answers.projectType === 'computer-vision') return DECISION.POSSIBLE_FIT;
  return DECISION.STRONG_FIT;
};

const canonicalAnswerCombinations = () => CANONICAL_ANSWERS.projectType.flatMap((projectType) => (
  CANONICAL_ANSWERS.sourceAccess.flatMap((sourceAccess) => (
    CANONICAL_ANSWERS.outputContract.flatMap((outputContract) => (
      CANONICAL_ANSWERS.expectation.flatMap((expectation) => (
        CANONICAL_ANSWERS.humanReview.map((humanReview) => ({
          projectType, sourceAccess, outputContract, expectation, humanReview,
        }))
      ))
    ))
  ))
));

describe('project fit diagnostic public contract', () => {
  it('allows every emitted proof claim at the diagnostic placement in the canonical ledger', () => {
    const ledger = JSON.parse(readFileSync(new URL('../../docs/claims/gate-1-claim-ledger.json', import.meta.url), 'utf8'));
    const emittedIds = new Set(canonicalAnswerCombinations().flatMap((answers) => classifyProjectFit(answers).proof.map(({ id }) => id)));
    expect(emittedIds.size).toBe(3);
    for (const id of emittedIds) {
      const entry = ledger.find((claim) => claim.id === id);
      expect(entry?.classification).toBe('verified');
      expect(entry?.allowedPlacement).toContain('project fit diagnostic');
      expect(entry?.consumers).toEqual(expect.arrayContaining([
        'src/lib/projectFitDiagnostic.js', 'src/components/ProjectFitDiagnostic.jsx',
      ]));
    }
  });

  it('exports precedence in the order implemented by the classifier', () => {
    expect(DECISION).toEqual({
      STRONG_FIT: 'Strong Fit', POSSIBLE_FIT: 'Possible Fit', NOT_RECOMMENDED: 'Not Recommended',
    });
    expect(PROJECT_TYPE).toEqual({
      DOCUMENT_WEB_EXTRACTION: 'document-web-extraction', WORKFLOW_AUTOMATION: 'workflow-automation',
      COMPUTER_VISION: 'computer-vision', OUT_OF_SCOPE: 'out-of-scope', UNKNOWN: 'unknown',
    });
    expect(DECISION_PRECEDENCE).toEqual([
      'unsafe-boundary', 'out-of-scope', 'missing-or-unclear-requirements',
      'computer-vision-limited-proof', 'unknown-input', 'supported-reviewed-work',
    ]);
  });

  it('covers every canonical answer combination with independently-derived decision invariants', () => {
    const combinations = canonicalAnswerCombinations();
    expect(combinations).toHaveLength(216);
    for (const answers of combinations) {
      const outcome = classifyProjectFit(answers);
      const expectedDecision = expectedDecisionForCanonicalAnswer(answers);
      expect(outcome.decision, JSON.stringify(answers)).toBe(expectedDecision);
      expect(outcome.reasons.length, JSON.stringify(answers)).toBeGreaterThan(0);
      expect(outcome.risks.length, JSON.stringify(answers)).toBeGreaterThan(0);
      expect(outcome.nextSteps.length, JSON.stringify(answers)).toBeGreaterThan(0);
      expect(outcome.decision === DECISION.STRONG_FIT, JSON.stringify(answers)).toBe(
        expectedDecision === DECISION.STRONG_FIT,
      );
      if (expectedDecision === DECISION.NOT_RECOMMENDED) {
        expect(outcome.proof, JSON.stringify(answers)).toEqual([]);
        expect(outcome.alternative, JSON.stringify(answers)).toMatch(/specialist|discovery/i);
      }
    }
  });

  it('normalizes supported aliases, ORs unsafe flags independently, and is idempotent', () => {
    const normalized = normalizeProjectFitAnswers({
      projectType: '  Document & Web Extraction ', sourceAccess: true, outputContract: true,
      expectation: 'bounded', humanReview: true,
      guaranteedResults: false, guaranteedAccuracy: 'yes', guaranteedSavings: false,
      highStakesDecision: false, autonomousHighStakesDecision: 'autonomous',
    });
    expect(normalized).toMatchObject({
      ...reviewedDocumentExtraction,
      unsafePromise: true, autonomousHighStakesDecision: true, aliasConflict: false, missingRequirements: [],
    });
    expect(normalizeProjectFitAnswers(normalized)).toEqual(normalized);
  });

  it('prevents contradictory aliases from becoming a strong fit', () => {
    for (const answers of [
      { ...reviewedDocumentExtraction, type: 'workflow-automation' },
      { ...reviewedDocumentExtraction, access: 'missing' },
      { ...reviewedDocumentExtraction, output: 'unclear' },
      { ...reviewedDocumentExtraction, expectedResult: 'guaranteed' },
      { ...reviewedDocumentExtraction, reviewPath: 'none' },
    ]) {
      const normalized = normalizeProjectFitAnswers(answers);
      const outcome = classifyProjectFit(answers);
      expect(normalized.aliasConflict, JSON.stringify(answers)).toBe(true);
      expect(outcome.decision, JSON.stringify(answers)).not.toBe(DECISION.STRONG_FIT);
      expect(outcome.reasons.join(' '), JSON.stringify(answers)).toMatch(/conflicting|guaranteed|review/i);
    }
  });

  it('keeps malformed input deterministic and below strong fit', () => {
    for (const input of [null, undefined, '', 7, [], {}, { projectType: 'unknown-service' }]) {
      const first = classifyProjectFit(input);
      expect(first).toEqual(classifyProjectFit(input));
      expect(first.decision).toBe(DECISION.POSSIBLE_FIT);
      expect(first.proof).toEqual([]);
      expect(first.alternative).toBeNull();
    }
  });

  it('preserves explicit exclusion boundaries even when aliases contradict them', () => {
    for (const input of [
      { ...reviewedDocumentExtraction, reviewPath: 'none' },
      { ...reviewedDocumentExtraction, type: 'out-of-scope' },
      { ...reviewedDocumentExtraction, guaranteedResults: false, guaranteedSavings: true },
    ]) {
      expect(classifyProjectFit(input).decision).toBe('Not Recommended');
      const normalized = normalizeProjectFitAnswers(input);
      expect(normalizeProjectFitAnswers(normalized)).toEqual(normalized);
      expect(classifyProjectFit(normalized)).toEqual(classifyProjectFit(input));
    }
  });

  it('links every proof reference to a published record, with its own verified claim ID, title, and scope', () => {
    for (const answers of [
      reviewedDocumentExtraction,
      { ...reviewedDocumentExtraction, projectType: 'workflow-automation' },
      { ...reviewedDocumentExtraction, projectType: 'computer-vision', sourceAccess: 'missing' },
    ]) {
      for (const proof of classifyProjectFit(answers).proof) {
        const record = caseStudies.find((caseStudy) => caseStudy.slug === proof.slug);
        expect(record).toBeDefined();
        expect(record.claimIds).toContain(proof.id);
        expect(proof.title).toBe(record.title);
        expect(proof.scope).toBe(record.story.limitations[0]);
      }
    }
  });

  it('states the computer-vision still-image proof limit even when source access is missing', () => {
    const outcome = classifyProjectFit({ ...reviewedDocumentExtraction, projectType: 'computer-vision', sourceAccess: 'missing' });
    expect(outcome.decision).toBe(DECISION.POSSIBLE_FIT);
    expect(outcome.risks.join(' ')).toMatch(/still images/i);
    expect(outcome.nextSteps.join(' ')).toMatch(/source material|access/i);
  });

  it('offers poor-fit routes to an appropriate specialist or independent discovery, rather than a reformulated service request', () => {
    for (const answers of [
      { ...reviewedDocumentExtraction, expectation: 'guaranteed' },
      { ...reviewedDocumentExtraction, humanReview: 'none' },
      { ...reviewedDocumentExtraction, projectType: 'out-of-scope' },
    ]) {
      const outcome = classifyProjectFit(answers);
      expect(outcome.decision).toBe(DECISION.NOT_RECOMMENDED);
      expect(outcome.alternative).toMatch(/specialist|independent discovery/i);
      expect(outcome.alternative).not.toMatch(/^Choose a document|^Define a reviewable workflow/);
    }
  });
});
