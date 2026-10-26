import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavProps {
  isScrolled: boolean;
}

const navLinks = [
  { name: 'Properties', href: '#properties' },
  { name: 'Buyers', href: '#buyers' },
  { name: 'Sellers', href: '#sellers' },
  { name: 'Lifestyle', href: '#lifestyle' },
  { name: 'Blog', href: '#blog' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '#contact' },
];

export default function Navigation({ isScrolled }: NavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-lg py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="#"
            className={`font-playfair text-2xl font-light tracking-widest transition-colors duration-300 ${
              isScrolled ? 'text-luxury-black' : 'text-luxury-white'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            CARLOS
            <span className="text-luxury-gold ml-1">MENDOZA</span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-12">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.3 + index * 0.1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className={`text-sm tracking-widest uppercase transition-all duration-300 relative group ${
                  isScrolled 
                    ? 'text-luxury-dark hover:text-luxury-gold' 
                    : 'text-luxury-white/80 hover:text-luxury-white'
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-luxury-gold transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="hidden lg:block"
          >
            <a
              href="#contact"
              className={`btn-luxury btn-luxury-primary text-xs ${
                isScrolled ? '' : 'border-luxury-white/50 text-luxury-white'
              }`}
            >
              <span>Private Consultation</span>
            </a>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-1.5"
          >
            <motion.span
              animate={{
                rotate: isMobileMenuOpen ? 45 : 0,
                y: isMobileMenuOpen ? 6 : 0,
              }}
              className={`w-6 h-px transition-colors duration-300 ${
                isScrolled ? 'bg-luxury-black' : 'bg-luxury-white'
              }`}
            />
            <motion.span
              animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
              className={`w-6 h-px transition-colors duration-300 ${
                isScrolled ? 'bg-luxury-black' : 'bg-luxury-white'
              }`}
            />
            <motion.span
              animate={{
                rotate: isMobileMenuOpen ? -45 : 0,
                y: isMobileMenuOpen ? -6 : 0,
              }}
              className={`w-6 h-px transition-colors duration-300 ${
                isScrolled ? 'bg-luxury-black' : 'bg-luxury-white'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden bg-white shadow-2xl"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-light tracking-widest text-luxury-dark hover:text-luxury-gold transition-colors duration-300"
                >
                  {link.name}
                </motion.a>
              ))}
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-luxury btn-luxury-primary text-xs mt-4"
              >
                <span>Private Consultation</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
