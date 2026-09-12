import React from 'react';
import { featuredCaseStudies } from '@/data/caseStudies';
import CaseStudyCard from './CaseStudyCard.js';

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-24 bg-[#0C0D0D]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="w-full lg:w-2/3">
            <div className="inline-block px-4 py-1.5 border border-white/20 rounded-full text-sm mb-4 uppercase">
              Portfolio
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
              Featured <span className="text-accent-purple">Case Studies</span>
            </h2>
            <p className="text-lg text-gray-400 mt-6 mb-12">
              Selected work in data extraction, OCR, and computer vision. Each case study shows the problem, the build, and the outcome.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCaseStudies.map((project) => (
            <CaseStudyCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
