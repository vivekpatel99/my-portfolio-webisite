import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Stats from '@/components/Stats';
import SectionAnimator from '@/components/SectionAnimator';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { projectGallery } from '@/config/links';
import { Seo } from '@/lib/seo';
import NotFound from '@/pages/NotFound';

// Mock data for projects
const projectData = {
  'n8n-openai-data-extraction': {
    title: 'n8n + OpenAI Data Extraction',
    category: 'AI Workflow Automation',
    description: 'A production-ready workflow that extracts structured data from German websites, validates it, and prepares it for downstream operations.',
    challenge: 'The client needed reliable structured extraction from web sources without spending hours manually copying and checking data.',
    solution: 'I designed an n8n workflow with OpenAI-assisted parsing, validation checkpoints, and handoff-ready structured outputs for downstream operations.',
    images: {
      hero: {
        alt: 'An n8n workflow for automated data extraction from German websites.',
        src: 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png'
      },
      gallery: [{
        alt: 'n8n workflow canvas showing connected automation steps.',
        src: 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png'
      }, {
        alt: 'AI workflow graph representing structured automation planning.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/project-planning-genie/main/assets/final_graph.png'
      }],
      gallery2: [{
        alt: 'Automation workflow used to coordinate extraction and validation.',
        src: 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png'
      }]
    },
    stats: [{
      value: 40,
      suffix: '+',
      label: 'Hours Saved',
      description: 'Manual weekly processing replaced with reusable automation.'
    }, {
      value: 100,
      suffix: '%',
      label: 'Structured Output',
      description: 'Consistent records prepared for review and downstream systems.'
    }, {
      value: 24,
      suffix: 'h',
      label: 'Fast Feedback',
      description: 'Clear review loops for workflow validation.'
    }, {
      value: 1,
      suffix: '',
      label: 'Reusable Workflow',
      description: 'A maintainable system the team can operate.'
    }]
  },
  'invoice-ocr-extraction': {
    title: 'Invoice OCR Extraction',
    category: 'Document AI',
    description: 'An OCR extraction workflow for pulling seller and client information from invoice photos and returning structured fields for review.',
    challenge: 'Invoice photos contained variable layouts and noisy image quality, making manual review slow and error-prone.',
    solution: 'I built an OCR pipeline that detects invoice regions, extracts key seller and client fields, and prepares structured results for validation.',
    images: {
      hero: {
        alt: 'Invoice image with bounding boxes showing extracted client information via OCR.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main/output/original_with_bboxes_demo.jpg'
      },
      gallery: [{
        alt: 'Invoice OCR output with detected information highlighted.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main/output/original_with_bboxes_demo.jpg'
      }, {
        alt: 'Automation workflow used to coordinate extraction and validation.',
        src: 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png'
      }],
      gallery2: [{
        alt: 'Invoice OCR output with detected information highlighted.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main/output/original_with_bboxes_demo.jpg'
      }]
    },
    stats: [{
      value: 1,
      suffix: '',
      label: 'OCR Pipeline',
      description: 'Extraction flow for invoice photos and reviewable data.'
    }, {
      value: 2,
      suffix: '',
      label: 'Key Parties',
      description: 'Seller and client information extracted from documents.'
    }, {
      value: 100,
      suffix: '%',
      label: 'Reviewable Fields',
      description: 'Structured outputs ready for human verification.'
    }, {
      value: 24,
      suffix: 'h',
      label: 'Clear Handoff',
      description: 'Fast iteration around real sample documents.'
    }]
  },
  'yolo-computer-vision-optimization': {
    title: 'YOLO Computer Vision Optimization',
    category: 'Computer Vision',
    description: 'A YOLO-based computer-vision project focused on reliable pose detection and production concerns around fast, usable inference.',
    challenge: 'The project needed a computer-vision demo that was accurate enough to be useful and light enough to support product workflows.',
    solution: 'I worked through YOLO-based detection, model-output review, and production-oriented optimization concerns for responsive inference.',
    images: {
      hero: {
        alt: 'YOLO model detecting and estimating a yoga pose in an image.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/yoga-pose-estimation/main/assets/demo.gif'
      },
      gallery: [{
        alt: 'Pose-estimation demo using a YOLO model.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/yoga-pose-estimation/main/assets/demo.gif'
      }, {
        alt: 'Static preview for YOLO computer vision optimization work.',
        src: '/og-image.png'
      }],
      gallery2: [{
        alt: 'Pose-estimation demo using a YOLO model.',
        src: 'https://raw.githubusercontent.com/vivekpatel99/yoga-pose-estimation/main/assets/demo.gif'
      }]
    },
    stats: [{
      value: 94,
      suffix: '%',
      label: 'Faster Inference',
      description: 'Optimization focus for production computer-vision use.'
    }, {
      value: 1,
      suffix: '',
      label: 'YOLO Pipeline',
      description: 'Detection workflow structured for reliable review.'
    }, {
      value: 30,
      suffix: 'fps',
      label: 'Realtime Goal',
      description: 'Built around responsive user-facing feedback.'
    }, {
      value: 100,
      suffix: '%',
      label: 'Production Focus',
      description: 'Attention to deployability and maintainable outputs.'
    }]
  },
  'social-media-app': {
    title: 'Next-Gen Banking UI',
    category: 'Web & App Design',
    description: 'A revolutionary banking interface designed for simplicity, security, and a seamless user experience. It empowers users with intuitive financial management tools, all within a stunning, modern design.',
    challenge: 'The primary challenge was to demystify complex banking operations. We needed to create a dashboard that was both powerful for seasoned users and approachable for beginners, all while ensuring bank-grade security and flawless performance across all devices.',
    solution: 'We developed a modular, widget-based dashboard allowing for deep personalization. By leveraging cutting-edge data visualization, we transformed complex transaction histories and investment data into beautiful, interactive charts. The implementation of biometric authentication and end-to-end encryption guarantees user data is always secure.',
    images: {
      hero: {
        alt: 'Main dashboard of a modern banking application',
        src: projectGallery.hero
      },
      gallery: [{
        alt: 'Detailed view of a transaction history page',
        src: projectGallery.gallery1
      }, {
        alt: 'Analytics dashboard showing spending habits',
        src: projectGallery.gallery2
      }],
      gallery2: [{
        alt: 'User setting up a new payment on the banking app',
        src: projectGallery.gallery3
      }]
    },
    stats: [{
      value: 50,
      suffix: '%',
      label: 'Faster Onboarding',
      description: 'Streamlined user registration process.'
    }, {
      value: 2,
      suffix: 'M+',
      label: 'Transactions Processed',
      description: 'Securely handled within the first year.'
    }, {
      value: 4.9,
      suffix: '/5',
      label: 'User Rating',
      description: 'Overwhelmingly positive feedback on app stores.'
    }, {
      value: 99.9,
      suffix: '%',
      label: 'Service Uptime',
      description: 'Uninterrupted access to banking services.'
    }]
  },
};
const pageVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
};
const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.8
};
const Project = () => {
  const {
    projectId
  } = useParams();
  const project = projectData[projectId];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  if (!project) {
    return <NotFound />;
  }

  return <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="bg-[#0C0D0D] text-white">
      <Seo
        title={`${project.title} | Project Case Study - Vivek Patel`}
        description={`Case study for the ${project.title} project. Discover the challenges, solutions, and results achieved by Vivek Patel, AI & Computer Vision Engineer.`}
        keywords={`${project.title}, case study, portfolio, Vivek Patel, ${project.category}, AI project, web development`}
        path={`/project/${projectId}`}
        type="article"
        image={project.images.hero.src}
      />

      <div>
        <SectionAnimator>
          <header className="pt-48 pb-16"> 
            <div className="container mx-auto px-6 text-center max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold uppercase mb-4">{project.title}</h1>
              <p className="text-lg md:text-xl text-gray-400">{project.description}</p>
            </div>
          </header>
        </SectionAnimator>
        
        <SectionAnimator>
            <div className="container mx-auto px-6 mb-16">
                 <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-accent-purple/10">
                    <img className="w-full h-full object-cover" alt={project.images.hero.alt} src={project.images.hero.src} />
                 </div>
            </div>
        </SectionAnimator>

        <SectionAnimator>
            <div className="container mx-auto px-6 mb-16">
                <div className="grid grid-cols-1 gap-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="aspect-square rounded-2xl overflow-hidden">
                           <img className="w-full h-full object-cover" alt={project.images.gallery[0].alt} src={project.images.gallery[0].src} />
                        </div>
                        <div className="aspect-square rounded-2xl overflow-hidden">
                            <img className="w-full h-full object-cover" alt={project.images.gallery[1].alt} src={project.images.gallery[1].src} />
                        </div>
                    </div>
                </div>
            </div>
        </SectionAnimator>
        
        <SectionAnimator>
            <section className="py-16">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">The Challenge</h2>
                        <p className="text-lg text-gray-400">{project.challenge}</p>
                    </div>
                     <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">The Solution</h2>
                        <p className="text-lg text-gray-400">{project.solution}</p>
                    </div>
                </div>
            </section>
        </SectionAnimator>
        
        <SectionAnimator>
            <div className="container mx-auto px-6 mb-16">
                <div className="aspect-video rounded-2xl overflow-hidden">
                    <img className="w-full h-full object-cover" alt={project.images.gallery2[0].alt} src={project.images.gallery2[0].src} />
                </div>
            </div>
        </SectionAnimator>

        <Stats customStats={project.stats} />

        <SectionAnimator>
            <section className="py-24 text-center">
                <div className="container mx-auto px-6">
                     <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4">
                        <Button asChild variant="outline" className="w-full sm:w-auto border-accent-purple/40 hover:bg-accent-purple/10 text-white rounded-full text-base sm:text-lg py-6 sm:py-7 px-6 sm:px-10">
                           <Link to="/">
                               <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
                           </Link>
                        </Button>
                        <Button asChild size="lg" className="w-full sm:w-auto bg-accent-purple text-white hover:bg-accent-purple/90 group rounded-full text-base sm:text-lg py-6 sm:py-7 px-6 sm:px-10">
                            <Link to="/contact">
                                Let's Talk <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </SectionAnimator>

      </div>
    </motion.div>;
};
export default Project;
