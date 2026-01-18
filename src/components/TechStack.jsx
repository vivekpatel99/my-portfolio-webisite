import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { techIcons } from '@/config/links';

const techStack = [
  { name: 'Git', logo: techIcons.git },
  { name: 'OpenCV', logo: techIcons.opencv },
  { name: 'YOLO', logo: techIcons.yolo },
  { name: 'TensorFlow', logo: techIcons.tensorflow },
  { name: 'PyTorch', logo: techIcons.pytorch },
  { name: 'n8n', logo: techIcons.n8n },
  { name: 'Python', logo: techIcons.python },
  { name: 'LangChain', logo: techIcons.langchain },
  { name: 'Streamlit', logo: techIcons.streamlit },
  { name: 'Claude', logo: techIcons.claude },
  { name: 'OpenAI', logo: techIcons.openai },
  { name: 'FastAPI', logo: techIcons.fastapi },
  { name: 'AWS', logo: techIcons.aws },
  { name: 'MLflow', logo: techIcons.mlflow },
  { name: 'Selenium', logo: techIcons.selenium },
  { name: 'Hugging Face', logo: techIcons.huggingface },
  { name: 'Docker', logo: techIcons.docker },
  { name: 'PostgreSQL', logo: techIcons.postgresql },
  { name: 'ONNX', logo: techIcons.onnx },
  { name: 'Kubernetes', logo: techIcons.kubernetes },
];

const marqueeTech = [...techStack, ...techStack];

const TechStack = () => {
  // Preload images for instant display + browser caching
  useEffect(() => {
    techStack.forEach((tech) => {
      const img = new Image();
      img.src = tech.logo;
    });
  }, []);

  const marqueeVariants = {
    animate: {
      x: [0, -(techStack.length * 240)],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 50,
          ease: 'linear',
        },
      },
    },
  };

  return (
    <section className="py-20 bg-[#0C0D0D] border-t border-b border-[#1E1E2A] overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tech Stack & Expertise</h2>
        <p className="text-lg text-gray-400 mb-12">My engineer's actual toolkit for building intelligent solutions.</p>
        <div className="relative w-full h-32 flex items-center">
          <motion.div
            className="absolute flex"
            variants={marqueeVariants}
            animate="animate"
          >
            {marqueeTech.map((tech, index) => (
              <div
                key={`${tech.name}-${index}`}
                className="flex-shrink-0 w-48 mx-6 flex flex-col justify-center items-center group"
              >
                <div className="h-20 w-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-white/5 rounded-lg p-3">
                  <img
                    className="h-full w-full object-contain"
                    alt={`${tech.name} logo`}
                    src={tech.logo}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to placeholder with tech name initial
                      e.target.onerror = null;
                      e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50' y='55' font-size='40' text-anchor='middle' fill='%23fff' font-family='Arial'%3E${tech.name[0]}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-300 opacity-80 group-hover:opacity-100 transition-opacity">
                  {tech.name}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;