import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Bed, Bath, Square, ChevronRight, ArrowRight } from 'lucide-react';

export interface Property {
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
  description?: string;
  features?: string[];
  gallery?: string[];
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
    description: "Experience unparalleled luxury in this stunning oceanfront penthouse in the heart of Cancún's Hotel Zone. Floor-to-ceiling windows offer breathtaking views of the Caribbean Sea.",
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
    description: "Nestled within the lush Mayan jungle, this extraordinary villa offers a unique blend of modern luxury and natural beauty.",
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
    description: "This magnificent beachfront villa represents the pinnacle of Caribbean luxury living with over 150 feet of pristine beach frontage.",
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
    description: "Embrace sustainable luxury in this beautifully designed eco-chic home in the heart of Tulum.",
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
    description: "Wake up to stunning sunrises over the marina in this contemporary penthouse in Puerto Morelos.",
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
    description: "This luxury condo in an exclusive resort community offers the perfect introduction to Caribbean living.",
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

function PropertyCard({ property, index, onClick }: { property: Property; index: number; onClick: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1] 
      }}
      className="property-card group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] overflow-hidden mb-6">
        <motion.img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover img-zoom"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        />
        <div className="property-overlay" />
        
        {property.featured && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-4 left-4 bg-luxury-gold px-4 py-2"
          >
            <span className="text-xs tracking-widest uppercase text-luxury-white">
              Featured
            </span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <span className="font-playfair text-2xl text-luxury-white">
            {property.price}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="btn-luxury bg-luxury-white text-luxury-black border-transparent text-xs">
            <span>View Details</span>
          </span>
        </motion.div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-playfair text-xl lg:text-2xl text-luxury-black font-light leading-tight group-hover:text-luxury-gold transition-colors duration-300">
            {property.title}
          </h3>
          <motion.span animate={{ x: isHovered ? 5 : 0 }} transition={{ duration: 0.3 }}>
            <ArrowRight className="w-5 h-5 text-luxury-gold" />
          </motion.span>
        </div>
        
        <div className="flex items-center gap-2 text-luxury-taupe">
          <MapPin className="w-4 h-4" />
          <span className="text-sm tracking-wide">{property.location}</span>
        </div>

        <div className="flex items-center gap-6 pt-2 text-luxury-stone">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4" />
            <span className="text-sm">{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-4 h-4" />
            <span className="text-sm">{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-2">
            <Square className="w-4 h-4" />
            <span className="text-sm">{property.sqft.toLocaleString()} SF</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function FeaturedListings({ onPropertyClick }: { onPropertyClick: (property: Property) => void }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section 
      id="properties"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-cream"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-7xl mx-auto px-6 mb-16 lg:mb-20"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
              Exclusive Portfolio
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-black font-light tracking-wide">
              Featured Properties
            </h2>
          </div>
          <a
            href="#contact"
            className="group flex items-center gap-3 text-luxury-stone hover:text-luxury-gold transition-colors duration-300"
          >
            <span className="text-sm tracking-widest uppercase">View All</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {properties.map((property, index) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              index={index} 
              onClick={() => onPropertyClick(property)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
