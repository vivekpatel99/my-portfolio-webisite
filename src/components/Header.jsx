import React, { useState, useEffect, useRef } from 'react';
import { DetectionLabel } from './DetectionFrame';
import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { shellCopy } from '@/data/shellCopy';
import { useLocale, localizedPath } from '@/lib/locale';
import { findTranslatedRoute } from '@/lib/localizedRoutes';
import { logos } from '@/config/links';
import { focusNavigationTarget, isModifiedClick } from '@/lib/focusTarget';

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Header = ({ staticNavigation = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const closeButtonRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const desktopEstimateRef = useRef(null);
  const preOpenScrollYRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const locale = useLocale();
  const copy = shellCopy[locale];
  const home = localizedPath('/', locale);
  const contact = localizedPath('/contact/', locale);
  const collection = localizedPath('/case-studies/', locale);

  const navLinks = [
    { name: copy.services, href: `${home}#services` },
    { name: copy.about, href: `${home}#about` },
    { name: copy.caseStudies, href: collection },
    { name: copy.testimonials, href: `${home}#testimonials` },
  ];

  const currentPage = findTranslatedRoute(location.pathname);
  const targetLocale = locale === 'en' ? 'de' : 'en';
  const languageSwitch = currentPage ? (
    <Link
      to={localizedPath(`${location.pathname}${location.search}${location.hash}`, targetLocale)}
      state={location.state}
      onClick={(event) => { if (!isModifiedClick(event)) setIsOpen(false); }}
      lang={targetLocale}
      hrefLang={targetLocale}
      className="detection-utility inline-flex min-h-11 items-center self-start px-2 text-sm text-[#d1d5db] hover:text-white"
    >
      {targetLocale === 'de' ? 'Deutsch' : 'English'}
    </Link>
  ) : null;

  const currentType = (href) => {
    if (href === collection && currentPage?.en === '/case-studies') return 'page';
    if (href.includes('#') && currentPage?.en === '/' && href === `${home}${location.hash}`) return 'location';
    return undefined;
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

    // Restore focus for a11y. Blur co-actor before focus.
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const handleDesktopChange = (event) => {
      if (event.matches) setIsOpen(false);
    };
    desktopQuery.addEventListener('change', handleDesktopChange);
    closeButtonRef.current?.focus({ preventScroll: true });

    const backgroundElements = [
      headerRef.current,
      document.getElementById('main-content'),
      document.getElementById('site-footer'),
      document.querySelector('a[href="#main-content"]'),
    ].filter(Boolean);
    const backgroundElementState = backgroundElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      hadInertAttribute: element.hasAttribute('inert'),
      inert: element.inert,
    }));

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
      desktopQuery.removeEventListener('change', handleDesktopChange);
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
      const focusTarget = desktopQuery.matches ? desktopEstimateRef.current : toggleButtonRef.current;
      focusTarget?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const handleSmoothScroll = (e) => {
    if (isModifiedClick(e)) return;
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const [path, id] = href.split('#');

    if (path === home && id) {
      const nextHash = `#${id}`;

      if (currentPage?.en === '/' && location.hash === nextHash) {
        const target = document.getElementById(decodeURIComponent(id));
        target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        // Defer so a closing mobile menu restores inert/focus first; the target wins.
        window.setTimeout(() => focusNavigationTarget(target), 0);
      } else {
        navigate(href);
      }
    } else {
      navigate(href);
    }

    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleHomeClick = (e) => {
    if (isModifiedClick(e)) return;
    e.preventDefault();
    navigate(home);
    if (isOpen) {
      setIsOpen(false);
    }
  }

  const handleEstimateClick = (event) => {
    if (!isModifiedClick(event)) setIsOpen(false);
  };

  return (
    <>
      {/* Detection bar — thin hairline, not a boxed HUD */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-gradient-to-b from-[rgba(139,92,246,0.05)] to-[rgba(12,13,13,0.92)] backdrop-blur-[14px] border-b border-[rgba(139,92,246,0.38)]"
      >
        <div
          className="max-w-[1120px] mx-auto px-7 flex items-center gap-3 lg:gap-[22px]"
          style={{ height: 'calc(var(--site-header-height) - 1px)' }}
        >
          <Link to={home} onClick={handleHomeClick} className="detection-utility flex items-center flex-shrink-0" aria-label={copy.homeLink}>
            <img src={logos.logo} srcSet={logos.logoSrcSet} alt="" width="30" height="30" className="w-[30px] h-[30px] object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-7 ml-auto">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={handleSmoothScroll}
                aria-current={currentType(link.href)}
                className={`detection-nav-link text-[0.92rem] py-[10px] pb-3 ${currentType(link.href) ? 'detection-panel detection-panel--nav-selected text-white' : 'text-[#9ca3af]'} hover:text-white transition-colors`}
              >
                {link.name}
              </a>
            ))}
          </nav>
          {languageSwitch && <div className="hidden md:flex">{languageSwitch}</div>}

          <Link
            ref={desktopEstimateRef}
            to={contact}
            className="detection-panel detection-action detection-action--labeled detection-action--primary detection-action--compact hidden md:inline-flex"
          >
            <DetectionLabel aria-hidden="true">{copy.inquiry}</DetectionLabel>
            {copy.estimate}
            <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          </Link>

          {staticNavigation ? (
            <details className="md:hidden ml-auto">
              <summary
                className="detection-utility w-11 h-11 flex items-center justify-center cursor-pointer list-none [&::-webkit-details-marker]:hidden"
                aria-label={copy.toggleMenu}
                aria-controls="static-mobile-menu"
              >
                <span aria-hidden="true" className="relative block w-[18px] h-[1.5px] bg-white before:content-[''] before:block before:w-[18px] before:h-[1.5px] before:bg-white before:absolute before:left-0 before:-top-[6px] after:content-[''] after:block after:w-[18px] after:h-[1.5px] after:bg-white after:absolute after:left-0 after:top-[6px]"></span>
              </summary>
              <nav
                id="static-mobile-menu"
                aria-label={copy.menu}
                className="absolute left-0 right-0 top-full bg-[#0C0D0D] border-b border-[rgba(139,92,246,0.38)] px-7 py-4 flex flex-col items-start gap-2"
              >
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    aria-current={currentType(link.href)}
                    className={`detection-nav-link text-[0.92rem] py-[10px] pb-3 ${currentType(link.href) ? 'detection-panel detection-panel--nav-selected text-white' : 'text-[#9ca3af]'} hover:text-white transition-colors`}
                  >
                    {link.name}
                  </a>
                ))}
                {languageSwitch}
                <a
                  href={contact}
                  aria-label={copy.estimateLabel}
                  className="detection-panel detection-action detection-action--labeled detection-action--primary detection-action--compact inline-flex w-full mt-3"
                >
                  <DetectionLabel aria-hidden="true">{copy.inquiry}</DetectionLabel>
                  {copy.estimate}
                  <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                </a>
              </nav>
            </details>
          ) : (
            <button
              ref={toggleButtonRef}
              disabled={typeof window === 'undefined'}
              onClick={handleToggle}
              className="detection-utility md:hidden w-11 h-11 flex items-center justify-center ml-auto"
              aria-label={copy.toggleMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span className="relative block w-[18px] h-[1.5px] bg-white before:content-[''] before:block before:w-[18px] before:h-[1.5px] before:bg-white before:absolute before:left-0 before:-top-[6px] after:content-[''] after:block after:w-[18px] after:h-[1.5px] after:bg-white after:absolute after:left-0 after:top-[6px]"></span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {isOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={copy.menu}
          className="fixed inset-0 bg-[#0C0D0D] z-50 md:hidden flex flex-col overflow-y-auto px-5 pb-7 overscroll-contain touch-none"
          style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        >
          <div className="h-[68px] flex items-center justify-between border-b border-[rgba(139,92,246,0.38)]">
            <Link to={home} onClick={handleHomeClick} className="detection-utility flex items-center" aria-label={copy.homeLink}>
              <img src={logos.logo} srcSet={logos.logoSrcSet} alt="" width="30" height="30" className="w-[30px] h-[30px] object-contain" />
            </Link>
            <button
              ref={closeButtonRef}
              onClick={() => setIsOpen(false)}
              className="detection-utility w-11 h-11 relative"
              aria-label={copy.closeMenu}
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
                aria-current={currentType(link.href)}
                className={`detection-nav-link text-[1.55rem] font-[650] tracking-[-0.02em] ${currentType(link.href) ? 'detection-panel detection-panel--nav-selected text-white' : 'text-[#9ca3af]'} hover:text-white transition-colors`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {languageSwitch}
          <Link
            to={contact}
            onClick={handleEstimateClick}
            aria-label={copy.estimateLabel}
            className="detection-panel detection-action detection-action--labeled detection-action--primary detection-action--compact inline-flex w-full"
          >
            <DetectionLabel aria-hidden="true">{copy.inquiry}</DetectionLabel>
            {copy.estimate}
            <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>
      )}
    </>
  );
};

export default Header;
