import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { socialLinks } from '@/config/links'; // Import the centralized links

// Custom logo components
const UpworkIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
  </svg>
);

const FreelancerIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13"/>
  </svg>
);

const FreelancerMapIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 3L7.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const connectOptions = [
  {
    title: 'Hire on Upwork',
    description: 'Established freelancer with a proven track record on Upwork.',
    icon: UpworkIcon,
    link: socialLinks.upwork, // Using centralized link
    external: true,
  },
  {
    title: 'Work on Freelancer.com',
    description: 'Direct collaboration on the Freelancer.com platform.',
    icon: FreelancerIcon,
    link: socialLinks.freelancer, // Using centralized link
    external: true,
  },
  {
    title: 'Collaborate on Freelancermap',
    description: 'European-focused platform for direct engagement.',
    icon: FreelancerMapIcon,
    link: socialLinks.freelancerMap, // Using centralized link
    external: true,
  },
  {
    title: 'Direct Message',
    description: 'Contact me directly for custom projects or inquiries.',
    icon: Mail,
    link: '/contact',
    external: false,
  },
];

const ConnectCard = ({ option, delay }) => {
  const Icon = option.icon;

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay }}
      className="group relative flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 h-full transition-all duration-300 hover:border-accent-purple/50 hover:bg-white/10 hover:scale-105"
    >
      <div className="mb-6 p-4 rounded-full bg-accent-purple/10 border-2 border-accent-purple/30 group-hover:bg-accent-purple/20 transition-colors">
        <Icon className="w-8 h-8 text-accent-purple" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{option.title}</h3>
      <p className="text-gray-400 leading-relaxed">{option.description}</p>
    </motion.div>
  );

  if (option.external) {
    return (
      <a href={option.link} target="_blank" rel="noopener noreferrer" className="block h-full">
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={option.link} className="block h-full">
      {cardContent}
    </Link>
  );
};

const Connect = () => {
  return (
    <section id="connect" className="py-24 bg-[#0C0D0D]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
            LET'S WORK <span className="text-accent-purple">TOGETHER</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mt-4">
            Choose your preferred platform to get started on our next project.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {connectOptions.map((option, index) => (
            <ConnectCard key={index} option={option} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Connect;