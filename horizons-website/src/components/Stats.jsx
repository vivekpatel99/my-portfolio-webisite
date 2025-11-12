import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

const NumberTicker = ({ value, suffix }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const controls = useAnimation();
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (inView) {
            controls.start({ opacity: 1, y: 0 });
            let start = 0;
            const end = value;
            const duration = 2000; // milliseconds
            let startTime = null;

            const animateCount = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const progress = (currentTime - startTime) / duration;
                const currentCount = Math.min(Math.floor(progress * end), end);
                setCount(currentCount);

                if (progress < 1) {
                    requestAnimationFrame(animateCount);
                }
            };

            requestAnimationFrame(animateCount);
        }
    }, [inView, value, controls]);

    return <span ref={ref}>{count}{suffix}</span>;
}

const defaultStats = [
  {
    value: 11,
    suffix: '+',
    label: 'Projects Delivered',
    description: 'AI and Computer Vision solutions delivered for clients across Europe and Asia—from startups to enterprises.',
  },
{
  value: 100,
    suffix: '%',
      label: 'Job Success Rate',
        description: 'Consistent 5-star reviews and positive testimonials from clients who value measurable results.',
},
{
  value: 80,
    suffix: '+',
      label: 'Freelance Hours',
        description: 'Hours spent building and optimizing real-world, production-ready AI solutions on Upwork and direct contracts.',
},
{
  value: 9,
    suffix: '+',
      label: 'Industry Experience (yrs)',
        description: 'Optimized real-time image stitching with CUDA & OpenCV at Magna—cut processing time from 37s to 2.5s and engineered vision pipelines for autonomous systems.',
},
];


const Stats = ({ customStats }) => {
  const stats = customStats || defaultStats;
  const isProjectPage = !!customStats;

  return (
    <section id="stats-section" className="py-24 bg-[#0C0D0D]">
      <div className="container mx-auto px-6">
        {!isProjectPage && (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="w-full lg:w-2/3">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
                MY RESULTS FROM <span className="text-accent-purple">UPWORK</span>
              </h2>
  
              <p className="text-lg text-gray-400 mt-6 mb-12">
                Proven results, not empty promises. I deliver AI solutions that accelerate workflows, drive measurable impact, and solve real business problems for my clients.
              </p>
            </div>
            </div>
          </div>
        )}
        
        {isProjectPage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase text-center">
              PROJECT <span className="text-accent-purple">HIGHLIGHTS</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mt-4 mx-auto text-center">
              Key achievements and metrics from this project.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                    <p className="text-5xl md:text-6xl font-extrabold text-white mb-2 leading-none">
                        <NumberTicker value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-xl md:text-2xl font-semibold text-accent-purple mb-4">{stat.label}</p>
                    <p className="text-gray-400 text-sm md:text-base">{stat.description}</p>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;