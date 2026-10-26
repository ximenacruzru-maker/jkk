import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Bed, Bath, Square, ChevronLeft, Check, X, Phone, Mail, Calendar } from 'lucide-react';

interface Property {
  id: number;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  featured?: boolean;
  slug: string;
  description: string;
  features: string[];
  gallery: string[];
}

const properties: Property[] = [
  {
    id: 1,
    title: "Oceanfront Penthouse",
    location: "Cancún Hotel Zone",
    price: "$4,500,000",
    beds: 4,
    baths: 4,
    sqft: 4200,
    image: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&q=80",
    featured: true,
    slug: "oceanfront-penthouse-cancun",
    description: "Experience unparalleled luxury in this stunning oceanfront penthouse in the heart of Cancún's Hotel Zone. Floor-to-ceiling windows offer breathtaking views of the Caribbean Sea, while the open-concept living space creates an atmosphere of sophistication and comfort. This residence features a gourmet kitchen with top-of-the-line appliances, a private terrace with infinity pool, and smart home technology throughout.",
    features: ["Ocean View", "Private Pool", "Smart Home", "Concierge Service", "Private Beach Access", "Wine Cellar", "Home Theater", "24/7 Security"],
    gallery: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
    ]
  },
  {
    id: 2,
    title: "Jungle Villa Estate",
    location: "Tulum, Riviera Maya",
    price: "$3,900,000",
    beds: 5,
    baths: 5,
    sqft: 5800,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    slug: "jungle-villa-tulum",
    description: "Nestled within the lush Mayan jungle, this extraordinary villa offers a unique blend of modern luxury and natural beauty. The property features traditional Mayan architecture with contemporary finishes, creating an atmosphere of rustic elegance. Surrounded by tropical gardens and cenotes, this estate provides the ultimate private retreat for those seeking an authentic Caribbean lifestyle.",
    features: ["Jungle View", "Cenote Access", "Outdoor Kitchen", "Yoga Deck", "Staff Quarters", "Eco-Friendly", "Solar Panels", "Rainwater Collection"],
    gallery: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
    ]
  },
  {
    id: 3,
    title: "Beachfront Villa",
    location: "Playa del Carmen",
    price: "$5,750,000",
    beds: 6,
    baths: 6,
    sqft: 6500,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    slug: "beachfront-villa-playa-del-carmen",
    description: "This magnificent beachfront villa represents the pinnacle of Caribbean luxury living. With over 150 feet of pristine beach frontage, the property offers unobstructed views of the turquoise Caribbean waters. The expansive outdoor living areas include multiple terraces, a zero-edge pool, and direct beach access. Inside, the residence features handcrafted furnishings, marble floors, and designer finishes throughout.",
    features: ["150ft Beach Frontage", "Zero-Edge Pool", "Rooftop Terrace", "Elevator", "Chef's Kitchen", "Spa Bathroom", "Media Room", "Guest House"],
    gallery: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80"
    ]
  },
  {
    id: 4,
    title: "Eco-Chic Retreat",
    location: "Tulum Centro",
    price: "$2,900,000",
    beds: 4,
    baths: 4,
    sqft: 3200,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    slug: "eco-chic-retreat-tulum",
    description: "Embrace sustainable luxury in this beautifully designed eco-chic home in the heart of Tulum. Built with locally sourced materials and designed to minimize environmental impact, this property showcases how luxury and sustainability can coexist harmoniously. The open-air living spaces blend seamlessly with the tropical surroundings, while the rooftop garden provides stunning views of the town.",
    features: ["Sustainable Design", "Rooftop Garden", "Organic Pool", "Solar Energy", "Local Materials", "Open-Air Living", "Bicycle Rentals", "Beach Club Access"],
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
    ]
  },
  {
    id: 5,
    title: "Marina Penthouse",
    location: "Puerto Morelos",
    price: "$3,200,000",
    beds: 3,
    baths: 3,
    sqft: 2800,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    featured: true,
    slug: "marina-penthouse-puerto-morelos",
    description: "Wake up to stunning sunrises over the marina in this contemporary penthouse in Puerto Morelos. This modern residence offers the perfect blend of indoor and outdoor living, with a spacious terrace overlooking the docks. The property is ideally located near the reef, making it perfect for diving enthusiasts. Enjoy world-class dining and shopping just minutes away.",
    features: ["Marina View", "Dock Access", "Diving Gear Storage", "Sunrise Views", "Modern Design", "Gourmet Kitchen", "Private Terrace", "Secure Parking"],
    gallery: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
    ]
  },
  {
    id: 6,
    title: "Luxury Condo Resort",
    location: "Cancún Pueblo",
    price: "$1,850,000",
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    slug: "luxury-condo-resort-cancun",
    description: "This luxury condo in an exclusive resort community offers the perfect introduction to Caribbean living. The residence features an open floor plan with high ceilings and premium finishes. Residents enjoy access to world-class amenities including multiple pools, a spa, fitness center, and private beach. The property is perfect as a vacation home or investment property with excellent rental potential.",
    features: ["Resort Amenities", "Private Beach", "Multiple Pools", "Spa", "Fitness Center", "Restaurant", "Kids Club", "Property Management"],
    gallery: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
    ]
  },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find(p => p.slug === slug);
}

export function getAllProperties(): Property[] {
  return properties;
}

export default function PropertyDetail({ property, onClose }: { property: Property; onClose: () => void }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-luxury-black overflow-y-auto"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-50 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-luxury-white" />
      </button>

      {/* Hero Image */}
      <div className="relative h-[50vh] lg:h-[60vh]">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/30 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-luxury-white" />
          <span className="text-luxury-white text-sm">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="relative -mt-32 pb-24" ref={containerRef}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="bg-luxury-charcoal/90 backdrop-blur-xl p-8 lg:p-12 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-luxury-gold mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm tracking-wide">{property.location}</span>
                </div>
                <h1 className="font-playfair text-3xl lg:text-5xl text-luxury-white mb-4">
                  {property.title}
                </h1>
                <p className="text-luxury-white/60 font-light leading-relaxed max-w-2xl">
                  {property.description}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="font-playfair text-4xl lg:text-5xl text-luxury-gold mb-2">
                  {property.price}
                </p>
                <p className="text-luxury-white/40 text-sm">Est. Monthly: $18,500</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-luxury-gold" />
                <div>
                  <p className="text-luxury-white font-light">{property.beds}</p>
                  <p className="text-luxury-white/40 text-sm">Bedrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath className="w-5 h-5 text-luxury-gold" />
                <div>
                  <p className="text-luxury-white font-light">{property.baths}</p>
                  <p className="text-luxury-white/40 text-sm">Bathrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Square className="w-5 h-5 text-luxury-gold" />
                <div>
                  <p className="text-luxury-white font-light">{property.sqft.toLocaleString()}</p>
                  <p className="text-luxury-white/40 text-sm">Square Feet</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="font-playfair text-2xl text-luxury-white mb-6">Gallery</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {property.gallery.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-video overflow-hidden transition-all duration-300 ${
                    selectedImage === index ? 'ring-2 ring-luxury-gold' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="font-playfair text-2xl text-luxury-white mb-6">Features & Amenities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-luxury-charcoal/50">
                  <Check className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                  <span className="text-luxury-white/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid lg:grid-cols-2 gap-8"
          >
            <div className="bg-luxury-gold/10 p-8 border border-luxury-gold/30">
              <h3 className="font-playfair text-2xl text-luxury-white mb-4">Schedule a Viewing</h3>
              <p className="text-luxury-white/60 mb-6">Experience this property in person with a private showing.</p>
              <div className="flex flex-col gap-3">
                <button className="btn-luxury btn-luxury-primary text-xs">
                  <span>Request Showing</span>
                </button>
              </div>
            </div>
            <div className="bg-luxury-charcoal/50 p-8 border border-white/10">
              <h3 className="font-playfair text-2xl text-luxury-white mb-4">Contact Carlos Mendoza</h3>
              <div className="space-y-3 text-luxury-white/60">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-luxury-gold" />
                  <span>+1 (954) 555-0100</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-luxury-gold" />
                  <span>carlos@cancunluxury.properties</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
