import { backgrounds } from '@/config/links';

const imageUrl = backgrounds.hero;

const AnimatedHeroBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" data-testid="hero-background">
      <div
        className="absolute inset-0 w-full h-full"
        data-testid="hero-background-layer"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.9,
        }}
      />
    </div>
  );
};

export default AnimatedHeroBackground;
