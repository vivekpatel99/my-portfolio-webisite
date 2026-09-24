import React from 'react';
import { Link } from 'react-router-dom';
import { socialLinks } from '@/config/links'; 

const Footer = () => {
    const handleManageCookies = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('manage-cookies'));
    };

    return (
        <footer className="flex-shrink-0 px-7 pb-[22px] bg-[#0C0D0D]">
            <div className="relative max-w-[1120px] mx-auto border border-[rgba(139,92,246,0.38)] bg-gradient-to-b from-[rgba(139,92,246,0.035)] to-transparent bg-[length:100%_50%] bg-no-repeat px-6 pt-[18px] pb-4">
                {/* Corner brackets */}
                <span className="absolute top-[5px] left-[5px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[#8B5CF6] pointer-events-none"></span>
                <span className="absolute bottom-[5px] right-[5px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.5)] pointer-events-none"></span>
                
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-[14px]">
                    FOOTER · <em className="not-italic text-[#a78bfa]">SITE</em>
                </div>
                
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex flex-wrap gap-2 gap-x-[22px]">
                        <Link to="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">Home</Link>
                        <Link to="/#services" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">Services</Link>
                        <Link to="/#portfolio" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">Portfolio</Link>
                        <Link to="/#about" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">About</Link>
                        <Link to="/contact/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">Contact Me</Link>
                    </div>
                    <div className="flex gap-4 font-mono text-[11px] tracking-[0.1em] uppercase text-[#9ca3af]">
                        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#a78bfa] transition-colors">Github</a>
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#a78bfa] transition-colors">Linkedin</a>
                    </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[rgba(255,255,255,0.07)] flex-wrap">
                    <div className="flex flex-wrap gap-2 gap-x-4">
                        <Link to="/legal/" className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#6b7280] hover:text-[#9ca3af] transition-colors">Privacy Policy</Link>
                        <Link to="/data-policy/" className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#6b7280] hover:text-[#9ca3af] transition-colors">Cookie Policy</Link>
                        <button onClick={handleManageCookies} className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#6b7280] hover:text-[#9ca3af] transition-colors">Manage Consent</button>
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#6b7280]">
                        © {new Date().getFullYear()} Vivek Patel. All Rights Reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
