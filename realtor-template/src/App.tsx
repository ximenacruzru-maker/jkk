import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import AuthorityStats from './components/AuthorityStats';
import FeaturedListings, { Property } from './components/FeaturedListings';
import PropertyDetail from './components/PropertyDetail';
import BuyersGuide from './components/BuyersGuide';
import SellersGuide from './components/SellersGuide';
import Lifestyle from './components/Lifestyle';
import AsSeenIn from './components/AsSeenIn';
import Blog from './components/Blog';
import Testimonials from './components/Testimonials';
import ContactForm from './components/ContactForm';

function Footer() {
  return (
    <footer className="bg-luxury-black py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <a href="#" className="font-playfair text-2xl font-light tracking-widest text-luxury-white">
              CARLOS<span className="text-luxury-gold ml-1">MENDOZA</span>
            </a>
            <p className="text-luxury-white/50 mt-4 font-light max-w-sm">
              Helping American investors discover exceptional properties in Mexico's Riviera Maya.
            </p>
          </div>
          
          <div>
            <h4 className="text-luxury-white text-sm tracking-widest uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Properties', 'About', 'Blog', 'Contact'].map((link) => (
                <li key={link}>
                  <a 
                    href={`#${link.toLowerCase()}`}
                    className="text-luxury-white/50 hover:text-luxury-gold transition-colors duration-300 text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-luxury-white text-sm tracking-widest uppercase mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-luxury-white/50">
              <li>+1 (954) 555-0100</li>
              <li>carlos@cancunluxury.properties</li>
              <li>Cancún, México</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-luxury-white/30 text-sm">
            © 2024 Carlos Mendoza Luxury Properties. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-luxury-white/30 hover:text-luxury-gold transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-luxury-white/30 hover:text-luxury-gold transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { scrollY } = useScroll();
  
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-luxury-cream">
      <Navigation isScrolled={isScrolled} />
      
      <main>
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
          <Hero />
        </motion.div>
        
        <AuthorityStats />
        
        <FeaturedListings onPropertyClick={setSelectedProperty} />
        
        <BuyersGuide />
        
        <SellersGuide />
        
        <Lifestyle />
        
        <AsSeenIn />
        
        <Blog />
        
        <Testimonials />
        
        <ContactForm />
      </main>
      
      <Footer />

      {/* Property Detail Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetail 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
