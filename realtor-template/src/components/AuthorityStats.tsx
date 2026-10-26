import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatProps {
  value: string;
  label: string;
  suffix?: string;
}

function Stat({ value, label, suffix = '' }: StatProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="text-center"
    >
      <div className="relative inline-block">
        <span className="stat-number">
          {hasAnimated ? value : '0'}
          {suffix}
        </span>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-px bg-luxury-gold"
        />
      </div>
      <p className="mt-6 text-luxury-stone text-sm tracking-widest uppercase font-inter">
        {label}
      </p>
    </motion.div>
  );
}

const stats = [
  { value: '750', label: 'Million in Sales', suffix: 'M+' },
  { value: '1', label: 'Top 1% Nationwide', suffix: '%' },
  { value: '250', label: 'Transactions', suffix: '+' },
  { value: '15', label: 'Years Experience', suffix: '+' },
];

export default function AuthorityStats() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={containerRef}
      className="relative py-24 lg:py-32 bg-luxury-black overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(201, 169, 98, 0.5) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-16 lg:mb-20"
      >
        <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
          Track Record
        </p>
        <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-white font-light tracking-wide">
          A Legacy of Excellence
        </h2>
      </motion.div>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.8, 
                delay: 0.2 + index * 0.15,
                ease: [0.4, 0, 0.2, 1] 
              }}
            >
              <Stat {...stat} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative Line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-2xl mx-auto mt-16 lg:mt-20"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent" />
      </motion.div>
    </section>
  );
}
