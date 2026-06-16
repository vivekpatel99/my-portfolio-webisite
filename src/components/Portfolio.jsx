import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { portfolioImages } from '@/config/links';

const projects = [
  {
    id: 1,
    slug: 'n8n-openai-data-extraction',
    title: 'Automated Data Extraction — n8n + OpenAI',
    imgUrl: portfolioImages.n8nWorkflow,
    imgAlt: "An n8n workflow for automated data extraction from German websites.",
    externalLink: "https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760",
    isExternal: false
  },
  {
    id: 2,
    slug: 'invoice-ocr-extraction',
    title: 'Invoice OCR Data Extraction',
    imgUrl: portfolioImages.invoiceOcr,
    imgAlt: "Invoice image with bounding boxes showing extracted client information via OCR.",
    externalLink: "https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256",
    isExternal: false
  },
  {
    id: 3,
    slug: 'yolo-computer-vision-optimization',
    title: 'Real-time Yoga Pose Detection — YOLO',
    imgUrl: portfolioImages.yogaPose,
    imgAlt: "YOLO model detecting and estimating a yoga pose in an image.",
    externalLink: "https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136",
    isExternal: false
  },
  {
    id: 4,
    slug: 'football-tracking',
    title: 'Multi-Player Sports Tracking — YOLO + SigLIP',
    imgUrl: portfolioImages.footballTrackingPreview,
    imgAlt: "Static preview for a football player tracking project using YOLO and SigLIP.",
    externalLink: "https://github.com/vivekpatel99/football-players-tracking-yolo",
    isExternal: true
  },
  {
    id: 5,
    slug: 'medical-segmentation',
    title: 'Medical Image Segmentation — VGG-FCN',
    imgUrl: portfolioImages.medicalSegmentation,
    imgAlt: "Animation of a VGG-FCN model performing breast cancer segmentation on medical images.",
    externalLink: "https://github.com/vivekpatel99/breast-cancer-segmentation-vgg-fcn-pytorch",
    isExternal: true
  },
  {
    id: 6,
    slug: 'ai-planning-agent',
    title: 'AI Planning Agent — LangGraph',
    imgUrl: portfolioImages.aiPlanningAgent,
    imgAlt: "A LangGraph graph visualization for an AI project planning agent.",
    externalLink: "https://github.com/vivekpatel99/project-planning-genie",
    isExternal: true
  }
];

const ProjectCardContent = ({ project }) => (
  <>
      <img
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        alt={project.imgAlt}
        src={project.imgUrl}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-0 opacity-100 lg:translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-300">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
  </>
);

const ProjectCard = ({ project }) => {
  const className = "group relative block aspect-[4/3] rounded-2xl overflow-hidden focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent-purple";

  if (project.isExternal && project.externalLink) {
    return (
      <a
        href={project.externalLink}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={`View project: ${project.title}`}
      >
        <ProjectCardContent project={project} />
      </a>
    );
  }

  return (
    <Link
      to={`/project/${project.slug}`}
      className={className}
      aria-label={`Read case study: ${project.title}`}
    >
      <ProjectCardContent project={project} />
    </Link>
  );
};

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
              My Latest <span className="text-accent-purple">Projects</span>
            </h2>
            <p className="text-lg text-gray-400 mt-6 mb-12">
              A showcase of successful projects combining Computer Vision, Web Scraping, and AI optimization. Each case study highlights measurable results and the tech stack used.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard
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
