import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const agentName = "Carlos Mendoza";
const tagline = "Exclusive Caribbean Real Estate for International Investors";
const subtitle = "Cancún • Tulum • Playa del Carmen • Riviera Maya";

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.8 + i * 0.05,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Luxury Image Background */}
      <div className="absolute inset-0 bg-luxury-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80')`,
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/70 via-luxury-black/40 to-luxury-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-luxury-gold text-sm tracking-luxury uppercase mb-8 font-inter"
        >
          {tagline}
        </motion.p>

        {/* Agent Name - Single Line */}
        <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-luxury-white text-center tracking-widest mb-6">
          {agentName}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-luxury-white/70 text-lg md:text-xl tracking-widest font-light font-inter mb-12 text-center"
        >
          {subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 40 }}
          transition={{ duration: 0.8, delay: 1.8, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col md:flex-row gap-6"
        >
          <a
            href="#properties"
            className="btn-luxury btn-luxury-primary text-xs"
          >
            <span>Explore Properties</span>
          </a>
          <a
            href="#contact"
            className="btn-luxury text-luxury-white border-luxury-white/50 hover:border-luxury-white text-xs"
          >
            <span>Private Consultation</span>
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-luxury-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="relative">
          <ChevronDown 
            className="w-5 h-5 text-luxury-gold animate-float" 
          />
          <div className="absolute inset-0 bg-luxury-gold/20 blur-xl animate-pulse-slow" />
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 1.5, delay: 2 }}
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-luxury-cream to-transparent"
      />
    </section>
  );
}
