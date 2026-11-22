import React from 'react';
import { Link } from 'react-router-dom';
import { shellCopy } from '@/data/shellCopy';
import { localizedPath, useLocale } from '@/lib/locale';
import { socialLinks } from '@/config/links';
import { DetectionLabel } from './DetectionFrame';

const Footer = () => {
    const locale = useLocale();
    const copy = shellCopy[locale];
    const handleManageCookies = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('manage-cookies'));
    };

    return (
        <footer id="site-footer" className="flex-shrink-0 px-7 pb-[22px] bg-[#0C0D0D]">
            <div className="detection-panel relative max-w-[1120px] mx-auto bg-gradient-to-b from-[rgba(139,92,246,0.035)] to-transparent bg-[length:100%_50%] bg-no-repeat px-6 pt-[18px] pb-4">
                <DetectionLabel>{copy.footer}</DetectionLabel>

                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex flex-wrap gap-2 gap-x-[22px]">
                        <Link to={localizedPath('/', locale)} className="detection-text-action font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">{copy.home}</Link>
                        <Link to={localizedPath('/#services', locale)} className="detection-text-action font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">{copy.services}</Link>
                        <Link to={localizedPath('/#portfolio', locale)} className="detection-text-action font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">{copy.portfolio}</Link>
                        <Link to={localizedPath('/#about', locale)} className="detection-text-action font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">{copy.about}</Link>
                        <Link to={localizedPath('/contact/', locale)} className="detection-text-action font-mono text-[11px] tracking-[0.1em] uppercase text-[#c4c4cc] hover:text-[#a78bfa] transition-colors">{copy.contact}</Link>
                    </div>
                    <div className="flex gap-4 font-mono text-[11px] tracking-[0.1em] uppercase text-[#9ca3af]">
                        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="detection-text-action hover:text-[#a78bfa] transition-colors">Github</a>
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="detection-text-action hover:text-[#a78bfa] transition-colors">Linkedin</a>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[rgba(255,255,255,0.07)] flex-wrap">
                    <div className="flex flex-wrap gap-2 gap-x-4">
                        <Link to={localizedPath('/legal/', locale)} className="detection-text-action font-mono text-[10px] tracking-[0.1em] uppercase text-[#9ca3af] hover:text-[#d1d5db] transition-colors">{copy.privacy}</Link>
                        <Link to={localizedPath('/data-policy/', locale)} className="detection-text-action font-mono text-[10px] tracking-[0.1em] uppercase text-[#9ca3af] hover:text-[#d1d5db] transition-colors">{copy.cookies}</Link>
                        <button onClick={handleManageCookies} className="detection-text-action font-mono text-[10px] tracking-[0.1em] uppercase text-[#9ca3af] hover:text-[#d1d5db] transition-colors">{copy.manageConsent}</button>
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#9ca3af]">
                        © {new Date().getFullYear()} Vivek Patel. {copy.rights}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
