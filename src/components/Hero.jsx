import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const handleCTAClick = () => {
    navigate('/contact/');
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16 pb-16 bg-[#0C0D0D]">
      {/* Clean background with subtle grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Sparse floating detection bboxes with corner brackets */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute top-[15%] left-[8%] w-[120px] h-[160px] z-0"
        >
          {/* Corner brackets only */}
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-l-[1.5px] border-t-[1.5px] border-purple-400/60" />
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-r-[1.5px] border-t-[1.5px] border-purple-400/60" />
          <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-l-[1.5px] border-b-[1.5px] border-purple-400/60" />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-r-[1.5px] border-b-[1.5px] border-purple-400/60" />
          <span className="absolute -top-5 left-0 text-[9px] font-mono tracking-wider text-purple-300 bg-[#0C0D0D] px-1.5 py-0.5">
            person · 0.96
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute top-[55%] left-[18%] w-[100px] h-[80px] z-0"
        >
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-l-[1.5px] border-t-[1.5px] border-[#8B5CF6]/50" />
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-r-[1.5px] border-t-[1.5px] border-[#8B5CF6]/50" />
          <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-l-[1.5px] border-b-[1.5px] border-[#8B5CF6]/50" />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-r-[1.5px] border-b-[1.5px] border-[#8B5CF6]/50" />
          <span className="absolute -top-5 left-0 text-[9px] font-mono tracking-wider text-purple-300 bg-[#0C0D0D] px-1.5 py-0.5">
            package · 0.89
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="absolute top-[25%] right-[35%] w-[140px] h-[90px] z-0 max-lg:hidden"
        >
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-l-[1.5px] border-t-[1.5px] border-purple-300/45" />
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-r-[1.5px] border-t-[1.5px] border-purple-300/45" />
          <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-l-[1.5px] border-b-[1.5px] border-purple-300/45" />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-r-[1.5px] border-b-[1.5px] border-purple-300/45" />
          <span className="absolute -top-5 left-0 text-[9px] font-mono tracking-wider text-purple-200 bg-[#0C0D0D] px-1.5 py-0.5">
            vehicle · 0.92
          </span>
        </motion.div>
        
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
      </div>

      <div className="container mx-auto px-6 relative z-10 py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left column: Text with detection bboxes */}
          <div className="text-left relative max-w-[580px]">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full border border-white/[0.14] bg-white/[0.03]"
            >
              <motion.span
                animate={{ 
                  opacity: reduceMotion ? 1 : [1, 0.3, 1],
                  boxShadow: reduceMotion ? '0 0 0 0 rgba(167,139,250,0.4)' : [
                    '0 0 0 0 rgba(167,139,250,0.4)',
                    '0 0 0 8px transparent',
                    '0 0 0 0 transparent'
                  ]
                }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="w-[7px] h-[7px] rounded-full bg-purple-400"
              />
              <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400">
                Inference online
              </span>
            </motion.div>

            {/* Eyebrow with soft detection bbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="relative inline-block mb-[14px] px-[9px] py-[5px]"
            >
              {/* Corner brackets - soft */}
              <span className="absolute -top-[2px] -left-[3px] w-[7px] h-[7px] border-l border-t border-purple-400/[0.42]" />
              <span className="absolute -top-[2px] -right-[3px] w-[7px] h-[7px] border-r border-t border-purple-400/[0.42]" />
              <span className="absolute -bottom-[2px] -left-[3px] w-[7px] h-[7px] border-l border-b border-purple-400/[0.42]" />
              <span className="absolute -bottom-[2px] -right-[3px] w-[7px] h-[7px] border-r border-b border-purple-400/[0.42]" />
              {/* Tag */}
              <span className="absolute -top-[13px] left-[-4px] text-[7.5px] font-mono tracking-wide text-purple-200/55 bg-[#0C0D0D] px-1">
                person · 0.99
              </span>
              <p className="font-mono text-sm tracking-wide text-gray-400 relative z-10">
                Vivek Patel
              </p>
            </motion.div>

            {/* H1 with HARD detection bbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative inline-block mb-[22px] px-4 py-3 max-w-[22ch]"
            >
              {/* Edge line for primary strength */}
              <span className="absolute inset-0 border border-[#8B5CF6]/[0.34] pointer-events-none z-[1]" />
              {/* Corner brackets - HARD */}
              <span className="absolute -top-[5px] -left-[6px] w-4 h-4 border-l-[2.5px] border-t-[2.5px] border-[#8B5CF6]" />
              <span className="absolute -top-[5px] -right-[6px] w-4 h-4 border-r-[2.5px] border-t-[2.5px] border-[#8B5CF6]" />
              <span className="absolute -bottom-[5px] -left-[6px] w-4 h-4 border-l-[2.5px] border-b-[2.5px] border-[#8B5CF6]" />
              <span className="absolute -bottom-[5px] -right-[6px] w-4 h-4 border-r-[2.5px] border-b-[2.5px] border-[#8B5CF6]" />
              {/* Tag */}
              <span 
                className="absolute -top-[18px] -left-[6px] text-[9.5px] font-mono tracking-wider text-purple-200 bg-[#0C0D0D] px-1.5"
                style={{ textShadow: '0 0 12px rgba(139,92,246,0.35)' }}
              >
                role · 0.98
              </span>
              <h1 className="text-[clamp(2.05rem,3.5vw,2.85rem)] font-bold leading-[1.12] tracking-tight text-white relative z-[2]">
                Computer Vision & AI Engineer
              </h1>
            </motion.div>

            {/* Subhead with soft detection bbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative inline-block mb-7 px-[11px] py-[9px] max-w-[44ch]"
            >
              {/* Corner brackets - soft */}
              <span className="absolute -top-[2px] -left-[3px] w-2 h-2 border-l border-t border-purple-400/[0.38]" />
              <span className="absolute -top-[2px] -right-[3px] w-2 h-2 border-r border-t border-purple-400/[0.38]" />
              <span className="absolute -bottom-[2px] -left-[3px] w-2 h-2 border-l border-b border-purple-400/[0.38]" />
              <span className="absolute -bottom-[2px] -right-[3px] w-2 h-2 border-r border-b border-purple-400/[0.38]" />
              {/* Tag */}
              <span className="absolute -top-[13px] left-[-4px] text-[7.5px] font-mono tracking-wide text-purple-200/[0.48] bg-[#0C0D0D] px-1">
                brief · 0.94
              </span>
              <p className="text-[clamp(0.95rem,1.4vw,1.075rem)] leading-relaxed text-gray-400 relative z-[2]">
                I build detectors, document extractors, and n8n workflows that turn camera feeds and messy files into reliable production data.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-[18px]"
            >
              <Button
                onClick={handleCTAClick}
                className="bg-[#8B5CF6] hover:bg-[#9B6FFF] text-white font-semibold px-6 py-3.5 h-auto text-base rounded-[10px] min-w-[220px] min-h-[44px]"
              >
                Request a Project Estimate
              </Button>
              <Button
                asChild
                variant="outline"
                className="border border-white/[0.14] hover:bg-[#8B5CF6]/8 hover:border-purple-400/35 text-white px-6 py-3.5 h-auto text-base rounded-[10px] min-w-[150px] min-h-[44px]"
              >
                <a href="#portfolio">
                  View Case Studies
                </a>
              </Button>
            </motion.div>

            {/* Meta chips - NO bbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-2"
            >
              <span className="font-mono text-[11px] tracking-wide px-3 py-[7px] rounded-full border border-white/[0.08] bg-transparent text-gray-400">
                Starting at €45/hour
              </span>
              <span className="font-mono text-[11px] tracking-wide px-3 py-[7px] rounded-full border border-white/[0.08] bg-transparent text-gray-400">
                Based in Linz, Austria
              </span>
            </motion.div>
          </div>

          {/* Right column: Tracked frame */}
          <div className="relative flex flex-col items-end">
            {/* Tracked detection frame (Option B) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative w-full max-w-[280px] aspect-[3/4] border-[1.5px] border-purple-400 rounded bg-gradient-to-br from-[#1a1820] to-[#101012] flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.14)]"
            >
              <span className="absolute -top-[18px] left-0 text-[10px] font-mono tracking-wider text-purple-200 bg-[#0C0D0D]/90 px-2 py-0.5">
                engineer · 0.99
              </span>
              
              {/* Corner brackets */}
              <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 border-l-2 border-t-2 border-purple-400" />
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border-r-2 border-t-2 border-purple-400" />
              <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 border-l-2 border-b-2 border-purple-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-r-2 border-b-2 border-purple-400" />
              
              {/* Silhouette */}
              <div className="flex flex-col items-center justify-end gap-0 w-[58%] h-[70%]">
                <div className="w-14 h-14 rounded-full bg-[#8B5CF6]/[0.18] border border-[#8B5CF6]/35 flex items-center justify-center text-lg font-bold text-purple-200 tracking-wide">
                  VP
                </div>
                <div className="mt-2.5 w-[110px] h-[130px] rounded-[60px_60px_12px_12px] bg-white/5 border border-white/[0.07]" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pipeline bar at bottom (Option B) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute left-0 right-0 bottom-0 z-20 flex flex-wrap gap-5 justify-between px-7 py-3 bg-[#080909] border-t border-white/[0.08] text-[11px] font-mono tracking-widest uppercase text-gray-500"
      >
        <div className="flex gap-5 flex-wrap">
          <span><span className="text-gray-500">Frame</span> <span className="text-gray-400">2048×1536</span></span>
          <span><span className="text-gray-500">FPS</span> <span className="text-purple-400">24.1</span></span>
          <span><span className="text-gray-500">Model</span> <span className="text-gray-400">yolo11n</span></span>
        </div>
        <div className="flex gap-5 flex-wrap">
          <span><span className="text-gray-500">Pipeline</span> <span className="text-purple-400">detect → track → alert</span></span>
          <span><span className="text-gray-500">Latency</span> <span className="text-gray-400">41ms</span></span>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
