import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const getDocumentTop = (element) => {
  let top = 0;
  let current = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent;
  }

  return top;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      let frameId;
      let attempts = 0;
      const scrollToHash = () => {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          const top = getDocumentTop(target) - 112;
          window.scrollTo({ top, behavior: 'smooth' });
          return;
        }

        attempts += 1;
        if (attempts < 20) {
          frameId = requestAnimationFrame(scrollToHash);
        }
      };

      frameId = requestAnimationFrame(scrollToHash);
      return () => cancelAnimationFrame(frameId);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
