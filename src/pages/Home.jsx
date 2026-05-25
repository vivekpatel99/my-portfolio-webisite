import { Helmet } from 'react-helmet';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Services from '@/components/Services';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Portfolio from '@/components/Portfolio';
import Testimonials from '@/components/Testimonials';
import Stats from '@/components/Stats';
import Connect from '@/components/Connect';
import CTA from '@/components/CTA';
import SectionAnimator from '@/components/SectionAnimator';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Vivek Patel - Expert AI & Computer Vision Engineer</title>
        <meta
          name="description"
          content="Hire Vivek Patel - Freelance AI & Computer Vision Engineer in Europe. Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain. 94% performance improvements. €80/hour."
        />
        <meta
          name="keywords"
          content="Vivek Patel, AI Engineer Europe, Computer Vision Freelancer, n8n Automation, Web Scraping Expert, YOLO, PyTorch, LangChain, Data Extraction, Python Developer Europe"
        />
        <link rel="canonical" href="https://www.vivekapatel.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.vivekapatel.com/" />
        <meta property="og:title" content="Vivek Patel - Expert AI & Computer Vision Engineer" />
        <meta
          property="og:description"
          content="Hire Vivek Patel - Freelance AI & Computer Vision Engineer in Europe. Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain."
        />
        <meta property="og:image" content="https://www.vivekapatel.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.vivekapatel.com/" />
        <meta name="twitter:title" content="Vivek Patel - Expert AI & Computer Vision Engineer" />
        <meta
          name="twitter:description"
          content="Freelance AI Engineer in Europe. Expert in Computer Vision, Web Scraping & n8n Automation. €80/hour."
        />
        <meta name="twitter:image" content="https://www.vivekapatel.com/og-image.png" />
      </Helmet>
      <Hero />
      <SectionAnimator>
        <TechStack />
      </SectionAnimator>
      <SectionAnimator>
        <Services />
      </SectionAnimator>
      <About />
      <SectionAnimator>
        <Experience />
      </SectionAnimator>
      <SectionAnimator>
        <Portfolio />
      </SectionAnimator>
      <SectionAnimator>
        <Testimonials />
      </SectionAnimator>
      <SectionAnimator>
        <Stats />
      </SectionAnimator>
      <SectionAnimator>
        <Connect />
      </SectionAnimator>
      <SectionAnimator>
        <CTA />
      </SectionAnimator>
    </>
  );
};

export default Home;
