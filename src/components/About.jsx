import React from 'react';
import { useLocale } from '@/lib/locale.js';
import { profileImages } from '@/config/links';
import { DetectionHeading, DetectionLabel } from './DetectionFrame';

const About = () => {
  const german = useLocale() === 'de';
  return (
    <section id="about" className="relative bg-[#0C0D0D] py-14 px-7 md:px-12">
      <div className="relative z-[2] max-w-[1120px] mx-auto">
        <DetectionHeading label={german ? 'Profil' : 'Profile'} className="text-[clamp(1.85rem,3.4vw,2.75rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-7">
          {german ? 'ÜBER' : 'WHO I'} <span className="text-[#8B5CF6]">{german ? 'MICH' : 'AM'}</span>
        </DetectionHeading>

        {/* Dual field columns */}
        <div className="dual quiet-grid grid md:grid-cols-[1fr_1.15fr] gap-[18px] mb-12">
          {/* Photo field */}
          <article className="field detection-panel relative p-[22px] px-6 pb-[26px] bg-transparent md:min-h-[320px]">
            <DetectionLabel>{german ? 'Porträt' : 'Portrait'}</DetectionLabel>
            <div className="photo-area aspect-[4/3] bg-[#161718] overflow-hidden">
              <img
                src={profileImages.aboutPortrait}
                srcSet={profileImages.aboutPortraitSrcSet}
                sizes="(min-width: 1216px) 465px, (min-width: 768px) calc((100vw - 114px) / 2.15 - 48px), calc(100vw - 104px)"
                width="800"
                height="664"
                alt={german ? 'Porträt von Vivek Patel' : 'Portrait of Vivek Patel'}
                loading="lazy"
                className="block w-full h-full object-cover object-[center_calc(100%+5px)]"
              />
            </div>
          </article>

          {/* Bio field */}
          <article className="field detection-panel relative p-[22px] px-6 pb-[26px] bg-transparent min-h-[320px]">
            <DetectionLabel>
              BIO · <em className="not-italic text-[#a78bfa]">{german ? 'FELD' : 'FIELD'}</em>
            </DetectionLabel>

            <div className="name-line text-[clamp(1.05rem,1.7vw,1.3rem)] font-bold leading-[1.3] tracking-[-0.015em] text-white mb-4">
              {german ? 'Vivek Patel, KI-Ingenieur mit Schwerpunkt Computer Vision' : 'Vivek Patel — AI Engineer specializing in Computer Vision'}
            </div>
            <p className="bio text-[0.92rem] leading-[1.55] text-[#9ca3af] mb-5">
              {german ? 'Ich optimiere komplexe KI-Systeme für den Produktiveinsatz, von schnellerer Echtzeit-Inferenz bis zur automatisierten Extraktion großer Datenmengen.' : 'I optimize complex AI systems for production, from real-time inference acceleration to automated data extraction at scale.'}
            </p>
            <div className="diff-label font-mono text-[10px] tracking-[0.12em] uppercase text-[#9ca3af] mb-[10px]">
              {german ? 'WAS ICH MITBRINGE' : 'KEY DIFFERENTIATORS'}
            </div>
            <ul className="diff-block">
              <li className="relative pl-[14px] text-[0.88rem] leading-[1.5] text-[#9ca3af] mb-[7px] before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.65)]">
                {german ? 'Inferenz im Produktiveinsatz für MAGNA International' : 'Production inference work for MAGNA International'}
              </li>
              <li className="relative pl-[14px] text-[0.88rem] leading-[1.5] text-[#9ca3af] mb-[7px] before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.65)]">
                {german ? 'Spezialisierung auf CUDA, ONNX und Edge-Deployment' : 'CUDA, ONNX, edge deployment specialist'}
              </li>
              <li className="relative pl-[14px] text-[0.88rem] leading-[1.5] text-[#9ca3af] before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.65)]">
                {german ? 'Durchgängige Lösungen mit Computer Vision, Scraping und KI-Agenten' : 'End-to-end: vision + scraping + AI agents'}
              </li>
            </ul>
          </article>
        </div>

        {/* When you hire me */}
        <div className="hire-head mb-5">
          <DetectionHeading label={german ? 'Projektablauf' : 'Delivery'} className="text-[clamp(1.85rem,3.4vw,2.75rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-3">
            {german ? 'IHR' : 'WHEN YOU'} <span className="text-[#8B5CF6]">{german ? 'PROJEKT MIT MIR' : 'HIRE ME'}</span>
          </DetectionHeading>
          <p className="hire-blurb text-[0.95rem] leading-[1.55] text-[#9ca3af] max-w-[640px]">
            {german ? 'Sie können mit einem klaren Ablauf, regelmäßigen Fortschrittsberichten und einsatzbereiten Ergebnissen rechnen.' : "Here's exactly what to expect. I deliver a clear process, regular updates, and production-ready results."}
          </p>
        </div>

        {/* Quiet numbered mono list */}
        <div className="hire-list flex flex-col border-t border-[rgba(255,255,255,0.08)]">
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">01</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">{german ? 'Detaillierter Projektplan' : 'Detailed Roadmap'}</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">{german ? 'Innerhalb von 24 Stunden nach Projektstart erhalten Sie einen Projektplan mit klaren Meilensteinen.' : 'A clear project roadmap with milestones delivered within 24 hours of kickoff.'}</div>
          </div>
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">02</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">{german ? 'Regelmäßige Updates' : 'Regular Updates'}</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">{german ? 'Sie erhalten wöchentlich einen Fortschrittsbericht. Bei Änderungen melde ich mich frühzeitig.' : 'Weekly progress updates and proactive communication. No surprises.'}</div>
          </div>
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">03</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">{german ? 'Produktionsreifer Code' : 'Production Code'}</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">{german ? 'Produktionsreifer Code mit ausführlicher Dokumentation und klarer Übergabe.' : 'Production-ready code with comprehensive documentation and clear handover.'}</div>
          </div>
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">04</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">{german ? 'Support und Optimierung' : 'Support & Optimization'}</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">{german ? '30 Tage Support nach der Übergabe und eine kostenlose Optimierungsrunde.' : '30 days of post-delivery support and a complimentary optimization pass.'}</div>
          </div>
        </div>

        {/* Process quiet */}
        <div className="process-quiet mt-10 pt-7 border-t border-[rgba(255,255,255,0.06)]">
          <DetectionHeading label={german ? 'Vorgehen' : 'Process'} className="text-[1.35rem] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-[18px]">
            {german ? 'MEIN' : 'MY'} <span className="text-[#8B5CF6]">{german ? 'ABLAUF' : 'PROCESS'}</span>
          </DetectionHeading>
          <div className="process-grid grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[0.95rem] font-bold mb-2 text-[#e5e7eb]">{german ? 'Analyse und Planung' : 'Strategy & Discovery'}</h3>
              <p className="text-[0.84rem] leading-[1.5] text-[#9ca3af]">
                {german ? 'Zu Beginn klären wir Ihre Anforderungen an die Daten, die Rahmenbedingungen und die Erfolgskriterien. So finden wir den passenden Ansatz für die Optimierung eines Computer-Vision-Systems, die Datenextraktion oder einen individuellen KI-Workflow.' : "We'll start by understanding your data challenges, constraints, and success metrics to define the right approach—whether it's vision system optimization, data extraction, or a custom AI workflow."}
              </p>
            </div>
            <div>
              <h3 className="text-[0.95rem] font-bold mb-2 text-[#e5e7eb]">{german ? 'Umsetzung und Optimierung' : 'Execution & Optimization'}</h3>
              <p className="text-[0.84rem] leading-[1.5] text-[#9ca3af]">
                {german ? 'Ich entwickle, teste und optimiere die Lösung für die Leistungsanforderungen im Produktiveinsatz. Sie erhalten ein robustes, funktionsfähiges System.' : 'I build, test, and optimize the solution with production-grade performance standards. I deliver robust, working systems, not just prototypes.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
