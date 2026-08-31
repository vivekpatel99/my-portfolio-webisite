import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Github, Linkedin, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@convex/api';
import { socialLinks } from '@/config/links';
import { Seo } from '@/lib/seo';
import { captureException } from '@/lib/sentryTelemetry';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLead = useMutation(api.leads.submitLead);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormState(prevState => ({ ...prevState, budget: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedFormState = {
      ...formState,
      name: formState.name.trim(),
      email: formState.email.trim().toLowerCase(),
      description: formState.description.trim(),
    };

    if (!trimmedFormState.name || !trimmedFormState.email || !trimmedFormState.description) {
        toast({
            title: "Uh oh! Missing fields.",
            description: "Please fill out all required fields before sending.",
            variant: "destructive",
        });
        return;
    }

    if (!EMAIL_PATTERN.test(trimmedFormState.email)) {
      toast({
        title: "Invalid email address.",
        description: "Please enter a valid email address before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLead({
        name: trimmedFormState.name,
        email: trimmedFormState.email,
        budget: formState.budget || undefined,
        description: trimmedFormState.description,
      });
    } catch (error) {
      captureException(error);
      const convexMessage =
        typeof error?.data === 'string'
          ? error.data
          : error?.data?.message;
      const description =
        convexMessage ??
        error?.message?.replace(/^\[CONVEX[^\]]*\]\s*/i, '') ??
        'Something went wrong saving your data. Please try again later.';
      toast({
        title: "Submission Failed",
        description,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    toast({
      title: "🚀 Message Sent!",
      description: "Thanks for reaching out! I'll get back to you within 24 hours.",
    });
    setFormState({ name: '', email: '', budget: '', description: '' });
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <Seo
        title="Contact | Vivek Patel, AI & Computer Vision Engineer"
        description="Hire Vivek Patel for your AI project. Freelance Computer Vision, Web Scraping & n8n Automation expert based in Europe. Get a quote within 24 hours. €80/hour."
        keywords="Hire AI Engineer Europe, Computer Vision Freelancer, n8n Developer, Web Scraping Expert, Project Quote, LangChain Developer, YOLO Expert"
        path="/contact"
      />
      
      <section className="bg-[#0C0D0D] text-white py-24 sm:py-32">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white uppercase mb-4 leading-tight break-words">
              Request a <span className="text-accent-purple">Project Estimate</span>
            </h1>
            <p className="text-lg text-gray-400 mb-12">
              Share the workflow, data problem, or computer-vision bottleneck you want solved. I typically respond within 24 hours with fit, next steps, and the clearest scope path.
            </p>
          </motion.div>

          {/* Social Proof Section */}
          <motion.div
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            role="region"
            aria-label="Client success metrics"
          >
            <ul className="flex flex-wrap justify-center gap-6 text-center">
              <li className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent-purple">100%</span>
                <span className="text-gray-400 text-sm">Job Success<br/>on Upwork</span>
              </li>
              <li className="hidden sm:block w-px h-12 bg-white/10" role="separator" aria-hidden="true"></li>
              <li className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent-purple">21+</span>
                <span className="text-gray-400 text-sm">Projects<br/>Delivered</span>
              </li>
              <li className="hidden sm:block w-px h-12 bg-white/10" role="separator" aria-hidden="true"></li>
              <li className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent-purple">5★</span>
                <span className="text-gray-400 text-sm">Average<br/>Rating</span>
              </li>
            </ul>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <motion.aside
              className="rounded-lg border border-white/10 bg-white/[0.04] p-6"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              <h2 className="text-2xl font-bold uppercase text-white">What happens next</h2>
              <div className="mt-6 space-y-5">
                {nextSteps.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-purple" aria-hidden="true" />
                    <p className="text-sm leading-relaxed text-gray-300">
                      <span className="font-semibold text-white">Step {index + 1}:</span> {step}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-lg border border-accent-purple/20 bg-accent-purple/10 p-4">
                <p className="text-sm text-gray-300">Prefer email?</p>
                <a href={socialLinks.emailHref} className="mt-1 inline-flex items-center gap-2 font-semibold text-white hover:text-accent-purple">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {socialLinks.contactEmail}
                </a>
              </div>
            </motion.aside>

            <motion.form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-6 bg-white/5 p-6 sm:p-8 rounded-lg border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                <Input type="text" id="name" name="name" placeholder="Alex from Acme Ops" value={formState.name} onChange={handleInputChange} className="h-14" required disabled={isSubmitting} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                <Input type="email" id="email" name="email" placeholder="alex@company.com" value={formState.email} onChange={handleInputChange} className="h-14" required disabled={isSubmitting} />
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-2">Budget Range (Optional)</label>
                <Select onValueChange={handleSelectChange} value={formState.budget} disabled={isSubmitting}>
                  <SelectTrigger id="budget" className="h-14 text-gray-400">
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< €5k">&lt; €5,000</SelectItem>
                    <SelectItem value="€5k-€10k">€5,000 - €10,000</SelectItem>
                    <SelectItem value="€10k-€25k">€10,000 - €25,000</SelectItem>
                    <SelectItem value="€25k+">€25,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Project Description *</label>
                <Textarea id="description" name="description" placeholder="Example: We need invoice OCR or a data extraction workflow that exports clean records to our CRM within 4 weeks..." value={formState.description} onChange={handleInputChange} rows={5} required disabled={isSubmitting} />
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Helpful details to include:</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-400">
                    {descriptionPrompts.map((prompt) => (
                      <li key={prompt} className="flex gap-2">
                        <span className="text-accent-purple">•</span>
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-center">
                 <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-0.5 text-lg font-medium text-white transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative inline-flex items-center px-8 py-3.5 transition-all duration-75 ease-in bg-[#0C0D0D] rounded-full group-hover:bg-opacity-0">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Request a Project Estimate <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </span>
                  </button>
              </div>
            </motion.form>
          </div>

          <motion.div 
            className="text-center mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">
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
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-semibold transition-all hover:bg-white/10 hover:border-accent-purple/50"
                  >
                    <Icon aria-hidden="true" />
                    {link.name}
                  </a>
                );
              })}
            </div>
          </motion.div>

          <motion.div 
            className="text-center mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
              <div className="flex justify-center space-x-6">
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="text-gray-400 hover:text-accent-purple transition-colors"><Linkedin size={24} /></a>
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className="text-gray-400 hover:text-accent-purple transition-colors"><Github size={24} /></a>
              </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default Contact;
