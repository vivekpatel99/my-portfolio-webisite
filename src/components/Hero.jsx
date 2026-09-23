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
      {/* Warehouse scene background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-radial-purple opacity-30" 
             style={{ background: 'radial-gradient(ellipse 80% 60% at 70% 40%, #16141c 0%, #0C0D0D 70%)' }} />
        
        {/* Warehouse shelves silhouettes */}
        <div className="absolute left-[8%] top-[18%] w-[22%] h-[52%] bg-white/[0.025] border border-white/[0.08]" />
        <div className="absolute left-[32%] top-[28%] w-[18%] h-[42%] bg-white/[0.025] border border-white/[0.08]" />
        <div className="absolute right-[6%] top-[14%] w-[28%] h-[58%] bg-white/[0.025] border border-white/[0.08]" />
        
        {/* Detection bboxes overlays */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute top-[22%] left-[12%] w-[14%] h-[28%] border-[1.5px] border-purple-400/50 rounded-sm z-0"
        >
          <span className="absolute -top-4 left-0 text-[9px] font-mono tracking-wider text-purple-300 bg-[#0C0D0D]/75 px-1.5 py-0.5">
            person 0.96
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute top-[35%] left-[36%] w-[10%] h-[22%] border-[1.5px] border-[#8B5CF6]/45 rounded-sm z-0"
        >
          <span className="absolute -top-4 left-0 text-[9px] font-mono tracking-wider text-purple-300 bg-[#0C0D0D]/75 px-1.5 py-0.5">
            forklift 0.88
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="absolute top-[18%] right-[14%] w-[16%] h-[36%] border-[1.5px] border-purple-300/40 rounded-sm z-0"
        >
          <span className="absolute -top-4 left-0 text-[9px] font-mono tracking-wider text-purple-200 bg-[#0C0D0D]/75 px-1.5 py-0.5">
            pallet 0.93
          </span>
        </motion.div>
        
        <div className="absolute left-0 right-0 bottom-0 h-[28%] bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10 py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left column: Copy + CTAs */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-white/[0.14] bg-white/[0.03]"
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-xs font-mono tracking-wide text-gray-500 mb-3"
            >
              Vivek Patel
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[clamp(1.85rem,4.2vw,3rem)] font-semibold leading-[1.15] tracking-tight mb-4 text-white"
            >
              Computer Vision & AI Engineer
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[clamp(0.95rem,1.5vw,1.1rem)] text-gray-400 mb-7 max-w-[42ch] leading-relaxed"
            >
              I build detectors, document extractors, and n8n workflows that turn camera feeds and messy files into reliable production data.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-5"
            >
              <Button
                onClick={handleCTAClick}
                className="bg-[#8B5CF6] hover:bg-[#9B6FFF] text-white font-semibold px-6 py-3.5 h-auto text-base rounded-[10px]"
              >
                Request a Project Estimate
              </Button>
              <Button
                asChild
                variant="outline"
                className="border border-white/[0.14] hover:bg-[#8B5CF6]/8 hover:border-purple-400/35 text-white px-6 py-3.5 h-auto text-base rounded-[10px]"
              >
                <a href="#portfolio">
                  View Case Studies
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-2 opacity-85"
            >
              <span className="font-mono text-[11px] tracking-wide px-2.5 py-1.5 rounded-full border border-white/[0.08] bg-[#0C0D0D]">
                <span className="text-gray-400">Starting at €45/hour</span>
              </span>
              <span className="font-mono text-[11px] tracking-wide text-gray-400 px-2.5 py-1.5 rounded-full border border-white/[0.08] bg-[#0C0D0D]">
                Based in Linz, Austria
              </span>
            </motion.div>
          </div>

          {/* Right column: Tracked frame + artifacts */}
          <div className="relative flex flex-col items-end gap-6 lg:gap-8">
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

            {/* Artifact tiles (Option C) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-3 gap-3 w-full max-w-[400px]"
            >
              {/* OCR tile */}
              <div className="bg-[#121414] border border-white/[0.08] rounded-xl p-3 hover:border-white/[0.14] transition-colors">
                <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2.5">
                  OCR · invoice
                </div>
                <div className="h-[90px] rounded-lg bg-[#141616] border border-white/[0.08] relative overflow-hidden p-3">
                  <div className="h-1.5 bg-white/[0.06] rounded-sm mb-1.5 w-3/5" />
                  <div className="h-1.5 bg-white/[0.06] rounded-sm mb-2.5 w-2/5" />
                  <div className="h-1.5 bg-white/[0.06] rounded-sm mb-1.5 w-[85%]" />
                  <div className="h-1.5 bg-white/[0.06] rounded-sm mb-3 w-[70%]" />
                  <div className="h-1.5 bg-white/[0.06] rounded-sm w-[30%] ml-auto" />
                  
                  <div className="absolute top-4 left-3 w-[48%] h-4 border-[1.5px] border-purple-400">
                    <span className="absolute -top-3 left-0 text-[8px] font-mono text-purple-200 bg-[#0C0D0D]/85 px-1">
                      vendor 0.98
                    </span>
                  </div>
                  <div className="absolute bottom-7 right-3.5 w-[30%] h-[18px] border-[1.5px] border-purple-400">
                    <span className="absolute -top-3 left-0 text-[8px] font-mono text-purple-200 bg-[#0C0D0D]/85 px-1">
                      total 0.99
                    </span>
                  </div>
                </div>
              </div>

              {/* CV tile */}
              <div className="bg-[#121414] border border-white/[0.08] rounded-xl p-3 hover:border-white/[0.14] transition-colors">
                <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2.5">
                  CV · bbox
                </div>
                <div className="h-[90px] rounded-lg bg-[#141616] border border-white/[0.08] relative overflow-hidden">
                  <div className="absolute bottom-5 left-7 right-7 h-12 bg-white/[0.04] rounded-[4px_4px_2px_2px]" />
                  <div className="absolute top-9 left-[40%] w-9 h-[50px] bg-white/[0.05] rounded-sm border border-purple-400/45">
                    <span className="absolute -top-3 -left-1 text-[8px] font-mono text-purple-300 whitespace-nowrap">
                      box · 0.91
                    </span>
                  </div>
                  <div className="absolute inset-[18px_22px] border-[1.5px] border-purple-400 rounded-sm">
                    <span className="absolute -top-3.5 left-0 text-[8px] font-mono text-purple-200 bg-[#0C0D0D]/85 px-1">
                      pallet · 0.94
                    </span>
                  </div>
                </div>
              </div>

              {/* n8n pipeline tile */}
              <div className="bg-[#121414] border border-white/[0.08] rounded-xl p-3 hover:border-white/[0.14] transition-colors">
                <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2.5">
                  n8n · pipeline
                </div>
                <div className="h-[90px] rounded-lg bg-[#141616] border border-white/[0.08] relative overflow-hidden">
                  <svg viewBox="0 0 100 90" className="w-full h-full">
                    <defs>
                      <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                        <path d="M0,0 L4,2 L0,4 Z" fill="#6B6C69"/>
                      </marker>
                    </defs>
                    <rect x="8" y="32" width="18" height="12" rx="2" fill="#1A1C1C" stroke="rgba(255,255,255,0.12)"/>
                    <text x="17" y="40" textAnchor="middle" fill="#9A9B98" fontFamily="monospace" fontSize="5">OCR</text>
                    
                    <rect x="41" y="32" width="18" height="12" rx="2" fill="#1A1C1C" stroke="rgba(139,92,246,0.55)"/>
                    <text x="50" y="40" textAnchor="middle" fill="#A78BFA" fontFamily="monospace" fontSize="5">Parse</text>
                    
                    <rect x="74" y="20" width="18" height="12" rx="2" fill="#1A1C1C" stroke="rgba(167,139,250,0.45)"/>
                    <text x="83" y="28" textAnchor="middle" fill="#C4B5FD" fontFamily="monospace" fontSize="5">ERP</text>
                    
                    <rect x="74" y="44" width="18" height="12" rx="2" fill="#1A1C1C" stroke="rgba(196,181,253,0.4)"/>
                    <text x="83" y="52" textAnchor="middle" fill="#C4B5FD" fontFamily="monospace" fontSize="5">Slack</text>
                    
                    <line x1="26" y1="38" x2="41" y2="38" stroke="#6B6C69" strokeWidth="0.8" markerEnd="url(#arrow)"/>
                    <path d="M59 36 C66 36, 66 26, 74 26" fill="none" stroke="#6B6C69" strokeWidth="0.8" markerEnd="url(#arrow)"/>
                    <path d="M59 40 C66 40, 66 50, 74 50" fill="none" stroke="#6B6C69" strokeWidth="0.8" markerEnd="url(#arrow)"/>
                  </svg>
                </div>
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
