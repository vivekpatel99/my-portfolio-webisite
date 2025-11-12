import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const techStack = [
  { name: 'Git', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'OpenCV', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg' },
  { name: 'YOLO', logo: 'https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg' },
  { name: 'TensorFlow', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg' },
  { name: 'PyTorch', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg' },
  { name: 'n8n', logo: 'https://avatars.githubusercontent.com/u/45487711?s=200&v=4' },
  { name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'LangChain', logo: 'https://avatars.githubusercontent.com/u/126733545?s=200&v=4' },
  { name: 'Streamlit', logo: 'https://streamlit.io/images/brand/streamlit-mark-color.png' },
  { name: 'Claude', logo: 'https://raw.githubusercontent.com/vivekpatel99/portfolio-webisite-assets/refs/heads/main/logos/claude-color.svg' },
  { name: 'OpenAI', logo: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg' },
  { name: 'FastAPI', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg' },
  { name: 'AWS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg' },
  { name: 'MLflow', logo: 'https://www.mlflow.org/img/mlflow-black.svg' },
  { name: 'Selenium', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/selenium/selenium-original.svg' },
  { name: 'Hugging Face', logo: 'https://huggingface.co/front/assets/huggingface_logo.svg' },
  { name: 'Docker', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'PostgreSQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'ONNX', logo: 'https://www.vectorlogo.zone/logos/onnxai/onnxai-icon.svg' },
  { name: 'Kubernetes', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
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