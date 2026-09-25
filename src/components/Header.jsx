import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const closeButtonRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const preOpenScrollYRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Services', href: '/#services' },
    { name: 'About', href: '/#about' },
    { name: 'Case Studies', href: '/case-studies/' },
    { name: 'Testimonials', href: '/#testimonials' },
  ];

  const isActiveLink = (href) => {
    if (href === '/case-studies/') {
      return location.pathname.startsWith('/case-studies');
    }
    if (href.startsWith('/#')) {
      const hash = href.substring(1);
      return location.pathname === '/' && location.hash === hash;
    }
    return location.pathname === href;
  };

  const handleToggle = () => {
    if (!isOpen) {
      // Capture scroll BEFORE any state change, focus, or layout shift
      preOpenScrollYRef.current = window.scrollY;
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    // Use the scroll position captured BEFORE opening (synchronously on click)
    const previousScrollY = preOpenScrollYRef.current;

    // Pointer activation does not focus the toggle in every browser. Always
    // restore to the control that opened the menu rather than BODY or a stale
    // element from the page's previous focus sequence.
    previousFocusRef.current = toggleButtonRef.current;
    closeButtonRef.current?.focus({ preventScroll: true });

    const backgroundElements = [
      headerRef.current,
      document.getElementById('main-content'),
      document.querySelector('footer'),
      document.querySelector('a[href="#main-content"]'),
    ].filter(Boolean);
    const backgroundElementState = backgroundElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      hadInertAttribute: element.hasAttribute('inert'),
      inert: element.inert,
    }));
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    backgroundElements.forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('inert', '');
      element.inert = true;
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !menuRef.current) {
        return;
      }

      const focusableElements = [...menuRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => {
        const style = window.getComputedStyle(element);
        return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden';
      });

      if (!focusableElements.length) {
        return;
      }

      // Move explicitly through the complete menu sequence. This keeps links
      // reachable when WebKit's default keyboard setting skips them and also
      // gives pointer-opened menus a deterministic BODY fallback.
      const currentIndex = focusableElements.indexOf(document.activeElement);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = currentIndex === -1
        ? (event.shiftKey ? focusableElements.length - 1 : 0)
        : (currentIndex + direction + focusableElements.length) % focusableElements.length;
      event.preventDefault();
      focusableElements[nextIndex].focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      
      // Critical: restore scroll WHILE overflow still locked, BEFORE any focus
      window.scrollTo(0, previousScrollY);
      
      // Unlock overflow AFTER scroll restore
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      
      // Restore inert/aria-hidden
      backgroundElementState.forEach(({ element, ariaHidden, hadInertAttribute, inert }) => {
        if (ariaHidden === null) {
          element.removeAttribute('aria-hidden');
        } else {
          element.setAttribute('aria-hidden', ariaHidden);
        }

        if (hadInertAttribute) {
          element.setAttribute('inert', '');
        } else {
          element.removeAttribute('inert');
        }
        element.inert = inert;
      });
      
      // Focus toggle WITH preventScroll to avoid scroll jump
      previousFocusRef.current?.focus?.({ preventScroll: true });
      
      // Re-assert scroll position after focus to guard against any browser resets
      window.scrollTo(0, previousScrollY);
    };
  }, [isOpen]);

  const handleSmoothScroll = (e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const [path, id] = href.split('#');

    if (path === '/' && id) {
      const nextHash = `#${id}`;

      if (location.pathname === '/' && location.hash === nextHash) {
        document
          .getElementById(decodeURIComponent(id))
          ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      } else {
        navigate(`/#${id}`);
      }
    } else {
      navigate(href);
    }
    
    if (isOpen) {
      setIsOpen(false);
    }
  };
  
  const handleHomeClick = (e) => {
     e.preventDefault();
     navigate('/');
     if (isOpen) {
      setIsOpen(false);
    }
  }

  const handleCTA = () => {
    navigate('/contact/');
    if (isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Detection bar — thin hairline, not a boxed HUD */}
      <header 
        ref={headerRef}
        className="sticky top-0 z-40 bg-gradient-to-b from-[rgba(139,92,246,0.05)] to-[rgba(12,13,13,0.92)] backdrop-blur-[14px] border-b border-[rgba(139,92,246,0.38)]"
      >
        <div className="max-w-[1120px] mx-auto px-7 h-[68px] flex items-center gap-[22px]">
          <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3 flex-shrink-0" aria-label="Vivek Patel Logo">
            <span className="w-[30px] h-[30px] border border-[rgba(139,92,246,0.7)] grid place-items-center font-mono text-[11px] tracking-[0.06em] text-white bg-[rgba(139,92,246,0.06)]">
              VP
            </span>
          </Link>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] flex-shrink-0">
            NAV · <em className="not-italic text-[#a78bfa]">SITE</em>
          </div>
          
          <nav className="hidden md:flex items-center gap-7 ml-auto">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={handleSmoothScroll}
                className={`relative text-[0.92rem] py-[10px] pb-3 ${isActiveLink(link.href) ? 'text-white' : 'text-[#9ca3af]'} hover:text-white transition-colors`}
              >
                {link.name}
                {isActiveLink(link.href) && (
                  <span className="absolute left-0 right-0 bottom-1 h-0.5 bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.35)]"></span>
                )}
              </a>
            ))}
          </nav>
          
          <button
            onClick={handleCTA}
            className="hidden md:inline-flex flex-shrink-0 items-center gap-[10px] border border-[rgba(139,92,246,0.78)] bg-[rgba(139,92,246,0.05)] px-[14px] py-[10px] font-mono text-[11px] tracking-[0.1em] uppercase text-white hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.1)] hover:text-[#d8caff] transition-colors"
          >
            Request Estimate
            <ArrowRight className="w-3 h-3 text-[#a78bfa]" />
          </button>
          
          <button
            ref={toggleButtonRef}
            onClick={handleToggle}
            className="md:hidden w-11 h-11 flex items-center justify-center ml-auto"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <span className="relative block w-[18px] h-[1.5px] bg-white before:content-[''] before:block before:w-[18px] before:h-[1.5px] before:bg-white before:absolute before:left-0 before:-top-[6px] after:content-[''] after:block after:w-[18px] after:h-[1.5px] after:bg-white after:absolute after:left-0 after:top-[6px]"></span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-0 bg-[#0C0D0D] z-50 md:hidden flex flex-col px-5 pb-7"
          >
            <div className="h-[68px] flex items-center justify-between border-b border-[rgba(139,92,246,0.38)]">
              <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3" aria-label="Vivek Patel Logo">
                <span className="w-[30px] h-[30px] border border-[rgba(139,92,246,0.7)] grid place-items-center font-mono text-[11px] tracking-[0.06em] text-white bg-[rgba(139,92,246,0.06)]">
                  VP
                </span>
              </Link>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280]">
                NAV · <em className="not-italic text-[#a78bfa]">SITE</em>
              </div>
              <button 
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)} 
                className="w-11 h-11 relative"
                aria-label="Close navigation menu"
              >
                <span className="absolute left-3 top-[21px] w-5 h-[1.5px] bg-white rotate-45"></span>
                <span className="absolute left-3 top-[21px] w-5 h-[1.5px] bg-white -rotate-45"></span>
              </button>
            </div>
            
            <nav className="flex-1 flex flex-col justify-center gap-[22px]">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={handleSmoothScroll}
                  className={`text-[1.55rem] font-[650] tracking-[-0.02em] ${isActiveLink(link.href) ? 'text-white shadow-[inset_0_-2px_0_#8B5CF6] w-fit pb-1' : 'text-[#9ca3af]'}`}
                >
                  {link.name}
                </a>
              ))}
            </nav>
            
            <button
              onClick={handleCTA}
              aria-label="Request a Project Estimate"
              className="flex items-center justify-center gap-[10px] border border-[rgba(139,92,246,0.78)] bg-[rgba(139,92,246,0.05)] px-[14px] py-[14px] font-mono text-[11px] tracking-[0.1em] uppercase text-white hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.1)] hover:text-[#d8caff]"
            >
              Request Estimate
              <ArrowRight className="w-3 h-3 text-[#a78bfa]" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
