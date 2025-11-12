
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };

const PrivacyPolicy = () => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="bg-[#0C0D0D] text-white py-24 sm:py-32"
    >
      <Helmet>
        <title>Privacy Policy | Vivek Patel</title>
        <meta name="description" content="Privacy Policy for vivek-patel.com, outlining how personal data is collected, used, and protected in compliance with GDPR." />
      </Helmet>
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-6">Last updated: November 12, 2025</p>
        
        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
          <p>Vivek Patel ("I", "me", or "my") operates the https://www.vivek-patel.com website (the "Service"). This page informs you of my policies regarding the collection, use, and disclosure of personal data when you use my Service and the choices you have associated with that data. This Privacy Policy is compliant with the General Data Protection Regulation (GDPR).</p>

          <h2 className="text-2xl font-bold text-white mt-8">Data Controller</h2>
          <p>Vivek Patel is the data controller of your personal information.</p>
          <p>Contact Email: <a href="mailto:contact@vivek-patel.com" className="text-accent-purple hover:underline">contact@vivek-patel.com</a></p>

          <h2 className="text-2xl font-bold text-white mt-8">Information Collection and Use</h2>
          <p>I collect several different types of information for various purposes to provide and improve my Service to you.</p>
          <h3 className="text-xl font-semibold text-white mt-4">Types of Data Collected</h3>
          <p><strong>Personal Data (Contact Form):</strong> While using my Service, specifically the contact form, I may ask you to provide me with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Email address</li>
            <li>Full Name</li>
            <li>Project Description and Budget</li>
          </ul>
          <p><strong>Usage Data (with consent):</strong> With your explicit consent via our cookie banner, I may also collect information on how the Service is accessed and used ("Usage Data") through Google Analytics. This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.</p>
          <p><strong>Cookies Data:</strong> I use cookies and similar tracking technologies to track the activity on our Service. Please see my <Link to="/cookie-policy" className="text-accent-purple hover:underline">Cookie Policy</Link> for more details.</p>

          <h2 className="text-2xl font-bold text-white mt-8">Legal Basis for Processing under GDPR</h2>
          <p>If you are from the European Economic Area (EEA), Vivek Patel's legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Data I collect and the specific context in which I collect it:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Consent:</strong> You have given me permission to do so for a specific purpose (e.g., analytics cookies).</li>
            <li><strong>Legitimate Interests:</strong> Processing your data from the contact form is necessary for the purposes of my legitimate interest in responding to your project inquiry, and this interest is not overridden by your data protection rights.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">Your Data Protection Rights Under GDPR</h2>
          <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights. I aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>The right to access, update or delete</strong> the information I have on you.</li>
            <li><strong>The right of rectification.</strong></li>
            <li><strong>The right to object.</strong></li>
            <li><strong>The right of restriction.</strong></li>
            <li><strong>The right to data portability.</strong></li>
            <li><strong>The right to withdraw consent.</strong></li>
          </ul>
          <p>To exercise any of these rights, please contact me at my email address listed above. Please note that I may ask you to verify your identity before responding to such requests.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8">Data Processors</h2>
          <p>I use third-party services to facilitate my service ("Service Providers"), and these are my main data processors:</p>
          <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase:</strong> For database hosting and backend services (contact form submissions).</li>
              <li><strong>Google Analytics:</strong> For website traffic analysis (with your consent).</li>
              <li><strong>Hostinger:</strong> For website hosting.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">Changes to This Privacy Policy</h2>
          <p>I may update my Privacy Policy from time to time. I will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
