import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Github, Linkedin, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@convex/api';
import { socialLinks } from '@/config/links';
import { Seo, routeSeo } from '@/lib/seo';
import { captureException } from '@/lib/sentryTelemetry';
import { BUDGET_LABELS, BUDGET_OPTIONS } from '@/lib/budgetOptions';
import { SENSITIVE_TELEMETRY_REGION_PROPS } from '@/lib/sensitiveTelemetry';
import { CONTACT_LEAD_VALIDATION_ERROR } from '../../convex/lib/leadValidation';

// Custom logo components for platform links
const UpworkIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
  </svg>
);
const FreelancerIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13"/>
  </svg>
);
const FreelancerMapIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 3L7.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const platformLinks = [
    { name: 'Upwork', icon: UpworkIcon, url: socialLinks.upwork }, // Using centralized link
    { name: 'Freelancer.com', icon: FreelancerIcon, url: socialLinks.freelancer }, // Using centralized link
    { name: 'FreelancerMap', icon: FreelancerMapIcon, url: socialLinks.freelancerMap }, // Using centralized link
    { name: 'Email', icon: Mail, url: socialLinks.emailHref } // Using centralized link
];

const nextSteps = [
  'I review the project goals, data sources, and technical risks.',
  'You receive a suggested scope, timeline, and first milestone.',
  'If it is a fit, we start with a focused build or optimization sprint.',
];

const descriptionPrompts = [
  'What data, documents, images, or workflow should be automated?',
  'What does a successful output look like?',
  'Do you already have code, samples, screenshots, or a deadline?',
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', budget: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const submitLead = useMutation(api.leads.submitLead);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const telemetrySource = e.currentTarget;
    const trimmedFormState = {
      ...formState,
      name: formState.name.trim(),
      email: formState.email.trim().toLowerCase(),
      description: formState.description.trim(),
    };

    const nextErrors = {};
    if (!trimmedFormState.name) {
      nextErrors.name = 'Name is required.';
    }
    if (!trimmedFormState.email) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(trimmedFormState.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!trimmedFormState.description) {
      nextErrors.description = 'Project description is required.';
    }
    setFieldErrors(nextErrors);

    if (nextErrors.name || nextErrors.email || nextErrors.description) {
        toast({
            title: nextErrors.email && trimmedFormState.email ? "Invalid email address." : "Uh oh! Missing fields.",
            description: nextErrors.email && trimmedFormState.email
              ? "Please enter a valid email address before sending."
              : "Please fill out all required fields before sending.",
            variant: "destructive",
        });
        return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await submitLead({
        name: trimmedFormState.name,
        email: trimmedFormState.email,
        budget: formState.budget || undefined,
        description: trimmedFormState.description,
      });
    } catch (error) {
      const convexMessage =
        typeof error?.data === 'string'
          ? error.data
          : error?.data?.message;
      if (convexMessage !== CONTACT_LEAD_VALIDATION_ERROR) {
        captureException(error, { telemetrySource });
      }
      const description =
        convexMessage ??
        error?.message?.replace(/^\[CONVEX[^\]]*\]\s*/i, '') ??
        'Something went wrong saving your data. Please try again later.';
      toast({
        title: "Submission Failed",
        description,
        variant: "destructive",
      });
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    submittingRef.current = false;
    setIsSubmitting(false);

    toast({
      title: "Request received",
      description: "Your details are saved. I'll get back to you within 24 hours.",
    });
    setFormState({ name: '', email: '', budget: '', description: '' });
    setFieldErrors({});
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <Seo {...routeSeo['/contact']} />
      
      <section className="contact relative bg-[#0C0D0D] text-white py-12 px-7 md:px-10 min-h-[900px]">
        <div className="inner relative z-[2] max-w-[1100px] mx-auto">
          {/* Hero */}
          <div className="hero text-center max-w-[720px] mx-auto mb-7">
            <h1 className="text-[clamp(1.75rem,3.6vw,2.85rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-[14px]">
              REQUEST A <span className="accent text-[#8B5CF6]">PROJECT ESTIMATE</span>
            </h1>
            <p className="text-base leading-[1.55] text-[#9ca3af]">
              Share the workflow, data problem, or computer-vision bottleneck you want solved. I typically respond within 24 hours with fit, next steps, and the clearest scope path.
            </p>
          </div>

          {/* Proof strip */}
          <ul className="proof flex flex-wrap justify-center gap-7 mb-9">
            <li className="flex items-center gap-[10px]">
              <span className="num text-[1.35rem] font-bold text-[#8B5CF6]">100%</span>
              <span className="lab text-xs leading-[1.25] text-[#9ca3af]">Job Success<br/>on Upwork</span>
            </li>
            <span className="sep w-px h-9 bg-[rgba(255,255,255,0.1)]" role="separator" aria-hidden="true"></span>
            <li className="flex items-center gap-[10px]">
              <span className="num text-[1.35rem] font-bold text-[#8B5CF6]">5★</span>
              <span className="lab text-xs leading-[1.25] text-[#9ca3af]">Average<br/>Rating</span>
            </li>
          </ul>

          {/* Layout: aside + form */}
          <div className="layout grid md:grid-cols-[0.82fr_1.18fr] gap-7 items-start">
            {/* Aside */}
            <aside className="aside border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 px-[22px]">
              <h2 className="text-[1.15rem] font-bold uppercase tracking-[-0.01em] mb-[18px]">
                WHAT HAPPENS NEXT
              </h2>
              <div className="space-y-[14px]">
                {nextSteps.map((step, index) => (
                  <div key={step} className="step flex gap-[10px]">
                    <div className="tick flex-shrink-0 w-[14px] h-[14px] mt-[3px] border border-[rgba(139,92,246,0.7)] relative after:content-[''] after:absolute after:left-[3px] after:top-[1px] after:w-[5px] after:h-2 after:border-r-[1.5px] after:border-b-[1.5px] after:border-[#8B5CF6] after:rotate-[40deg]"></div>
                    <p className="text-[0.85rem] leading-[1.5] text-[#9ca3af]">
                      <strong className="text-white font-semibold">Step {index + 1}:</strong> {step}
                    </p>
                  </div>
                ))}
              </div>
              <div className="email-note mt-[22px] border border-[rgba(139,92,246,0.22)] bg-[rgba(139,92,246,0.08)] p-[14px]">
                <p className="q text-[0.8rem] text-[#9ca3af] mb-[6px]">Prefer email?</p>
                <a href={socialLinks.emailHref} className="text-[0.9rem] font-semibold text-white hover:text-[#a78bfa]">
                  {socialLinks.contactEmail}
                </a>
                <div className="sub mt-2 font-mono text-[9px] leading-[1.4] tracking-[0.08em] uppercase text-[#6b7280]">
                  SECONDARY PATH · FORM REMAINS PRIMARY
                </div>
              </div>
            </aside>

            {/* Form panel with detection box */}
            <form
              onSubmit={handleSubmit}
              noValidate
              {...SENSITIVE_TELEMETRY_REGION_PROPS}
              className="form-panel relative border border-[rgba(139,92,246,0.42)] bg-gradient-to-b from-[rgba(139,92,246,0.035)] to-transparent bg-[length:100%_22%] bg-no-repeat p-7 px-[26px] pb-[26px]"
            >
              {/* Corner brackets */}
              <span className="bracket-tl absolute top-[5px] left-[5px] w-[18px] h-[18px] border-t-[1.5px] border-l-[1.5px] border-[#8B5CF6] pointer-events-none z-[5]"></span>
              <span className="bracket-br absolute bottom-[5px] right-[5px] w-[18px] h-[18px] border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.55)] pointer-events-none z-[5]"></span>

              <div className="meta font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-5">
                CONTACT · <em className="not-italic text-[#a78bfa]">DETECTED</em>
              </div>

              <div className="field relative mb-4">
                <span className="field-meta absolute -top-[9px] left-0 px-[5px] bg-[#0C0D0D] font-mono text-[9px] tracking-[0.12em] uppercase text-[#a78bfa] pointer-events-none z-[4]">
                  NAME · FIELD
                </span>
                <label htmlFor="name" className="flabel block font-mono text-[9px] tracking-[0.14em] uppercase text-[#6b7280] mb-2">
                  Full Name <span className="text-[#a78bfa]">*</span>
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Alex from Acme Ops"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="ctrl w-full h-12 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] px-[14px] text-[0.95rem] text-white rounded-none outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_0_1px_rgba(139,92,246,0.35)] transition-all placeholder:text-[rgba(156,163,175,0.55)]"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name ? <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrors.name}</p> : null}
              </div>

              <div className="field relative mb-4">
                <span className="field-meta absolute -top-[9px] left-0 px-[5px] bg-[#0C0D0D] font-mono text-[9px] tracking-[0.12em] uppercase text-[#a78bfa] pointer-events-none z-[4]">
                  EMAIL · FIELD
                </span>
                <label htmlFor="email" className="flabel block font-mono text-[9px] tracking-[0.14em] uppercase text-[#6b7280] mb-2">
                  Email Address <span className="text-[#a78bfa]">*</span>
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="alex@company.com"
                  value={formState.email}
                  onChange={handleInputChange}
                  className="ctrl w-full h-12 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] px-[14px] text-[0.95rem] text-white rounded-none outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_0_1px_rgba(139,92,246,0.35)] transition-all placeholder:text-[rgba(156,163,175,0.55)]"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email ? <p id="email-error" role="alert" className="mt-2 text-sm text-red-400">{fieldErrors.email}</p> : null}
              </div>

              <div className="field relative mb-4">
                <span className="field-meta absolute -top-[9px] left-0 px-[5px] bg-[#0C0D0D] font-mono text-[9px] tracking-[0.12em] uppercase text-[#a78bfa] pointer-events-none z-[4]">
                  BUDGET · FIELD
                </span>
                <label htmlFor="budget" className="flabel block font-mono text-[9px] tracking-[0.14em] uppercase text-[#6b7280] mb-2">
                  Budget Range
                </label>
                <select
                  id="budget"
                  name="budget"
                  value={formState.budget}
                  onChange={(event) => handleSelectChange(event.target.value)}
                  disabled={isSubmitting}
                  className="ctrl w-full h-12 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] px-[14px] text-[0.95rem] text-[#9ca3af] rounded-none outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_0_1px_rgba(139,92,246,0.35)] transition-all"
                >
                  <option value="">Select your budget range</option>
                  {BUDGET_OPTIONS.map((value) => (
                    <option key={value} value={value}>{BUDGET_LABELS[value]}</option>
                  ))}
                </select>
              </div>

              <div className="field relative mb-4">
                <span className="field-meta absolute -top-[9px] left-0 px-[5px] bg-[#0C0D0D] font-mono text-[9px] tracking-[0.12em] uppercase text-[#a78bfa] pointer-events-none z-[4]">
                  MESSAGE · FIELD
                </span>
                <label htmlFor="description" className="flabel block font-mono text-[9px] tracking-[0.14em] uppercase text-[#6b7280] mb-2">
                  Project Description <span className="text-[#a78bfa]">*</span>
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Example: We need invoice OCR or a data extraction workflow that exports clean records to our CRM within 4 weeks..."
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="ctrl w-full min-h-[140px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] px-[14px] py-[12px] text-[0.95rem] text-white rounded-none outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_0_1px_rgba(139,92,246,0.35)] transition-all placeholder:text-[rgba(156,163,175,0.55)] resize-y"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                />
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

              <div className="text-center mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label="Submit Project Estimate Request"
                  className="relative inline-flex items-center justify-center gap-3 border border-[rgba(139,92,246,0.78)] bg-[rgba(139,92,246,0.12)] px-10 py-4 font-mono text-[11px] tracking-[0.1em] uppercase text-white hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      SENDING...
                    </>
                  ) : (
                    <>
                      REQUEST ESTIMATE
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <div className="mt-3 font-mono text-[9px] tracking-[0.08em] uppercase text-[#484851]">
                  SUBMIT · FIELD
                </div>
              </div>
            </form>
          </div>

          {/* Platform links */}
          <div className="text-center mt-24">
            <h2 className="text-xl font-bold text-white mb-8 uppercase">
              Or connect on your preferred platform
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {platformLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Connect with Vivek Patel on ${link.name}`}
                    className="flex items-center gap-3 px-6 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-semibold transition-all hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(139,92,246,0.5)]"
                  >
                    <Icon aria-hidden="true" />
                    {link.name}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-6 mt-12">
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="text-gray-400 hover:text-[#8B5CF6] transition-colors"><Linkedin size={24} /></a>
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className="text-gray-400 hover:text-[#8B5CF6] transition-colors"><Github size={24} /></a>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Contact;
