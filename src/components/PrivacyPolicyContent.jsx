import React from 'react';
import { Link } from 'react-router-dom';
import { localizedPath, useLocale } from '@/lib/locale';
import { privacyCopy } from '@/data/policyCopy';
import { socialLinks } from '@/config/links';

export default function PrivacyPolicyContent() {
  const locale = useLocale();
  const copy = privacyCopy[locale];
  return (
    <div className="bg-[#0C0D0D] text-white py-24 sm:py-32">
      <div className="container mx-auto px-6 max-w-4xl break-words">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">{copy.title}</h1>
        <p className="text-gray-400 mb-6">{copy.updated}</p>

        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
          <p>{copy.introduction}</p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.controllerHeading}</h2>
          <p>{copy.controller}</p>
          <p>{copy.contactEmail} <a href={socialLinks.emailHref} className="text-accent-purple-text underline underline-offset-2">{socialLinks.contactEmail}</a></p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.collectionHeading}</h2>
          <p>{copy.collection}</p>
          <h3 className="text-xl font-semibold text-white mt-4">{copy.typesHeading}</h3>
          <p><strong>{copy.personalDataLabel}</strong> {copy.personalData}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{copy.email}</li>
            <li>{copy.name}</li>
            <li>{copy.project}</li>
          </ul>
          <p><strong>{copy.usageDataLabel}</strong> {copy.usageData}</p>
          <p><strong>{copy.cookieDataLabel}</strong> {copy.cookieData} <Link to={localizedPath("/data-policy/", locale)} className="text-accent-purple-text underline underline-offset-2">{copy.cookiePolicy}</Link>{copy.cookiePolicySuffix}</p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.basisHeading}</h2>
          <p>{copy.basis}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{copy.consentLabel}</strong> {copy.consent}</li>
            <li><strong>{copy.interestLabel}</strong> {copy.interest}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.rightsHeading}</h2>
          <p>{copy.rights}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{copy.accessLabel}</strong> {copy.access}</li>
            <li><strong>{copy.rectification}</strong></li>
            <li><strong>{copy.objection}</strong></li>
            <li><strong>{copy.restriction}</strong></li>
            <li><strong>{copy.portability}</strong></li>
            <li><strong>{copy.withdrawal}</strong></li>
          </ul>
          <p>{copy.exerciseRights}</p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.processorsHeading}</h2>
          <p>{copy.processors}</p>
          <ul className="list-disc pl-5 space-y-2">
              <li><strong><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-purple-text underline underline-offset-2">Resend</a>:</strong> {copy.resend}</li>
              <li><strong><a href="https://www.convex.dev/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-purple-text underline underline-offset-2">Convex</a>:</strong> {copy.convex}</li>
              <li><strong>Google Analytics:</strong> {copy.analytics}</li>
              <li><strong><a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-accent-purple-text underline underline-offset-2">Sentry</a>:</strong> {copy.sentry}</li>
              <li><strong>Hostinger:</strong> {copy.hosting}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.changesHeading}</h2>
          <p>{copy.changes}</p>
        </div>
      </div>
    </div>
  );
}
