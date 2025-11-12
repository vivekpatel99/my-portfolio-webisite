import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const projects = [
  {
    id: 1,
    slug: 'Automated-Data-Extraction-Workflow-using-n8n',
    title: 'Automated Data Extraction Workflow using n8n and OpenAI',
    imgUrl: "https://www.upwork.com/att/download/portfolio/persons/uid/1883842334427528625/profile/projects/files/afa0fdb2-5e26-45a5-b7c2-11b3f2e7555e",
    imgAlt: "An n8n workflow for automated data extraction from German websites.",
    externalLink: "https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760",
    isExternal: true
  },
  {
    id: 2,
    slug: 'Extract-seller-and-client-information-from-photos-using-OCR',
    title: 'Extract seller and client information from photos using OCR',
    imgUrl: "https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main/output/original_with_bboxes_demo.jpg",
    imgAlt: "Invoice image with bounding boxes showing extracted client information via OCR.",
    externalLink: "https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256", 
    isExternal: true
  },
  {
    id: 3,
    slug: 'Yoga-Pose-Estimation-with-YOLO',
    title: 'Yoga Pose Estimation with YOLO',
    imgUrl: "https://www.upwork.com/att/download/portfolio/persons/uid/1883842334427528625/profile/projects/files/2f4283c5-deca-4a2a-b17d-07033247de19",
    imgAlt: "YOLO model detecting and estimating a yoga pose in an image.",
    externalLink: "https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136",
    isExternal: true
  },
  {
    id: 4,
    slug: 'football-tracking',
    title: 'Football Player Tracking System',
    imgUrl: "https://raw.githubusercontent.com/vivekpatel99/football-players-tracking-yolo/main/readme-assets/yolov12l_processed_121364_0.gif",
    imgAlt: "Animated GIF showing real-time football player tracking using YOLO and SigLIP.",
    externalLink: "https://github.com/vivekpatel99/football-players-tracking-yolo",
    isExternal: true
  },
  {
    id: 5,
    slug: 'medical-segmentation',
    title: 'Medical Image Segmentation for Cancer Detection',
    imgUrl: "https://raw.githubusercontent.com/vivekpatel99/breast-cancer-segmentation-vgg-fcn-pytorch/main/results/predictions_animation.gif",
    imgAlt: "Animation of a VGG-FCN model performing breast cancer segmentation on medical images.",
    externalLink: "https://github.com/vivekpatel99/breast-cancer-segmentation-vgg-fcn-pytorch",
    isExternal: true
  },
  {
    id: 6,
    slug: 'ai-planning-agent',
    title: 'AI Project Planning Agent',
    imgUrl: "https://raw.githubusercontent.com/vivekpatel99/project-planning-genie/main/assets/final_graph.png",
    imgAlt: "A LangGraph graph visualization for an AI project planning agent.",
    externalLink: "https://github.com/vivekpatel99/project-planning-genie",
    isExternal: true
  }
];

const ProjectCard = ({ project, onClick }) => {
  const handleClick = () => {
    if (project.isExternal && project.externalLink) {
      window.open(project.externalLink, '_blank', 'noopener,noreferrer');
    } else {
      onClick(project.slug);
    }
  };

  return (
    <div
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <img
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        alt={project.imgAlt}
        src={project.imgUrl}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Portfolio = () => {
  const navigate = useNavigate();

  const handleProjectClick = (slug) => {
    navigate(`/project/${slug}`);
  };

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
              onClick={handleProjectClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;