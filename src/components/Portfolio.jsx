import React from 'react';
import { localizedPath, useLocale } from '@/lib/locale.js';
import { Link } from 'react-router-dom';
import { collectionCaseStudies, featuredCaseStudies } from '@/data/caseStudies';
import CaseStudyCard from './CaseStudyCard.js';
import { DetectionHeading } from './DetectionFrame';

const Portfolio = () => {
  const locale = useLocale();
  const german = locale === 'de';
  return (
    <section id="portfolio" className="portfolio relative bg-[#0C0D0D] py-16 px-7 md:px-12">
      <div className="inner relative z-[2] max-w-[1180px] mx-auto">
        <DetectionHeading label={german ? 'Bisherige Arbeiten' : 'Previous work'} className="text-[clamp(1.75rem,3.2vw,2.35rem)] font-bold tracking-[-0.02em] leading-[1.15] mb-[14px]">
          {german ? 'AUSGEWÄHLTE' : 'FEATURED'} <span className="text-[#8B5CF6]">{german ? 'FALLSTUDIEN' : 'CASE STUDIES'}</span>
        </DetectionHeading>
        <p className="blurb max-w-[560px] text-[0.95rem] leading-[1.55] text-[#9ca3af] mb-10">
          {german ? 'Ausgewählte Projekte zu Datenextraktion, OCR und Computer Vision. Jede Fallstudie zeigt die Ausgangslage, die Umsetzung und das Ergebnis.' : 'Selected work in data extraction, OCR, and computer vision. Each case study shows the problem, the build, and the outcome.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[22px] gap-y-12">
          {featuredCaseStudies.map((project) => (
            <CaseStudyCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
        
        <div className="footer-link mt-9 text-center">
          <Link
            to={localizedPath("/case-studies/", locale)}
            className="detection-text-action text-[0.9rem]"
          >
            {german ? 'Alle Fallstudien ansehen' : 'View all case studies'} ({collectionCaseStudies.length})
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
