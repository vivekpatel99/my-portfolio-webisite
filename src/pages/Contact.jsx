import React, { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import './Contact.css';
import { DetectionLabel } from '@/components/DetectionFrame';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@convex/api';
import ContactContent from '@/components/ContactContent';
import { Seo, routeSeo } from '@/lib/seo';
import { usePageMotion } from '@/lib/pageMotion';
import { useContactDraft } from '@/lib/useContactDraft';
import { captureException } from '@/lib/sentryTelemetry';
import BudgetSelect from '@/components/BudgetSelect';
import { SENSITIVE_TELEMETRY_REGION_PROPS } from '@/lib/sensitiveTelemetry';
import { CONTACT_LEAD_VALIDATION_ERROR, validateContactFields } from '../../convex/lib/leadValidation';

const descriptionPrompts = [
  'What data, documents, images, or workflow should be automated?',
  'What does a successful output look like?',
  'Do you already have code, samples, screenshots, or a deadline?',
];

const ACTIONABLE_SUBMIT_ERRORS = new Set([
  CONTACT_LEAD_VALIDATION_ERROR,
  'The site is receiving too many requests. Please wait a few minutes and try again.',
  'This email already sent several messages recently. Please wait before submitting again.',
]);
const SUBMIT_FAILURE_FALLBACK =
  "We couldn't send your request. Please try again, or use the email address on this page.";

const Contact = ({ inquirySearch = '', inquiryVisitKey = null }) => {
  const { formState, inquiryContext, applyInquiryContext, setFormState, isSubmitting, outcome, hasUnpresentedOutcome, claimOutcomePresentation, setFeedbackToast, beginSubmission, finishSubmission } = useContactDraft();
  const [fieldErrors, setFieldErrors] = useState({});
  const submittingRef = useRef(false);
  const submitButtonRef = useRef(null);
  const receiptRef = useRef(null);
  const [announcingOutcome, setAnnouncingOutcome] = useState(null);
  const presentsOutcome = Boolean(outcome && (hasUnpresentedOutcome || announcingOutcome === outcome));
  const submitLead = useMutation(api.leads.submitLead);
  const pageMotion = usePageMotion();

  useEffect(() => {
    applyInquiryContext(inquirySearch, inquiryVisitKey);
  }, [inquirySearch, inquiryVisitKey, applyInquiryContext]);

  useEffect(() => {
    if (!claimOutcomePresentation(outcome)) return;
    setAnnouncingOutcome(outcome);
  }, [outcome, claimOutcomePresentation]);

  useEffect(() => {
    if (!outcome || announcingOutcome !== outcome) return;
    if (outcome.status === 'error') submitButtonRef.current?.focus();
    if (outcome.status === 'success') receiptRef.current?.focus();
  }, [outcome, announcingOutcome]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSelectChange = (value) => {
    setFormState(prevState => ({ ...prevState, budget: value }));
    setFieldErrors((prev) => {
      const { budget: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (submittingRef.current || isSubmitting) {
      return;
    }

    const telemetrySource = e.currentTarget;
    const validation = validateContactFields(formState);
    if (!validation.ok) {
      const nextErrors = validation.errors;
      setFieldErrors(nextErrors);
      const firstInvalidField = Object.keys(nextErrors)[0];
      const firstError = nextErrors[firstInvalidField];
      telemetrySource.querySelector(`#${firstInvalidField}`)?.focus();
      setFeedbackToast(toast({
        title: firstInvalidField === 'email' && firstError === 'Enter a valid email address.'
          ? "Invalid email address."
          : firstError.endsWith('is required.')
            ? "Uh oh! Missing fields."
            : "Check your project details.",
        description: firstError,
        variant: "destructive",
      }));
      return;
    }
    setFieldErrors({});

    if (submittingRef.current) return;
    const submittedFields = beginSubmission();
    if (!submittedFields) return;
    submittingRef.current = true;

    try {
      await submitLead(validation.value);
    } catch (error) {
      const convexMessage =
        typeof error?.data === 'string'
          ? error.data
          : error?.data?.message;
      if (convexMessage !== CONTACT_LEAD_VALIDATION_ERROR) {
        captureException(error, { telemetrySource });
      }
      const description = ACTIONABLE_SUBMIT_ERRORS.has(convexMessage)
        ? convexMessage
        : SUBMIT_FAILURE_FALLBACK;
      setFeedbackToast(toast({
        title: "Submission Failed",
        description,
        variant: "destructive",
      }));
      submittingRef.current = false;
      finishSubmission(submittedFields, false, description);
      return;
    }

    submittingRef.current = false;
    finishSubmission(submittedFields, true);
    setFieldErrors({});
  };

  return (
    <m.div {...pageMotion}>
      <Seo {...routeSeo['/contact']} />

      <ContactContent>
            <form
              onSubmit={handleSubmit}
              noValidate
              {...SENSITIVE_TELEMETRY_REGION_PROPS}
              className="form-panel detection-panel min-w-0 bg-gradient-to-b from-[rgba(139,92,246,0.035)] to-transparent bg-[length:100%_22%] bg-no-repeat p-7 px-[26px] pb-[26px]"
            >
              <DetectionLabel aria-hidden="true">PROJECT · REQUEST</DetectionLabel>

              {inquiryContext && (
                <p id="contact-inquiry-context" className="mb-7 text-sm leading-relaxed text-[#b6b9c3]">
                  Inquiry about {inquiryContext.label}
                </p>
              )}

              <div className="contact-detection-field mb-5">
                <div className="contact-detection-frame" data-filled={Boolean(formState.name)}>
                  <label htmlFor="name" className="contact-detection-label">
                    Full Name <span className="text-[#a78bfa]">*</span>
                  </label>
                  <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Alex from Acme Ops"
                  autoComplete="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="contact-detection-control"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  />
                </div>
                {fieldErrors.name ? <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrors.name}</p> : null}
              </div>

              <div className="contact-detection-field mb-5">
                <div className="contact-detection-frame" data-filled={Boolean(formState.email)}>
                  <label htmlFor="email" className="contact-detection-label">
                    Email Address <span className="text-[#a78bfa]">*</span>
                  </label>
                  <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="alex@company.com"
                  autoComplete="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className="contact-detection-control"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                </div>
                {fieldErrors.email ? <p id="email-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrors.email}</p> : null}
              </div>

              <BudgetSelect
                value={formState.budget}
                onChange={handleSelectChange}
                disabled={isSubmitting}
                error={fieldErrors.budget}
              />

              <div className="contact-detection-field mb-4">
                <div className="contact-detection-frame contact-detection-frame-area" data-filled={Boolean(formState.description)}>
                  <label htmlFor="description" className="contact-detection-label">
                    Project Description <span className="text-[#a78bfa]">*</span>
                  </label>
                  <textarea
                  id="description"
                  name="description"
                  placeholder="Example: We need invoice OCR or a data extraction workflow that exports clean records to our CRM within 4 weeks…"
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="contact-detection-control contact-detection-textarea"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                  />
                </div>
                {fieldErrors.description ? <p id="description-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrors.description}</p> : null}
                <div className="mt-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)] p-4">
                  <p className="text-sm font-semibold text-white">Helpful details to include:</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-400">
                    {descriptionPrompts.map((prompt) => (
                      <li key={prompt} className="flex gap-2">
                        <span className="text-[#8B5CF6]">•</span>
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {outcome?.status === 'success' ? (
                <div
                  ref={receiptRef}
                  data-contact-outcome-focus={presentsOutcome ? '' : undefined}
                  role="status"
                  aria-live={presentsOutcome ? 'polite' : 'off'}
                  aria-labelledby="contact-receipt-title"
                  aria-describedby="contact-receipt-body"
                  tabIndex={-1}
                  className="mt-6 flex gap-3 border border-[rgba(139,92,246,0.42)] bg-[rgba(139,92,246,0.08)] p-4 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]"
                >
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8B5CF6]" />
                  <div>
                    <p id="contact-receipt-title" className="text-sm font-semibold text-white">Request received</p>
                    <p id="contact-receipt-body" className="mt-1 text-sm text-[#9ca3af]">Your details are saved. I'll get back to you within 24 hours.</p>
                  </div>
                </div>
              ) : null}

              {outcome?.status === 'error' ? (
                <div id="contact-submit-error" className="mt-6 border border-red-400/40 p-4 text-sm text-red-400">
                  <p className="font-semibold">Submission Failed</p>
                  <p className="mt-1">{outcome.errorMessage}</p>
                </div>
              ) : null}

              <div className="text-center mt-6">
                <button
                  ref={submitButtonRef}
                  data-contact-outcome-focus={outcome?.status === 'error' && presentsOutcome ? '' : undefined}
                  type="submit"
                  aria-describedby={outcome?.status === 'error' ? 'contact-submit-error' : undefined}
                  disabled={isSubmitting}
                  className="detection-panel detection-action detection-action--labeled detection-action--primary detection-action--submit"
                >
                  <DetectionLabel aria-hidden="true">PROJECT · REQUEST</DetectionLabel>
                  <span className={`action-submit-label${isSubmitting ? ' action-submit-reserve' : ''}`} aria-hidden={isSubmitting || undefined}>Send project request</span>
                  {isSubmitting ? <Loader2 className="action-submit-spinner h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {isSubmitting ? <span className="action-submit-label">Sending…</span> : null}
                </button>
              </div>
            </form>
      </ContactContent>
    </m.div>
  );
};

export default Contact;
