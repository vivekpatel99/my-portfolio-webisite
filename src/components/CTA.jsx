import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedCtaBackground from '@/components/AnimatedCtaBackground';
import { useNavigate } from 'react-router-dom';
const CTA = () => {
  const navigate = useNavigate();
  const handleCTAClick = () => {
    navigate('/contact');
  };
  return (
    <section id="cta" className="relative py-32 overflow-hidden">
      <AnimatedCtaBackground />
      <div className="absolute inset-0 bg-black/40"></div> {/* Adjusted overlay opacity */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight uppercase break-words">
            Ready to Start Your <span className="text-accent-purple">Project</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Let&apos;s build your next AI solution together. You&apos;ll get production-ready code,
            clear communication at every milestone, and 30 days of support after delivery—so your
            team never feels stuck.
          </p>
          <div>
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="bg-accent-purple hover:bg-accent-purple/90 text-white font-bold px-10 py-7 text-xl rounded-full group"
            >
              Get a Free Quote
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
export default CTA;
