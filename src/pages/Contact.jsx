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
import { contactCopy } from '@/lib/contactCopy';
import { useLocale } from '@/lib/locale.js';
import {
  CONTACT_LEAD_VALIDATION_ERROR,
  MAX_DESCRIPTION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  validateContactFields,
} from '../../convex/lib/leadValidation';

const GLOBAL_RATE_LIMIT_ERROR =
  'The site is receiving too many requests. Please wait a few minutes and try again.';
const EMAIL_RATE_LIMIT_ERROR =
  'This email already sent several messages recently. Please wait before submitting again.';
const SUBMIT_FAILURE_FALLBACK =
  "We couldn't send your request. Please try again, or use the email address on this page.";
const ACTIONABLE_SUBMIT_ERRORS = new Set([
  CONTACT_LEAD_VALIDATION_ERROR,
  GLOBAL_RATE_LIMIT_ERROR,
  EMAIL_RATE_LIMIT_ERROR,
]);
const INVALID_EMAIL_ERROR = 'Enter a valid email address.';

const germanFieldErrors = new Map([
  ['Name is required.', 'Bitte geben Sie Ihren Namen ein.'],
  ['Email is required.', 'Bitte geben Sie Ihre E-Mail-Adresse ein.'],
  ['Project description is required.', 'Bitte beschreiben Sie Ihr Projekt.'],
  [INVALID_EMAIL_ERROR, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'],
  ['Choose one of the listed budget ranges, or leave it blank.', 'Bitte wählen Sie einen der angegebenen Budgetrahmen oder lassen Sie das Feld frei.'],
  ['Remove line breaks and hidden control characters from your full name.', 'Bitte entfernen Sie Zeilenumbrüche und unsichtbare Steuerzeichen aus Ihrem Namen.'],
  ['Remove hidden control characters from your project description.', 'Bitte entfernen Sie unsichtbare Steuerzeichen aus Ihrer Projektbeschreibung.'],
]);

for (const [englishLabel, germanLabel, limit] of [
  ['Full name', 'Der vollständige Name', MAX_NAME_LENGTH],
  ['Email address', 'Die E-Mail-Adresse', MAX_EMAIL_LENGTH],
  ['Project description', 'Die Projektbeschreibung', MAX_DESCRIPTION_LENGTH],
]) {
  const englishMessage = `${englishLabel} must be ${limit} characters or fewer.`;
  const germanMessage = `${germanLabel} darf höchstens ${limit.toLocaleString('de-DE')} Zeichen lang sein.`;
  germanFieldErrors.set(englishMessage, germanMessage);
  germanFieldErrors.set(
    `${englishMessage} Remove extra surrounding whitespace.`,
    `${germanMessage} Bitte entfernen Sie überflüssige Leerzeichen am Anfang und Ende.`,
  );
}

const germanSubmitErrors = new Map([
  [CONTACT_LEAD_VALIDATION_ERROR, 'Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.'],
  [GLOBAL_RATE_LIMIT_ERROR, 'Die Website erhält derzeit zu viele Anfragen. Bitte warten Sie einige Minuten und versuchen Sie es erneut.'],
  [EMAIL_RATE_LIMIT_ERROR, 'Von dieser E-Mail-Adresse wurden in kurzer Zeit mehrere Anfragen gesendet. Bitte warten Sie, bevor Sie es erneut versuchen.'],
  [SUBMIT_FAILURE_FALLBACK, 'Bitte versuchen Sie es erneut oder nutzen Sie die E-Mail-Adresse auf dieser Seite.'],
]);

const germanSubmitErrorMessage = (message) => (
  germanSubmitErrors.get(message) ?? germanSubmitErrors.get(SUBMIT_FAILURE_FALLBACK)
);

const germanFieldErrorMessage = (message) => germanFieldErrors.get(message) ?? contactCopy.de.checkDetails;

const Contact = () => {
  const locale = useLocale();
  const copy = contactCopy[locale];
  const fieldErrorMessage = (message) => (
    locale === 'de' ? germanFieldErrorMessage(message) : message
  );
  const { formState, setFormState, isSubmitting, outcome, hasUnpresentedOutcome, claimOutcomePresentation, setFeedbackToast, beginSubmission, finishSubmission } = useContactDraft();
  const [fieldErrors, setFieldErrors] = useState({});
  const submittingRef = useRef(false);
  const submitButtonRef = useRef(null);
  const receiptRef = useRef(null);
  const [announcingOutcome, setAnnouncingOutcome] = useState(null);
  const presentsOutcome = Boolean(outcome && (hasUnpresentedOutcome || announcingOutcome === outcome));
  const submitErrorMessage = locale === 'de'
    ? germanSubmitErrorMessage(outcome?.errorMessage)
    : outcome?.errorMessage;
  const submitLead = useMutation(api.leads.submitLead);
  const pageMotion = usePageMotion();

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
      const titleKey = firstInvalidField === 'email' && firstError === INVALID_EMAIL_ERROR
        ? 'invalidEmail'
        : firstError.endsWith('is required.')
          ? 'missingFields'
          : 'checkDetails';
      setFeedbackToast(toast({
        title: contactCopy.en[titleKey],
        description: firstError,
        translations: {
          de: { title: contactCopy.de[titleKey], description: germanFieldErrorMessage(firstError) },
        },
        variant: 'destructive',
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
        title: contactCopy.en.failureTitle,
        description,
        translations: {
          de: { title: contactCopy.de.failureTitle, description: germanSubmitErrorMessage(description) },
        },
        variant: 'destructive',
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
              <DetectionLabel aria-hidden="true">{copy.requestLabel}</DetectionLabel>

              <div className="contact-detection-field mb-5">
                <div className="contact-detection-frame" data-filled={Boolean(formState.name)}>
                  <label htmlFor="name" className="contact-detection-label">
                    {copy.nameLabel} <span className="text-[#a78bfa]">*</span>
                  </label>
                  <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={copy.namePlaceholder}
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
                {fieldErrors.name ? <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrorMessage(fieldErrors.name)}</p> : null}
              </div>

              <div className="contact-detection-field mb-5">
                <div className="contact-detection-frame" data-filled={Boolean(formState.email)}>
                  <label htmlFor="email" className="contact-detection-label">
                    {copy.emailLabel} <span className="text-[#a78bfa]">*</span>
                  </label>
                  <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={copy.emailPlaceholder}
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
                {fieldErrors.email ? <p id="email-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrorMessage(fieldErrors.email)}</p> : null}
              </div>

              <BudgetSelect
                value={formState.budget}
                onChange={handleSelectChange}
                disabled={isSubmitting}
                error={fieldErrors.budget ? fieldErrorMessage(fieldErrors.budget) : undefined}
              />

              <div className="contact-detection-field mb-4">
                <div className="contact-detection-frame contact-detection-frame-area" data-filled={Boolean(formState.description)}>
                  <label htmlFor="description" className="contact-detection-label">
                    {copy.descriptionLabel} <span className="text-[#a78bfa]">*</span>
                  </label>
                  <textarea
                  id="description"
                  name="description"
                  placeholder={copy.descriptionPlaceholder}
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
                {fieldErrors.description ? <p id="description-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrorMessage(fieldErrors.description)}</p> : null}
                <div className="mt-3 border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)] p-4">
                  <p className="text-sm font-semibold text-white">{copy.descriptionPromptHeading}</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-400">
                    {copy.descriptionPrompts.map((prompt) => (
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
                    <p id="contact-receipt-title" className="text-sm font-semibold text-white">{copy.receiptTitle}</p>
                    <p id="contact-receipt-body" className="mt-1 text-sm text-[#9ca3af]">{copy.receiptBody}</p>
                  </div>
                </div>
              ) : null}

              {outcome?.status === 'error' ? (
                <div id="contact-submit-error" className="mt-6 border border-red-400/40 p-4 text-sm text-red-400">
                  <p className="font-semibold">{copy.failureTitle}</p>
                  <p className="mt-1">{submitErrorMessage}</p>
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
                  <DetectionLabel aria-hidden="true">{copy.requestLabel}</DetectionLabel>
                  <span className={`action-submit-label${isSubmitting ? ' action-submit-reserve' : ''}`} aria-hidden={isSubmitting || undefined}>{copy.send}</span>
                  {isSubmitting ? <Loader2 className="action-submit-spinner h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {isSubmitting ? <span className="action-submit-label">{copy.sending}</span> : null}
                </button>
              </div>
            </form>
      </ContactContent>
    </m.div>
  );
};

export default Contact;
