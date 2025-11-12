import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Stats from '@/components/Stats';
import SectionAnimator from '@/components/SectionAnimator';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

// Mock data for projects
const projectData = {
  'social-media-app': {
    title: 'Next-Gen Banking UI',
    category: 'Web & App Design',
    description: 'A revolutionary banking interface designed for simplicity, security, and a seamless user experience. It empowers users with intuitive financial management tools, all within a stunning, modern design.',
    challenge: 'The primary challenge was to demystify complex banking operations. We needed to create a dashboard that was both powerful for seasoned users and approachable for beginners, all while ensuring bank-grade security and flawless performance across all devices.',
    solution: 'We developed a modular, widget-based dashboard allowing for deep personalization. By leveraging cutting-edge data visualization, we transformed complex transaction histories and investment data into beautiful, interactive charts. The implementation of biometric authentication and end-to-end encryption guarantees user data is always secure.',
    images: {
      hero: {
        alt: 'Main dashboard of a modern banking application',
        src: 'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/gemini_generated_image_n6u5epn6u5epn6u5-5ABrF.png'
      },
      gallery: [{
        alt: 'Detailed view of a transaction history page',
        src: 'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/gemini_generated_image_mxgp1bmxgp1bmxgp-IDwMQ.png'
      }, {
        alt: 'Analytics dashboard showing spending habits',
        src: 'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/gemini_generated_image_mxgp1bmxgp1bmxgp-1-RqwfI.png'
      }],
      gallery2: [{
        alt: 'User setting up a new payment on the banking app',
        src: 'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/professional-exchange-BmQpX.png'
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
  const navigate = useNavigate();

  const project = projectData[projectId];

  useEffect(() => {
    if (!project) {
        toast({
            title: "Project Not Found",
            description: "You've been redirected to the homepage.",
            variant: "destructive",
        });
        navigate('/', { replace: true });
    }
  }, [project, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  if (!project) {
    return null; // Render nothing while redirecting
  }

  return <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="bg-[#0C0D0D] text-white">
      <Helmet>
        <title>{`${project.title} | Project Case Study - Vivek Patel`}</title>
        <meta name="description" content={`Case study for the ${project.title} project. Discover the challenges, solutions, and results achieved by Vivek Patel, AI & Computer Vision Engineer.`} />
        <meta name="keywords" content={`${project.title}, case study, portfolio, Vivek Patel, ${project.category}, AI project, web development`} />
      </Helmet>

      <main>
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
                     <div className="flex justify-center items-center gap-4">
                        <Button asChild variant="outline" className="border-accent-purple/40 hover:bg-accent-purple/10 text-white rounded-full text-lg py-7 px-10">
                           <Link to="/">
                               <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
                           </Link>
                        </Button>
                        <Button asChild size="lg" className="bg-accent-purple text-white hover:bg-accent-purple/90 group rounded-full text-lg py-7 px-10">
                            <Link to="/contact">
                                Let's Talk <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </SectionAnimator>

      </main>
    </motion.div>;
};
export default Project;