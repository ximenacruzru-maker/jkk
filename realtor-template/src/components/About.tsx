import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const advantages = [
  {
    title: "U.S. Investment Expertise",
    description: "Deep understanding of U.S. tax laws, FIRPTA regulations, and international investment vehicles for seamless transactions.",
  },
  {
    title: "Mexican Market Mastery",
    description: "Comprehensive knowledge of Riviera Maya developments, Fideicomiso structures, and Mexican real estate law.",
  },
  {
    title: "Banking & Currency",
    description: "Strategic partnerships with international banks facilitating USD transactions and favorable exchange rates.",
  },
  {
    title: "End-to-End Concierge",
    description: "Full-service support from property selection through closing, including property management and rental programs.",
  },
];

export default function About() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section 
      id="about"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                alt="Carlos Mendoza"
                className="w-full h-full object-cover"
              />
              {/* Decorative Frame */}
              <div className="absolute -bottom-6 -right-6 w-full h-full border border-luxury-gold/30 -z-10" />
            </div>
            
            {/* Experience Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-luxury-black p-6 lg:p-8"
            >
              <p className="font-playfair text-4xl lg:text-5xl text-luxury-gold">15+</p>
              <p className="text-luxury-white/60 text-sm tracking-widest uppercase mt-1">
                Years Experience
              </p>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
              About
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-black font-light tracking-wide mb-6">
              Your Gateway to Caribbean Luxury
            </h2>
            
            <div className="space-y-6 text-luxury-stone font-light leading-relaxed mb-12">
              <p>
                For over 15 years, I've helped American investors discover the extraordinary opportunities in Mexico's Riviera Maya. From oceanfront penthouses in Cancún to eco-chic villas in Tulum, I curate exceptional properties that combine tropical paradise with exceptional ROI.
              </p>
              <p>
                Whether you're seeking a vacation home, retirement retreat, or income-generating investment, I provide end-to-end guidance through Mexico's real estate process—making international ownership simple, secure, and profitable.
              </p>
            </div>

            {/* Advantages Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {advantages.map((advantage, index) => (
                <motion.div
                  key={advantage.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.4 + index * 0.1,
                    ease: [0.4, 0, 0.2, 1] 
                  }}
                  className="group"
                >
                  <div className="border-t border-luxury-taupe/20 pt-4">
                    <h3 className="font-playfair text-lg text-luxury-black mb-2 group-hover:text-luxury-gold transition-colors duration-300">
                      {advantage.title}
                    </h3>
                    <p className="text-luxury-taupe text-sm font-light leading-relaxed">
                      {advantage.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
