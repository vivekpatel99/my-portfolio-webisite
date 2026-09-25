import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Cookie, X, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from '@/components/ui/use-toast';
import {
  DEFAULT_COOKIE_CONSENT_PREFERENCES,
  readCookieConsentPreferences,
  saveCookieConsentPreferences,
} from '@/lib/consent';

const CookieConsentBanner = ({ onConsent, show, onHide }) => {
  const [isManaging, setIsManaging] = useState(show);
  const [preferences, setPreferences] = useState(DEFAULT_COOKIE_CONSENT_PREFERENCES);
  const bannerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if(show) {
      // If triggered from footer, load current settings to allow management
      const savedPrefs = readCookieConsentPreferences();
      if (savedPrefs) {
        setPreferences(savedPrefs);
      }
      setIsManaging(true);
    } else {
       // On initial load, check if consent has already been given
      const consent = readCookieConsentPreferences();
      if (!consent) {
        const timer = setTimeout(() => setIsManaging(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [show]);

  useEffect(() => {
    if (!isManaging || !show) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const scheduleFocus = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
    scheduleFocus(() => bannerRef.current?.focus());

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [isManaging, show]);

  const persistPreferences = (nextPreferences) => {
    const savedPreferences = saveCookieConsentPreferences(nextPreferences);

    if (savedPreferences.analytics) {
      onConsent();
    }

    return savedPreferences;
  };

  const handleSavePreferences = () => {
    persistPreferences(preferences);
    toast({
      title: "Preferences Saved",
      description: "Your cookie settings have been updated.",
    });
    setIsManaging(false);
    if(onHide) onHide();
  };

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true };
    setPreferences(allAccepted);
    persistPreferences(allAccepted);
    setIsManaging(false);
    if(onHide) onHide();
  };

  const handleRejectAll = () => {
    const allRejected = { necessary: true, analytics: false };
    setPreferences(allRejected);
    persistPreferences(allRejected);
    setIsManaging(false);
    if(onHide) onHide();
  };

  const handleClose = () => {
    handleRejectAll();
  };
  
  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    isManaging ? (
        <motion.div
          ref={bannerRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          tabIndex={-1}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-[72px] left-0 right-0 z-40 bg-[rgba(12,13,13,0.98)] backdrop-blur-lg border-b border-white/20 shadow-xl"
          style={{ marginBottom: 0, top: '72px' }}
        >
          <div className="max-w-[1400px] mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-accent-purple" />
            </div>
            <div className="flex-grow min-w-0">
              <h3 id="cookie-consent-title" className="text-xs sm:text-sm font-bold text-white mb-1 sm:mb-1.5">We value your privacy</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 leading-tight hidden sm:block">
                We use optional analytics. Customize below or accept all to continue.
              </p>
            </div>
            
            <Collapsible className="flex-shrink-0">
              <div className="flex flex-row gap-1.5 sm:gap-2">
                <Button
                  onClick={handleAcceptAll}
                  className="flex-shrink-0 min-h-[44px] min-w-[44px] h-auto sm:h-auto text-[11px] sm:text-xs bg-accent-purple hover:bg-accent-purple/90 text-white rounded-full px-3 sm:px-4 py-2.5 whitespace-nowrap"
                  size="sm"
                >
                  Accept
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-shrink-0 min-h-[44px] min-w-[44px] h-auto sm:h-auto text-[11px] sm:text-xs border-white/30 text-white hover:bg-white/10 rounded-full px-3 sm:px-4 py-2.5 whitespace-nowrap"
                  size="sm"
                >
                  Reject
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 sm:h-9 text-[11px] sm:text-xs text-white hover:bg-white/10 px-2 sm:px-3 whitespace-nowrap" aria-label="Options">
                    <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Options</span>
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="absolute top-full left-0 right-0 bg-[rgba(12,13,13,0.98)] backdrop-blur-lg border-b border-white/20 shadow-xl z-50">
                <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-5 space-y-3">
                  <div className="p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label htmlFor="necessary" className="text-xs sm:text-sm font-semibold text-white">Strictly Necessary</label>
                      <Checkbox id="necessary" checked disabled />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Required for the site to function.</p>
                  </div>
                  <div className="p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label htmlFor="analytics" className="text-xs sm:text-sm font-semibold text-white">Analytics</label>
                      <Checkbox id="analytics" checked={preferences.analytics} onCheckedChange={() => handleToggle('analytics')} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Google Analytics and Sentry diagnostics.</p>
                  </div>
                  <Button onClick={handleSavePreferences} className="h-9 w-full bg-white/20 hover:bg-white/30 text-white rounded-full text-xs sm:text-sm">Save Preferences</Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <button onClick={handleClose} className="flex-shrink-0 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white transition-colors" aria-label="Close cookie consent banner and reject optional cookies">
              <X size={20} />
            </button>
          </div>
        </motion.div>
    ) : null
  );
};

export default CookieConsentBanner;
