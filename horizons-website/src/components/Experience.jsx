import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, Award } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from 'lucide-react';


const experienceData = [
  {
    date: 'Jul 2023 - Present',
    title: 'Software Engineer, R&D',
    company: 'MAGNA International, St. Valentin, Austria',
    highlight: '94% Performance Improvement',
    description: 'Optimized real-time image stitching from 37 seconds to 2.5 seconds using CUDA/OpenCV. Deployed vision pipelines and optimized ONNX-based AI models on NVIDIA & Hailo hardware accelerators for production systems.',
    tags: ['CUDA', 'OpenCV', 'ONNX', 'Computer Vision', 'Edge Deployment'],
    icon: TrendingUp
  },
  {
    date: 'Nov 2019 - Jun 2023',
    title: 'Software Test Engineer',
    company: 'MAGNA Powertrain, Traiskirchen, Austria',
    highlight: 'Automated Testing Pipeline',
    description: 'Developed and executed automated tests for automotive software using MATLAB/Simulink. Managed CI/CD pipelines with Jenkins for continuous integration, enabling faster release cycles and improved code quality.',
    tags: ['MATLAB', 'Simulink', 'Jenkins', 'CI/CD', 'Automation'],
    icon: Award
  },
  {
    date: 'Sep 2016 - Sep 2019',
    title: "Master's in Advanced Electronics",
    company: 'FH Joanneum, Austria',
    highlight: 'Embedded Vision Systems',
    description: 'Specialization in Automotive Electronics. Thesis: "Closed Loop Object Tracking using Python & ZYNQ deployment." Gained advanced capabilities in embedded vision systems and real-time processing.',
    tags: ['Python', 'ZYNQ', 'Embedded Systems', 'Computer Vision', 'FPGA'],
    icon: Briefcase
  },
  {
    date: 'Aug 2011 - Jan 2015',
    title: 'Bachelor of Technology, Instrumentation & Control',
    company: 'Nirma University, India',
    highlight: 'Engineering Fundamentals',
    description: 'Built a strong foundation in control systems, process automation, and industrial instrumentation, which laid the groundwork for a career in complex engineering systems.',
    tags: ['Control Systems', 'Automation', 'Industrial Systems', 'Engineering'],
    icon: Briefcase
  },
  {
    date: 'Sep 2008 - Feb 2012',
    title: 'Diploma in Instrumentation & Control',
    company: 'A.V. Parekh Technical Institute, India',
    highlight: 'Technical Foundation',
    description: 'Acquired fundamental technical skills and hands-on experience in instrumentation and control engineering, providing an essential foundation for a comprehensive engineering education.',
    tags: ['Instrumentation', 'Control', 'Technical Skills', 'Hands-on'],
    icon: Briefcase
  }
];


const ExperienceItem = ({ item, index }) => {
  const isLeft = index % 2 === 0;
  const IconComponent = item.icon || Briefcase;

  return (
    <div className="flex items-start relative">
      {/* Left content */}
      <div className={`w-[calc(50%-2rem)] ${isLeft ? 'block' : 'invisible'}`}>
        {isLeft && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="pr-8"
          >
            <Collapsible>
              <div className="bg-white/5 rounded-xl border border-white/10 p-5 transition-all hover:border-accent-purple/50 hover:bg-white/10">
                <p className="text-sm text-gray-400 mb-1">{item.date}</p>
                <CollapsibleTrigger className="w-full text-left text-accent-purple">
                  <div className="flex justify-between items-center w-full gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                      <p className="text-sm text-accent-purple font-semibold mt-1">{item.company}</p>
                    </div>
                    <div className="p-2 rounded-full bg-white/10 hover:bg-accent-purple/20 transition-colors flex-shrink-0">
                      <ChevronsUpDown className="h-4 w-4 text-accent-purple" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="bg-accent-purple/10 rounded-lg p-3 mb-3 border border-accent-purple/20">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-accent-purple" />
                      <span className="text-sm font-semibold text-accent-purple">{item.highlight}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="bg-accent-purple/10 text-accent-purple text-xs font-semibold px-2.5 py-1 rounded-full border border-accent-purple/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>
        )}
      </div>

      {/* Center timeline node */}
      <div className="flex flex-col items-center z-10 w-16">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-purple/20 border-2 border-accent-purple">
          <IconComponent className="w-5 h-5 text-accent-purple" />
        </div>
      </div>

      {/* Right content */}
      <div className={`w-[calc(50%-2rem)] ${!isLeft ? 'block' : 'invisible'}`}>
        {!isLeft && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="pl-8"
          >
            <Collapsible>
              <div className="bg-white/5 rounded-xl border border-white/10 p-5 transition-all hover:border-accent-purple/50 hover:bg-white/10">
                <p className="text-sm text-gray-400 mb-1">{item.date}</p>
                <CollapsibleTrigger className="w-full text-left text-accent-purple">
                  <div className="flex justify-between items-center w-full gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                      <p className="text-sm text-accent-purple font-semibold mt-1">{item.company}</p>
                    </div>
                    <div className="p-2 rounded-full bg-white/10 hover:bg-accent-purple/20 transition-colors flex-shrink-0">
                      <ChevronsUpDown className="h-4 w-4 text-accent-purple" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="bg-accent-purple/10 rounded-lg p-3 mb-3 border border-accent-purple/20">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-accent-purple" />
                      <span className="text-sm font-semibold text-accent-purple">{item.highlight}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="bg-accent-purple/10 text-accent-purple text-xs font-semibold px-2.5 py-1 rounded-full border border-accent-purple/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>
        )}
      </div>
    </div>
  );
};


const Experience = () => {
  return (
    <section id="experience" className="py-24 bg-[#0C0D0D]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
            EXPERIENCE <span className="text-accent-purple">JOURNEY</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mt-4">
            A 9+ year progression from education to test engineering to cutting-edge Computer Vision optimization.
          </p>
        </motion.div>

        <div className="relative">
          {/* Continuous vertical line in the center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-purple/50 via-accent-purple/30 to-accent-purple/50 transform -translate-x-1/2"></div>

          <div className="relative space-y-12">
            {experienceData.map((item, index) => (
              <ExperienceItem
                key={index}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};


export default Experience;