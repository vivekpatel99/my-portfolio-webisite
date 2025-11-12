import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Github, Linkedin, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { socialLinks } from '@/config/links'; // Import the centralized links

// Custom logo components for platform links
const UpworkIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
  </svg>
);
const FreelancerIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13"/>
  </svg>
);
const FreelancerMapIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 3L7.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const platformLinks = [
    { name: 'Upwork', icon: UpworkIcon, url: socialLinks.upwork }, // Using centralized link
    { name: 'Freelancer.com', icon: FreelancerIcon, url: socialLinks.freelancer }, // Using centralized link
    { name: 'FreelancerMap', icon: FreelancerMapIcon, url: socialLinks.freelancerMap }, // Using centralized link
    { name: 'Email', icon: Mail, url: socialLinks.email } // Using centralized link
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };

const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', budget: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormState(prevState => ({ ...prevState, budget: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.description) {
        toast({
            title: "Uh oh! Missing fields.",
            description: "Please fill out all required fields before sending.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);

    // 1. Insert into database
    const { data: leadData, error: dbError } = await supabase
      .from('leads')
      .insert([
        { 
          name: formState.name, 
          email: formState.email, 
          budget: formState.budget, 
          description: formState.description 
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error submitting to Supabase:', dbError);
      toast({
        title: "Submission Failed",
        description: "Something went wrong saving your data. Please try again later.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // 2. Trigger email notification function
    const { error: functionError } = await supabase.functions.invoke('contact-form-email', {
      body: JSON.stringify(leadData),
    });

    if (functionError) {
      console.error('Error invoking email function:', functionError);
      // This is not a critical error for the user, so we can show a success message anyway
      // but log it for debugging. You could add a different toast for a partial success.
    }

    setIsSubmitting(false);

    toast({
      title: "🚀 Message Sent!",
      description: "Thanks for reaching out! I'll get back to you within 24 hours.",
    });
    setFormState({ name: '', email: '', budget: '', description: '' });
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <Helmet>
        <title>Contact | Vivek Patel, AI & Computer Vision Engineer</title>
        <meta name="description" content="Get a project quote from Vivek Patel. Available for freelance Computer Vision, AI, and web scraping projects. Let's discuss your idea and bring it to life with production-ready solutions." />
        <meta name="keywords" content="Contact Vivek Patel, Hire AI Engineer, Project Quote, Freelance Developer Inquiry, AI Collaboration, Computer Vision Expert" />
      </Helmet>
      
      <section className="bg-[#0C0D0D] text-white py-24 sm:py-32">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white uppercase mb-4 leading-tight">
            Let's Build Your <span className="text-accent-purple">Computer Vision</span>, <span className="text-accent-purple">Web Scraping</span> & <span className="text-accent-purple">AI</span> Projects — <span className="text-accent-purple">€80/hour</span>
            </h1>
            <p className="text-lg text-gray-400 mb-12">
              Have a project in mind? Reach out directly using the form below or connect with me on your favorite platform. I typically respond within 24 hours.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <motion.form 
              onSubmit={handleSubmit}
              className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Input type="text" name="name" placeholder="Full Name" value={formState.name} onChange={handleInputChange} className="h-14" required disabled={isSubmitting} />
              <Input type="email" name="email" placeholder="Email Address" value={formState.email} onChange={handleInputChange} className="h-14" required disabled={isSubmitting} />
              <Select onValueChange={handleSelectChange} value={formState.budget} disabled={isSubmitting}>
                <SelectTrigger className="h-14 text-gray-400">
                  <SelectValue placeholder="Optional: Select Budget Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="< €5k">&lt; €5,000</SelectItem>
                  <SelectItem value="€5k-€€10k">€5,000 - €10,000</SelectItem>
                  <SelectItem value="€10k-€25k">€10,000 - €25,000</SelectItem>
                  <SelectItem value="€25k+">€25,000+</SelectItem>
                </SelectContent>
              </Select>
              <Textarea name="description" placeholder="Tell me about your project..." value={formState.description} onChange={handleInputChange} rows={5} required disabled={isSubmitting} />
              <div className="text-center">
                 <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-0.5 text-lg font-medium text-white transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative inline-flex items-center px-8 py-3.5 transition-all duration-75 ease-in bg-[#0C0D0D] rounded-full group-hover:bg-opacity-0">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send My Project Details <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </span>
                  </button>
              </div>
            </motion.form>
          </div>

          <motion.div 
            className="text-center mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">
              Or connect on your preferred platform
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {platformLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-semibold transition-all hover:bg-white/10 hover:border-accent-purple/50"
                  >
                    <Icon />
                    {link.name}
                  </a>
                );
              })}
            </div>
          </motion.div>

          <motion.div 
            className="text-center mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
              <div className="flex justify-center space-x-6">
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent-purple transition-colors"><Linkedin size={24} /></a>
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent-purple transition-colors"><Github size={24} /></a>
              </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default Contact;