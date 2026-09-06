import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { assetsLinks } from '@/config/links';

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Services', href: '/#services' },
    { name: 'About', href: '/#about' },
    { name: 'Portfolio', href: '/#portfolio' },
    { name: 'Client feedback', href: '/#testimonials' },
  ];

  const handleScroll = () => {
    if (window.scrollY > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

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

      const focusableElements = menuRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
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
      previousFocusRef.current?.focus?.();
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
      <motion.header
        ref={headerRef}
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#0C0D0D]/80 backdrop-blur-lg border-b border-white/10' : 'bg-transparent'}`}
      >
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" onClick={handleHomeClick} className="flex items-center">
             <img src={assetsLinks.logo} alt="Vivek Patel Logo" className="h-12" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={handleSmoothScroll} className="text-gray-300 hover:text-white transition-colors relative group">
                {link.name}
                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-accent-purple transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Button className="bg-accent-purple text-white hover:bg-accent-purple/90 group rounded-full" onClick={handleCTA}>
              Request Estimate <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center text-white"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#0C0D0D] z-50 md:hidden"
          >
            <div className="container mx-auto px-6 h-full flex flex-col">
              <div className="flex justify-between items-center h-20">
                <Link to="/" onClick={handleHomeClick} className="flex items-center">
                  <img src={assetsLinks.logo} alt="Vivek Patel Logo" className="h-12" />
                </Link>
                <button ref={closeButtonRef} onClick={() => setIsOpen(false)} className="min-h-11 min-w-11 inline-flex items-center justify-center text-white" aria-label="Close navigation menu">
                  <X size={28} />
                </button>
              </div>
              <nav className="flex-grow flex flex-col justify-center items-center gap-8">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={handleSmoothScroll}
                    className="text-3xl font-semibold text-gray-300 hover:text-accent-purple transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </nav>
              <div className="py-8 flex flex-col gap-4">
                <Button className="bg-accent-purple text-white hover:bg-accent-purple/90 group w-full text-lg py-6 rounded-full" onClick={handleCTA}>
                    Request a Project Estimate <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
