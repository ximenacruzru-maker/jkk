import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Users, Camera, DollarSign, Key, Handshake, ArrowRight } from 'lucide-react';

const benefits = [
  {
    icon: TrendingUp,
    title: "Maximum Value",
    description: "Our marketing expertise and international network consistently achieve 10-15% above market values."
  },
  {
    icon: Users,
    title: "Global Reach",
    description: "Access to qualified international buyers through our partnerships with major US brokerages."
  },
  {
    icon: Camera,
    title: "Cinematic Marketing",
    description: "Professional photography, video tours, and virtual staging that showcases your property's full potential."
  },
  {
    icon: DollarSign,
    title: "Competitive Terms",
    description: "Flexible commission structures and transparent pricing with no hidden fees."
  },
  {
    icon: Key,
    title: "Smooth Process",
    description: "We handle all paperwork, negotiations, and coordinate with Mexican attorneys for a hassle-free sale."
  },
  {
    icon: Handshake,
    title: "Trusted Guidance",
    description: "Over $500M in transactions. Verified track record with satisfied sellers across the Riviera Maya."
  },
];

export default function SellersGuide() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section 
      id="sellers"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-cream"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
            Partner With Us
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-black font-light tracking-wide mb-6">
            Sell With Confidence
          </h2>
          <p className="text-luxury-stone font-light leading-relaxed max-w-2xl mx-auto">
            When you list with Carlos Mendoza Luxury Properties, you gain a dedicated team 
            committed to achieving top dollar for your Caribbean property.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: 0.2 + index * 0.1,
                ease: [0.4, 0, 0.2, 1] 
              }}
              className="group bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-luxury-gold/10 mb-6 group-hover:bg-luxury-gold group-hover:text-luxury-white transition-all duration-500">
                <benefit.icon className="w-7 h-7 text-luxury-gold group-hover:text-luxury-white transition-colors duration-500" />
              </div>
              <h3 className="font-playfair text-xl text-luxury-black mb-3 group-hover:text-luxury-gold transition-colors duration-300">
                {benefit.title}
              </h3>
              <p className="text-luxury-taupe font-light leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-luxury-black py-12 px-8 lg:px-16"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-playfair text-4xl lg:text-5xl text-luxury-gold mb-2">$500M+</p>
              <p className="text-luxury-white/60 text-sm tracking-widest uppercase">Total Sales Volume</p>
            </div>
            <div>
              <p className="font-playfair text-4xl lg:text-5xl text-luxury-gold mb-2">15%</p>
              <p className="text-luxury-white/60 text-sm tracking-widest uppercase">Above Market Average</p>
            </div>
            <div>
              <p className="font-playfair text-4xl lg:text-5xl text-luxury-gold mb-2">98%</p>
              <p className="text-luxury-white/60 text-sm tracking-widest uppercase">Client Satisfaction</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <a href="#contact" className="btn-luxury btn-luxury-primary text-xs inline-flex items-center gap-3">
            <span>Get Your Property Valuation</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
