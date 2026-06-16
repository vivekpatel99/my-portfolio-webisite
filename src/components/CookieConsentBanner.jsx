import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    window.requestAnimationFrame(() => bannerRef.current?.focus());

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
    <AnimatePresence>
      {isManaging && (
        <motion.div
          ref={bannerRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          tabIndex={-1}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-auto sm:max-w-lg p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl shadow-black/30 z-50"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-purple/20 rounded-full flex-shrink-0">
              <Cookie className="w-6 h-6 text-accent-purple" />
            </div>
            <div className="flex-grow">
              <h3 id="cookie-consent-title" className="text-lg font-bold text-white mb-1">We value your privacy</h3>
              <p className="text-sm text-gray-300 mb-4">
                We use optional analytics and diagnostics cookies to measure traffic and understand site errors with Google Analytics and Sentry. Customize your preferences below or accept all to continue.
              </p>
              
              <Collapsible>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                   <Button
                    onClick={handleAcceptAll}
                    className="min-h-11 flex-1 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-full"
                    size="sm"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    className="min-h-11 flex-1 border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full"
                    size="sm"
                  >
                    Reject All
                  </Button>
                   <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="min-h-11 flex-shrink-0 text-white hover:bg-white/10">
                      <Settings className="w-4 h-4 mr-2" />
                      Customize
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="mt-6 space-y-4">
                  <div className="p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <label htmlFor="necessary" className="font-semibold text-white">Strictly Necessary</label>
                        <Checkbox id="necessary" checked disabled />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">These cookies are essential for the website to function and cannot be switched off.</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <label htmlFor="analytics" className="font-semibold text-white">Analytics and Diagnostics Cookies</label>
                        <Checkbox id="analytics" checked={preferences.analytics} onCheckedChange={() => handleToggle('analytics')} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">These cookies allow Google Analytics and Sentry to measure visits, diagnose errors, and improve the performance of this site.</p>
                  </div>
                  <Button onClick={handleSavePreferences} className="min-h-11 w-full mt-2 bg-white/20 hover:bg-white/30 text-white rounded-full">Save Preferences</Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
             <button onClick={handleClose} className="absolute top-3 right-3 min-h-11 min-w-11 inline-flex items-center justify-center text-gray-400 hover:text-white transition-colors" aria-label="Close cookie consent banner and reject optional cookies">
                <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
