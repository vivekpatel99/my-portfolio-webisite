import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { DetectionLabel } from '@/components/DetectionFrame';
import { socialLinks } from '@/config/links';
import { contactCopy } from '@/lib/contactCopy';
import { useLocale } from '@/lib/locale.js';

// Custom logo components for platform links
const UpworkIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
  </svg>
);
const FreelancerIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13" />
  </svg>
);
const FreelancerMapIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 3L7.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const platformLinks = [
  { name: 'Upwork', icon: UpworkIcon, url: socialLinks.upwork },
  { name: 'Freelancer.com', icon: FreelancerIcon, url: socialLinks.freelancer },
  { name: 'FreelancerMap', icon: FreelancerMapIcon, url: socialLinks.freelancerMap },
  { icon: Mail, url: socialLinks.emailHref }
];

// Shared by the JavaScript form and the build-time contact fallback.
export default function ContactContent({ children }) {
  const copy = contactCopy[useLocale()];
  return (
      <section className="contact relative bg-[#0C0D0D] text-white py-12 px-7 md:px-10 min-h-[900px]">
        <div className="inner relative z-[2] max-w-[1100px] mx-auto">
          {/* Hero */}
          <div className="hero text-center max-w-[720px] mx-auto mb-7">
            <h1 className="text-[clamp(1.75rem,3.6vw,2.85rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-[14px]">
              {copy.titleLead} <span className="accent text-[#8B5CF6]">{copy.titleAccent}</span>
            </h1>
            <p className="text-base leading-[1.55] text-[#9ca3af]">
              {copy.intro}
            </p>
          </div>

          {/* Proof strip */}
          <ul className="proof flex flex-wrap justify-center gap-7 mb-3">
            <li className="flex items-center gap-[10px]">
              <span className="num text-[1.35rem] font-bold text-[#8B5CF6]">100%</span>
              <span className="lab text-xs leading-[1.25] text-[#9ca3af]">{copy.jobSuccess[0]}<br />{copy.jobSuccess[1]}</span>
            </li>
            <li className="sep w-px h-9 bg-[rgba(255,255,255,0.1)]" role="presentation" aria-hidden="true"></li>
            <li className="flex items-center gap-[10px]">
              <span className="num text-[1.35rem] font-bold text-[#8B5CF6]">5★</span>
              <span className="lab text-xs leading-[1.25] text-[#9ca3af]">{copy.rating[0]}<br />{copy.rating[1]}</span>
            </li>
          </ul>
          <p className="text-center text-sm mb-9">
            <a
              href={socialLinks.upwork}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.upworkProfileLabel}
              className="text-[#a78bfa] underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a78bfa]"
            >
              {copy.upworkProfile}
            </a>
          </p>

          {/* Layout: aside + form */}
          <div className="layout grid grid-cols-1 md:grid-cols-[0.82fr_1.18fr] gap-7 items-start">
            {/* Aside */}
            <div className="aside detection-panel bg-[rgba(255,255,255,0.03)] p-6 px-[22px]">
              <DetectionLabel aria-hidden="true">{copy.processLabel}</DetectionLabel>
              <h2 className="text-[1.15rem] font-bold uppercase tracking-[-0.01em] mb-[18px]">
                {copy.processTitle}
              </h2>
              <div className="space-y-[14px]">
                {copy.nextSteps.map((step, index) => (
                  <div key={step} className="step flex gap-[10px]">
                    <div className="tick flex-shrink-0 w-[14px] h-[14px] mt-[3px] border border-[rgba(139,92,246,0.7)] relative after:content-[''] after:absolute after:left-[3px] after:top-[1px] after:w-[5px] after:h-2 after:border-r-[1.5px] after:border-b-[1.5px] after:border-[#8B5CF6] after:rotate-[40deg]"></div>
                    <p className="text-[0.85rem] leading-[1.5] text-[#9ca3af]">
                      <strong className="text-white font-semibold">{copy.step} {index + 1}:</strong> {step}
                    </p>
                  </div>
                ))}
              </div>
              <div className="email-note detection-panel mt-[22px] bg-[rgba(139,92,246,0.08)] p-[14px]">
                <DetectionLabel aria-hidden="true">{copy.email.toUpperCase()}</DetectionLabel>
                <p className="q text-[0.8rem] text-[#9ca3af] mb-[6px]">{copy.preferEmail}</p>
                <a href={socialLinks.emailHref} className="text-[0.9rem] font-semibold text-white hover:text-[#a78bfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c4b5fd] focus-visible:outline-offset-4 [overflow-wrap:anywhere]">
                  {socialLinks.contactEmail}
                </a>
              </div>
            </div>

            {/* Form panel with detection box */}
            {children}
          </div>

          {/* Platform links */}
          <div className="text-center mt-24">
            <h2 className="text-xl font-bold text-white mb-8 uppercase">
              {copy.platforms}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {platformLinks.map((link) => {
                const Icon = link.icon;
                const name = link.name ?? copy.email;
                return (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={copy.connectLabel(name)}
                    className="detection-panel detection-action detection-action--labeled inline-flex"
                    style={{ minWidth: '170px' }}
                  >
                    <DetectionLabel aria-hidden="true">{link.name ? copy.platformLabel : copy.directContactLabel}</DetectionLabel>
                    <Icon aria-hidden="true" />
                    {name}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-6 mt-12">
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label={copy.linkedIn} className="inline-flex items-center justify-center p-2.5 text-gray-400 hover:text-[#8B5CF6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"><Linkedin size={24} /></a>
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label={copy.github} className="inline-flex items-center justify-center p-2.5 text-gray-400 hover:text-[#8B5CF6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"><Github size={24} /></a>
          </div>
        </div>
      </section>
  );
}
