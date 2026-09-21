import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react'; // Changed import from ArrowRight, ArrowDownRight to Plus

const services = [{
  title: 'DATA EXTRACTION AUTOMATION SPRINT',
  description: 'A focused buildout for teams stuck copying information from websites, PDFs, invoices, or messy internal sources. I map the workflow, build the extractor, add validation, and deliver a reusable automation your team can actually operate.',
  price: '€3,600–€7,200',
  duration: '1–2 weeks',
  inScope: [
    'Workflow mapping and validation rules',
    'Extractor build (web scraping, PDF parsing, or OCR)',
    'Output format and delivery integration',
    'Runbook and handoff documentation'
  ],
  outOfScope: [
    'Ongoing maintenance or support contracts',
    'Training your team to modify the code',
    'Infrastructure hosting or setup'
  ]
}, {
  title: 'COMPUTER VISION PRODUCTION OPTIMIZATION',
  description: 'For existing YOLO, OCR, OpenCV, ONNX, or edge-AI systems that need to become faster and more reliable. I profile the bottlenecks, improve inference flow, and prepare the pipeline for production constraints.',
  price: '€3,600–€7,200',
  duration: '1–2 weeks',
  inScope: [
    'Performance profiling and bottleneck analysis',
    'Inference optimization (batching, quantization, format conversion)',
    'Production readiness review (error handling, logging)',
    'Before/after metrics and deployment notes'
  ],
  outOfScope: [
    'Retraining models or gathering new datasets',
    'Building the initial CV system from scratch',
    'Infrastructure provisioning or MLOps setup'
  ]
}, {
  title: 'AI WORKFLOW BUILDOUT',
  description: 'A complete workflow build for operations teams that need LLMs, n8n, APIs, scraping, and human review connected into one dependable system. Best for replacing repeatable decisions and handoffs without hiring multiple specialists.',
  price: '€7,200–€14,400',
  duration: '2–4 weeks',
  inScope: [
    'End-to-end workflow design and integration',
    'LLM prompting, API connections, and data pipeline',
    'Human review checkpoints and error handling',
    'Testing, documentation, and team handoff'
  ],
  outOfScope: [
    'Ongoing prompt tuning or model selection',
    'Replacing your internal dev team',
    'Legal review of third-party API terms'
  ]
}];
const Services = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const handleServiceClick = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };
  const filterTags = ['Fixed-scope builds', 'Production handoff', 'Automation ROI', 'Direct engineer access'];
  return <section id="services" className="py-24 bg-[#0C0D0D]">
    <div className="container mx-auto px-6 relative z-10">
      <div className="mb-16">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white uppercase">
          SERVICE <span className="text-accent-purple">OFFERS</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mt-4">Clear, purchasable ways to turn manual data work and slow AI pipelines into production-ready systems.</p>
        <div className="flex flex-wrap gap-3 mt-8" role="list">
          {filterTags.map(tag => <span key={tag} role="listitem" className="px-5 py-2 border border-gray-600 rounded-full text-gray-400 uppercase">
            {tag}
          </span>)}
        </div>
      </div>

      <div className="border-t border-gray-800">
        {services.map((service, index) => <div key={service.title} className="border-b border-gray-800">
          <div
            className="flex justify-between items-center cursor-pointer py-8 group"
            onClick={() => handleServiceClick(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleServiceClick(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={activeIndex === index}
            aria-controls={`service-content-${index}`}
          >
            <div className="flex items-center gap-4">
              <h3 className={`text-xl sm:text-2xl md:text-5xl font-bold transition-colors duration-300 break-words ${activeIndex === index ? 'text-white' : 'text-gray-400'}`}>
                {service.title}
              </h3>
              {activeIndex === index && <motion.div className="w-4 h-4 bg-accent-purple rounded-full" initial={{
                scale: 0
              }} animate={{
                scale: 1
              }} />}
            </div>

            <motion.div className="text-accent-purple" animate={{
              rotate: activeIndex === index ? 45 : 0
            }} // Rotate Plus for open state
              transition={{
                duration: 0.3
              }}>
              <Plus size={40} className={`${activeIndex === index ? 'text-accent-purple' : 'text-gray-400'} transition-colors`} />
            </motion.div>
          </div>

          <AnimatePresence>
            {activeIndex === index && <motion.div
              id={`service-content-${index}`}
              initial={{
                opacity: 0,
                height: 0,
                y: -20
              }} animate={{
                opacity: 1,
                height: 'auto',
                y: 0
              }} exit={{
                opacity: 0,
                height: 0,
                y: -20
              }} transition={{
                duration: 0.4,
                ease: "easeInOut"
              }} className="overflow-hidden">
              <div className="pb-8 pr-4 sm:pr-8 md:pr-16 space-y-6">
                <p className="text-lg text-gray-400 max-w-2xl">{service.description}</p>
                
                <div className="flex flex-wrap gap-4 text-white">
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent-purple/10 border border-accent-purple/20 rounded-lg">
                    <span className="font-semibold">{service.price}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <span className="text-gray-300">{service.duration}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                  <div>
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <span className="text-green-400">✓</span> In Scope
                    </h4>
                    <ul className="space-y-2">
                      {service.inScope.map((item, i) => (
                        <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <span className="text-gray-400">✗</span> Out of Scope
                    </h4>
                    <ul className="space-y-2">
                      {service.outOfScope.map((item, i) => (
                        <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>}
          </AnimatePresence>
        </div>)}
      </div>
    </div>
  </section>;
};
export default Services;
