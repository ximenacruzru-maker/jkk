import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const publications = [
  { name: 'Forbes', text: 'FORBES' },
  { name: 'Wall Street Journal', text: 'WSJ' },
  { name: 'Architectural Digest', text: 'ARCHITECTURAL DIGEST' },
  { name: 'Robb Report', text: 'ROBB REPORT' },
  { name: 'Luxury Magazine', text: 'LUXURY' },
  { name: 'International', text: 'INTERNATIONAL' },
];

function PublicationLogo({ name, text, index }: { name: string; text: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1] 
      }}
      className="flex-shrink-0 w-40 md:w-52 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer group"
    >
      <div className="relative h-16 flex items-center justify-center">
        <span className="font-playfair text-lg md:text-xl tracking-widest text-luxury-white/60 group-hover:text-luxury-gold transition-all duration-500">
          {text}
        </span>
      </div>
    </motion.div>
  );
}

export default function AsSeenIn() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-luxury-black relative overflow-hidden">
      {/* Background Glass Effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-charcoal/50 to-luxury-black" />
        <div className="absolute inset-0 backdrop-blur-3xl opacity-20" />
      </div>

      {/* Section Header */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 text-center mb-12"
      >
        <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
          Recognition
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl text-luxury-white font-light tracking-wide">
          As Seen In
        </h2>
      </motion.div>

      {/* Logo Marquee - First Row */}
      <div className="relative z-10 mb-8">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-luxury-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-luxury-black to-transparent z-10" />
        
        <div className="overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex items-center gap-16 w-[200%]"
          >
            {publications.map((pub, index) => (
              <PublicationLogo key={`first-${index}`} {...pub} index={index} />
            ))}
            {publications.map((pub, index) => (
              <PublicationLogo key={`dup1-${index}`} {...pub} index={index} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Logo Marquee - Second Row (Reverse) */}
      <div className="relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-luxury-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-luxury-black to-transparent z-10" />
        
        <div className="overflow-hidden">
          <motion.div
            initial={{ x: "-50%" }}
            animate={{ x: 0 }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex items-center gap-16 w-[200%]"
          >
            {publications.map((pub, index) => (
              <PublicationLogo key={`dup2-${index}`} {...pub} index={index} />
            ))}
            {publications.map((pub, index) => (
              <PublicationLogo key={`second-${index}`} {...pub} index={index} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile: Horizontal Scroll Carousel */}
      <div className="lg:hidden relative z-10 px-6 mt-8">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
          {publications.map((pub, index) => (
            <div 
              key={`mobile-${index}`}
              className="flex-shrink-0 w-40 snap-center"
            >
              <div className="h-16 flex items-center justify-center">
                <span className="font-playfair text-lg tracking-widest text-luxury-white/60">
                  {pub.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider Lines */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/20 to-transparent pointer-events-none" />
    </section>
  );
}
