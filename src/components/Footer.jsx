import React from 'react';
import { Github, Linkedin } from 'lucide-react'; 
import { toast } from "@/components/ui/use-toast";
import { Link } from 'react-router-dom';
import { socialLinks, assetsLinks } from '@/config/links'; 

const Footer = () => {
    const handleManageCookies = (e) => {
        e.preventDefault();
        // This is a simple way to signal the Layout to show the banner.
        // A more robust solution might use a global state (Context API).
        window.dispatchEvent(new CustomEvent('manage-cookies'));
        toast({
            title: "Manage Cookie Consent",
            description: "Scroll down to adjust your cookie preferences.",
        });
    };

    const footerSections = [
        {
            title: 'Quick Links',
            links: [
                { name: 'Home', href: '/' },
                { name: 'Services', href: '/#services' },
                { name: 'Portfolio', href: '/#portfolio' },
                { name: 'About', href: '/#about' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { name: 'Privacy Policy', href: '/legal' }, // Updated Path
                { name: 'Cookie Policy', href: '/data-policy' }, // Updated Path
                { name: 'Manage Consent', href: '#', onClick: handleManageCookies },
            ],
        },
        {
            title: 'Company',
            links: [
                { name: 'Contact Me', href: '/contact' },
            ],
        },
    ];

    const socialIcons = [
        { icon: <Github size={20} />, name: 'Github', href: socialLinks.github },
        { icon: <Linkedin size={20} />, name: 'Linkedin', href: socialLinks.linkedin },
    ];


    return (
        <footer className="bg-[#0C0D0D] border-t border-white/10 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Logo Section */}
                    <div className="lg:col-span-1">
                        <img src={assetsLinks.logo} alt="Vivek Patel Logo" className="h-12 mb-2" />
                        <p className="text-gray-400">Creative solutions that drive results.</p>
                    </div>

                    {/* Dynamic Sections */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <p className="font-semibold text-white mb-6">{section.title}</p>
                            <ul className="space-y-4">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.href}
                                            onClick={link.onClick}
                                            className="text-gray-400 hover:text-accent-purple transition-colors duration-300"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Social Links */}
                    <div>
                        <p className="font-semibold text-white mb-6">Connect With Me</p>
                        <div className="flex space-x-4">
                            {socialIcons.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="min-h-11 min-w-11 inline-flex items-center justify-center text-gray-400 hover:text-accent-purple transition-colors duration-300"
                                    title={`Visit my ${social.name}`}
                                    aria-label={`Visit my ${social.name} profile`}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500">
                    <p>&copy; {new Date().getFullYear()} VIVEK PATEL. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
