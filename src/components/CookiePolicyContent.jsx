import React from 'react';
import { Link } from 'react-router-dom';
import { localizedPath, useLocale } from '@/lib/locale';
import { cookieCopy } from '@/data/policyCopy';
import { socialLinks } from '@/config/links';
import { Button } from '@/components/ui/button';

export default function CookiePolicyContent({ onManageCookies }) {
  const locale = useLocale();
  const copy = cookieCopy[locale];
  return (
    <div className="bg-[#0C0D0D] text-white py-24 sm:py-32">
      <div className="container mx-auto px-6 max-w-4xl break-words">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">{copy.title}</h1>
        <p className="text-gray-400 mb-6">{copy.updated}</p>

        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
          <p>{copy.introduction}</p>
          <p>{copy.personalData} <Link to={localizedPath("/legal/", locale)} className="text-accent-purple-text underline underline-offset-2">{copy.privacyPolicy}</Link>.</p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.definitionHeading}</h2>
          <p>{copy.definition}</p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.useHeading}</h2>
          <p>{copy.firstParty}</p>
          <p>{copy.thirdParty}</p>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.typesHeading}</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{copy.necessaryLabel}</strong> {copy.necessary} <code className="break-all">cookie_consent_preferences</code>{copy.storageExplanation}</li>
            <li><strong>{copy.analyticsLabel}</strong> {copy.analytics}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">{copy.preferencesHeading}</h2>
          <p>{copy.managePreferences}</p>
          <p>{copy.browserSettings}</p>
        </div>

        <div className="mt-12 text-center">
          {onManageCookies ? (
            <Button type="button" onClick={onManageCookies} size="lg" className="bg-accent-purple text-white hover:bg-accent-purple/90 group rounded-full text-lg h-auto min-h-11 max-w-full py-3 px-6 sm:px-8">
              {copy.manageButton}
            </Button>
          ) : (
            <p className="text-gray-300">
              {copy.fallback} <a href={socialLinks.emailHref} className="text-accent-purple-text underline underline-offset-2">{socialLinks.contactEmail}</a>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
