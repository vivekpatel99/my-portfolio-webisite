
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };

const DataPolicy = () => { // Renamed component
  const handleManageCookies = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('manage-cookies'));
  };

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
        <title>Cookie Policy | Vivek Patel</title>
        <meta name="description" content="Learn about the cookies used on vivek-patel.com, why they are used, and how you can manage them." />
      </Helmet>
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Cookie Policy</h1>
        <p className="text-gray-400 mb-6">Last updated: November 12, 2025</p>

        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
          <p>This Cookie Policy explains what cookies are and how we use them. You should read this policy to understand what cookies are, how we use them, the types of cookies we use, the information we collect using cookies, and how that information is used and how to control your cookie preferences.</p>
          <p>For further information on how we use, store, and keep your personal data secure, see our <Link to="/privacy-policy" className="text-accent-purple hover:underline">Privacy Policy</Link>.</p>

          <h2 className="text-2xl font-bold text-white mt-8">What Are Cookies?</h2>
          <p>Cookies are small text files that are used to store small pieces of information. They are stored on your device when the website is loaded on your browser. These cookies help us make the website function properly, make it more secure, provide a better user experience, and understand how the website performs and to analyze what works and where it needs improvement.</p>

          <h2 className="text-2xl font-bold text-white mt-8">How Do We Use Cookies?</h2>
          <p>As most of the online services, our website uses first-party and third-party cookies for several purposes. First-party cookies are mostly necessary for the website to function the right way, and they do not collect any of your personally identifiable data.</p>
          <p>The third-party cookies used on our website are mainly for understanding how the website performs, how you interact with our website, keeping our services secure, and all in all providing you with a better and improved user experience and help speed up your future interactions with our website.</p>

          <h2 className="text-2xl font-bold text-white mt-8">What Types of Cookies Do We Use?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Strictly Necessary Cookies:</strong> These are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website. Your consent is not required for these cookies.</li>
            <li><strong>Analytical/Performance Cookies:</strong> They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works. We use Google Analytics for this purpose. These cookies will only be stored with your explicit consent.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">How Can I Control My Cookie Preferences?</h2>
          <p>You can manage your cookie preferences at any time by clicking the "Manage Consent" link in the footer of our website. This will let you revisit the cookie consent banner and change your preferences or withdraw your consent right away.</p>
          <p>In addition to this, different browsers provide different methods to block and delete cookies used by websites. You can change the settings of your browser to block/delete the cookies. To find out more about how to manage and delete cookies, visit wikipedia.org, www.allaboutcookies.org.</p>
        </div>

        <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-accent-purple text-white hover:bg-accent-purple/90 group rounded-full text-lg py-6 px-8">
                <a href="#" onClick={handleManageCookies}>Manage Your Cookie Consent</a>
            </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DataPolicy; // Renamed export
