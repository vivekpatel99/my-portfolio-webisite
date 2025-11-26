import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <section id="about" className="py-24 bg-[#0C0D0D] overflow-hidden">
      <div className="container mx-auto px-6">

        {/* First Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, amount: 0.3 }} 
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                className="w-full h-full object-cover object-[center_28%]"
                alt="Vivek Patel, AI Engineer specializing in Computer Vision"
                src="https://raw.githubusercontent.com/vivekpatel99/portfolio-webisite-assets/e79d026c68edb3b0c2c1e02dc0420b422560f633/images/vivek-black-and-white.png"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, amount: 0.3 }} 
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white uppercase">
              WHO I <span className="text-accent-purple">AM</span>
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Vivek Patel — AI Engineer specializing in Computer Vision</h3>
                <p className="text-lg text-gray-400">I optimize complex AI systems for production. From real-time inference acceleration to automated data extraction at scale, I deliver measurable results faster than typical agency timelines.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Key Differentiators</h3>
                <p className="text-lg text-gray-400">• 94% faster inference: 37s → 2.5s (MAGNA International)<br />• CUDA, ONNX, edge deployment specialist<br />• End-to-end: vision + scraping + AI agents</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Second Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mt-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, amount: 0.3 }} 
            transition={{ duration: 0.8, ease: 'easeOut' }} 
            className="lg:order-last"
          >
            <div className="rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                className="w-full h-full object-cover"
                alt="Diverse team collaborating on a project"
                src="https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/michael-t-rxri-ho62y4-unsplash-2-tvxRc.jpg"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, amount: 0.3 }} 
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white uppercase">
              MY <span className="text-accent-purple">PROCESS</span>
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Strategy & Discovery</h3>
                <p className="text-lg text-gray-400">We'll start by understanding your data challenges, constraints, and success metrics to define the right approach—whether it's vision system optimization, data extraction, or a custom AI workflow.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Execution & Optimization</h3>
                <p className="text-lg text-gray-400">I build, test, and optimize the solution with production-grade performance standards. I deliver robust, working systems, not just prototypes.</p>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Third Section - When You Hire Me */}
        <div className="mt-20 py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white uppercase">
              WHEN YOU <span className="text-accent-purple">HIRE ME</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl">Here's exactly what to expect. I deliver a clear process, regular updates, and production-ready results.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0 }}
            >
              <div className="relative bg-white/5 rounded-lg p-6 border border-white/10 hover:border-accent-purple/50 transition-all h-full">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <h3 className="text-xl font-bold text-white mt-4 mb-3">Detailed Roadmap</h3>
                <p className="text-gray-400 text-sm">A clear project roadmap with milestones delivered within 24 hours of kickoff.</p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <div className="relative bg-white/5 rounded-lg p-6 border border-white/10 hover:border-accent-purple/50 transition-all h-full">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <h3 className="text-xl font-bold text-white mt-4 mb-3">Regular Updates</h3>
                <p className="text-gray-400 text-sm">Bi-weekly progress updates and proactive communication. No surprises.</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            >
              <div className="relative bg-white/5 rounded-lg p-6 border border-white/10 hover:border-accent-purple/50 transition-all h-full">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <h3 className="text-xl font-bold text-white mt-4 mb-3">Production Code</h3>
                <p className="text-gray-400 text-sm">Production-ready code with comprehensive documentation and clear handover.</p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            >
              <div className="relative bg-white/5 rounded-lg p-6 border border-white/10 hover:border-accent-purple/50 transition-all h-full">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                <h3 className="text-xl font-bold text-white mt-4 mb-3">Support & Optimization</h3>
                <p className="text-gray-400 text-sm">30 days of post-delivery support and a complimentary optimization pass.</p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default About;