import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Globe, FileText, DollarSign, Home, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Shield,
    title: "Secure Your Investment",
    description: "We guide you through Mexico's Fideicomiso (trust) structure, ensuring your property rights are fully protected under Mexican law."
  },
  {
    icon: Globe,
    title: "Navigate Regulations",
    description: "Our team handles FIRPTA compliance, tax implications, and banking requirements for seamless international transactions."
  },
  {
    icon: FileText,
    title: "Due Diligence",
    description: "Comprehensive title searches, zoning verification, and developer background checks on every property."
  },
  {
    icon: DollarSign,
    title: "Financial Solutions",
    description: "Access competitive USD financing options and favorable exchange rates through our banking partners."
  },
  {
    icon: Home,
    title: "Property Selection",
    description: "Curated portfolio of pre-screened properties matching your investment criteria and lifestyle preferences."
  },
  {
    icon: CheckCircle,
    title: "Close with Confidence",
    description: "Full-service support through closing, including property management and rental program setup."
  },
];

export default function BuyersGuide() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section 
      id="buyers"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-white"
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
            Your Guide
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-black font-light tracking-wide mb-6">
            Buyer's Roadmap
          </h2>
          <p className="text-luxury-stone font-light leading-relaxed max-w-2xl mx-auto">
            Investing in Mexican real estate as a foreigner is straightforward with the right guidance. 
            Our proven 6-step process ensures a secure, profitable investment.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: 0.2 + index * 0.1,
                ease: [0.4, 0, 0.2, 1] 
              }}
              className="group p-8 border border-luxury-taupe/20 hover:border-luxury-gold/50 transition-all duration-500"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-luxury-gold/10 mb-6 group-hover:bg-luxury-gold group-hover:text-luxury-white transition-all duration-500">
                <step.icon className="w-7 h-7 text-luxury-gold group-hover:text-luxury-white transition-colors duration-500" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-luxury-gold text-sm font-medium">0{index + 1}</span>
                <h3 className="font-playfair text-xl text-luxury-black">
                  {step.title}
                </h3>
              </div>
              <p className="text-luxury-taupe font-light leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <a href="#contact" className="btn-luxury btn-luxury-primary text-xs inline-flex items-center gap-3">
            <span>Start Your Journey</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
