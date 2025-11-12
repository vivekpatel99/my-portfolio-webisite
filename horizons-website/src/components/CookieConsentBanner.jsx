
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Cookie, X, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from '@/components/ui/use-toast';

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

const CookieConsentBanner = ({ onConsent, show, onHide }) => {
  const [isManaging, setIsManaging] = useState(show);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
  });

  useEffect(() => {
    if(show) {
      // If triggered from footer, load current settings to allow management
      const savedPrefs = JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY));
      if (savedPrefs) {
        setPreferences(savedPrefs);
      }
      setIsManaging(true);
    } else {
       // On initial load, check if consent has already been given
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        const timer = setTimeout(() => setIsManaging(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [show]);

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    if (preferences.analytics) {
      onConsent();
    }
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
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted));
    onConsent();
    setIsManaging(false);
    if(onHide) onHide();
  };

  const handleRejectAll = () => {
    const allRejected = { necessary: true, analytics: false };
    setPreferences(allRejected);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allRejected));
    setIsManaging(false);
    if(onHide) onHide();
  };
  
  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isManaging && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className="fixed bottom-4 right-4 w-auto max-w-lg p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl shadow-black/30 z-50"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-purple/20 rounded-full flex-shrink-0">
              <Cookie className="w-6 h-6 text-accent-purple" />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-white mb-1">We value your privacy</h3>
              <p className="text-sm text-gray-300 mb-4">
                We use cookies to enhance your browsing experience and analyze our traffic. Customize your preferences below or accept all to continue.
              </p>
              
              <Collapsible>
                <div className="flex gap-3 mt-4">
                   <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-full"
                    size="sm"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full"
                    size="sm"
                  >
                    Reject All
                  </Button>
                   <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-shrink-0 text-white hover:bg-white/10">
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
                        <label htmlFor="analytics" className="font-semibold text-white">Analytics Cookies</label>
                        <Checkbox id="analytics" checked={preferences.analytics} onCheckedChange={() => handleToggle('analytics')} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.</p>
                  </div>
                  <Button onClick={handleSavePreferences} className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white rounded-full">Save Preferences</Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
             <button onClick={() => { setIsManaging(false); if(onHide) onHide(); }} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
