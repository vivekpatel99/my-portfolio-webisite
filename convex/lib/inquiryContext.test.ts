import { describe, expect, it } from "vitest";
import {
  createDirectInquiryContext,
  createFitDiagnosticInquiryContext,
  FIT_DECISION,
  normalizeInquiryContext,
  PROJECT_TYPE,
} from "./inquiryContext";

describe("estimate inquiry context contract", () => {
  it("keeps manually selected fields bounded and source-free", () => {
    expect(createDirectInquiryContext({
      projectType: PROJECT_TYPE.WORKFLOW_AUTOMATION,
      timeline: "within-one-month",
      currentBlocker: "workflow-reliability",
    })).toEqual({
      projectType: PROJECT_TYPE.WORKFLOW_AUTOMATION,
      timeline: "within-one-month",
      currentBlocker: "workflow-reliability",
    });
  });

  it("keeps an out-of-scope diagnostic result informational without inventing a project type", () => {
    expect(createFitDiagnosticInquiryContext(FIT_DECISION.NOT_RECOMMENDED, "out-of-scope")).toEqual({
      origin: "fit-diagnostic",
      fitDecision: FIT_DECISION.NOT_RECOMMENDED,
    });
  });

  it("treats empty context as absent and rejects forged or extra values", () => {
    expect(normalizeInquiryContext({})).toBeUndefined();
    expect(() => normalizeInquiryContext({ projectType: "workflow-automation", serviceId: "computer-vision" })).toThrow(/Invalid estimate context/);
    expect(() => normalizeInquiryContext({ origin: "case-study", caseStudySlug: "invoice-ocr-extraction", projectType: "computer-vision", serviceId: "computer-vision" })).toThrow(/Invalid estimate context/);
    expect(() => normalizeInquiryContext({ projectType: "workflow-automation", rawDiagnosticAnswer: "yes" })).toThrow(/Invalid estimate context/);
    expect(() => normalizeInquiryContext({ origin: "fit-diagnostic", fitDecision: "strong-fit", caseStudySlug: "invoice-ocr-extraction" })).toThrow(/Invalid estimate context/);
  });
});
