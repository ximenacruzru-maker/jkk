import { useState } from 'react';
import { useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Waves, Utensils, Palmtree, Flower2, Plane, ShoppingBag, MapPin, Compass, Camera, X, ExternalLink, Calendar } from 'lucide-react';

const lifestyles = [
  {
    id: 'beach',
    icon: Waves,
    title: "Beach Living",
    description: "Wake up to turquoise waters and pristine white sand beaches. Snorkeling, diving, and water sports at your doorstep.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    details: "The Mexican Caribbean boasts over 150 miles of pristine coastline with crystal-clear waters. Property owners enjoy private beach access, world-class snorkeling at the second-largest barrier reef, and year-round swimming in warm waters averaging 80°F.",
    mapUrl: "https://www.google.com/maps/search/cancun+beaches"
  },
  {
    id: 'dining',
    icon: Utensils,
    title: "World-Class Dining",
    description: "From street tacos to Michelin-starred restaurants, Cancun and Tulum offer unparalleled culinary experiences.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    details: "The region features over 500 restaurants ranging from authentic street food to internationally acclaimed fine dining. Highlights include Contramar, Lafitela, and the famous Harry's Steakhouse. Many properties come with private chef options.",
    mapUrl: "https://www.google.com/maps/search/restaurants+cancun"
  },
  {
    id: 'golf',
    icon: Palmtree,
    title: "Premium Golf",
    description: "Play on world-renowned courses designed by legends like Jack Nicklaus and Greg Norman.",
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80",
    details: "The Riviera Maya is home to over 20 championship golf courses. Notable courses include Jack Nicklaus's Riviera Maya Golf Club, Greg Norman's Iberostar Golf Course, and the exclusive Club de Golf Kanai.",
    mapUrl: "https://www.google.com/maps/search/golf+courses+riviera+maya"
  },
  {
    id: 'wellness',
    icon: Flower2,
    title: "Wellness & Spa",
    description: "Luxury spas, cenote swims, and yoga retreats in the heart of the Mayan jungle.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    details: "Experience world-class wellness at destinations like Four Seasons Spa, Zen Spa at Hotel Esencia, and Yaan Wellness Spa. The region offers over 50 cenotes for swimming and meditation, plus daily yoga classes at beachfront studios.",
    mapUrl: "https://www.google.com/maps/search/spa+tulum"
  },
  {
    id: 'access',
    icon: Plane,
    title: "Easy Access",
    description: "Direct flights from most US cities. Cancun International Airport is just 20 minutes from the Hotel Zone.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    details: "Cancun International Airport (CUN) handles over 25 million passengers annually with direct flights from 30+ US cities including New York, Los Angeles, Chicago, Miami, and Dallas. US citizens need only a valid passport - no visa required for stays up to 180 days.",
    mapUrl: "https://www.google.com/maps/search/cancun+airport"
  },
  {
    id: 'shopping',
    icon: ShoppingBag,
    title: "Shopping & Culture",
    description: "Luxury malls, artisan markets, and ancient Mayan ruins to explore.",
    image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80",
    details: "From luxury shopping at La Isla Shopping Village and Puerto Cancun to authentic artisan markets in Tulum Centro. Cultural attractions include the ruins of Tulum, Coba, and Chichen Itza - all within driving distance.",
    mapUrl: "https://www.google.com/maps/search/shopping+cancun"
  },
];

const restaurants = [
  { name: "Contramar", cuisine: "Seafood", location: "Playa del Carmen", specialty: "Fresh catch daily", mapUrl: "https://www.google.com/maps/search/Contramar+Playa+del+Carmen", bookingUrl: "https://www.tripadvisor.com/Restaurant_Review-g150812-d803335-Reviews-Contramar-Playa_del_Carmen_Yucatan_Peninsula.html" },
  { name: "Casa Carolina", cuisine: "International", location: "Tulum", specialty: "Farm-to-table", mapUrl: "https://www.google.com/maps/search/Casa+Carolina+Tulum", bookingUrl: "https://www.tripadvisor.com/Restaurant_Review-g150813-d14102229-Reviews-Casa_Carolina-Tulum_Yucatan_Peninsula.html" },
  { name: "Lafitela", cuisine: "Italian", location: "Tulum", specialty: "Authentic pasta", mapUrl: "https://www.google.com/maps/search/Lafitela+Tulum", bookingUrl: "https://www.tripadvisor.com/Restaurant_Review-g150813-d13358089-Reviews-Lafitela-Tulum_Yucatan_Peninsula.html" },
  { name: "Pez Vela", cuisine: "Mexican", location: "Cancun", specialty: "Ocean views", mapUrl: "https://www.google.com/maps/search/Pez+Vela+Cancun", bookingUrl: "https://www.tripadvisor.com/Restaurant_Review-g150809-d4700519-Reviews-Pez_Vela-Cancun_Yucatan_Peninsula.html" },
  { name: "Mamey", cuisine: "Fusion", location: "Playa del Carmen", specialty: "Modern Mexican", mapUrl: "https://www.google.com/maps/search/Mamey+Playa+del+Carmen", bookingUrl: "https://www.tripadvisor.com/Restaurant_Review-g150812-d12946200-Reviews-Mamey-Playa_del_Carmen_Yucatan_Peninsula.html" },
  { name: "Kin Toh", cuisine: "Mexican", location: "Tulum", specialty: "Treehouse dining", mapUrl: "https://www.google.com/maps/search/Kin+Toh+Tulum", bookingUrl: "https://www.tripadvisor.com/Restaurant_Review-g150813-d12456520-Reviews-Kin_Toh-Tulum_Yucatan_Peninsula.html" },
];

const activities = [
  { name: "Snorkeling at Reefs", type: "Water", description: "Explore the world's second largest barrier reef", mapUrl: "https://www.google.com/maps/search/snorkeling+cancun", bookingUrl: "https://www.viator.com/tours/Cancun/Snorkeling-in-Cancun/d630-2589SNORKEL" },
  { name: "Cenote Diving", type: "Adventure", description: "Swim in ancient underground rivers", mapUrl: "https://www.google.com/maps/search/cenotes+tulum", bookingUrl: "https://www.viator.com/tours/Tulum/Cenote-Diving-Tour/d903-25985CENOTE" },
  { name: "Deep Sea Fishing", type: "Water", description: "World-class marlin and sailfish", mapUrl: "https://www.google.com/maps/search/deep+sea+fishing+cancun", bookingUrl: "https://www.viator.com/tours/Cancun/Deep-Sea-Fishing-Charter/d631-17925FISH" },
  { name: "Mayan Ruins Tour", type: "Culture", description: "Visit Tulum, Chichen Itza, and Coba", mapUrl: "https://www.google.com/maps/search/mayan+ruins+tulum", bookingUrl: "https://www.viator.com/tours/Riviera-Maya/Chichen-Itza-Tour-from-Tulum/d664-25886P20" },
  { name: "Sunset Yacht Cruise", type: "Luxury", description: "Private charters along the coast", mapUrl: "https://www.google.com/maps/search/yacht+charters+cancun", bookingUrl: "https://www.viator.com/tours/Cancun/Luxury-Sunset-Cruise/d631-11687SUNSET" },
  { name: "Jungle ATV Tours", type: "Adventure", description: "Explore the Mayan jungle", mapUrl: "https://www.google.com/maps/search/atv+tours+riviera+maya", bookingUrl: "https://www.viator.com/tours/Riviera-Maya/ATV-Adventure-Tour/d664-5822ATV" },
];

const tours = [
  { name: "Sian Ka'an Biosphere", description: "UNESCO protected nature reserve with wildlife", duration: "Full Day", mapUrl: "https://www.google.com/maps/search/sian+kaan+biosphere", bookingUrl: "https://www.siankaan.org" },
  { name: "Coba Ruins & Cenotes", description: "Pyramid climb and swimming", duration: "8 Hours", mapUrl: "https://www.google.com/maps/search/coba+ruins", bookingUrl: "https://www.viator.com/tours/Riviera-Maya/Coba-and-Cenote-Day-Trip-from-Tulum/d664-39722P6" },
  { name: "Isla Mujeres Catamaran", description: "Snorkeling, beach club, and lunch", duration: "6 Hours", mapUrl: "https://www.google.com/maps/search/isla+mujeres+catamaran", bookingUrl: "https://www.cancun.com/catamaran-tour" },
  { name: "Xcaret Park", description: "Cultural show and adventure activities", duration: "Full Day", mapUrl: "https://www.google.com/maps/search/xcaret+park", bookingUrl: "https://www.xcaret.com" },
  { name: "Private Chef Experience", description: "In-villa gourmet dining", duration: "Evening", mapUrl: "https://www.google.com/maps/search/private+chef+cancun", bookingUrl: "#contact" },
  { name: "Helicopter Tour", description: "Aerial views of the coast", duration: "45 Minutes", mapUrl: "https://www.google.com/maps/search/helicopter+tour+cancun", bookingUrl: "https://www.cancunhelicopters.com" },
];

interface DetailModalProps {
  item: any;
  type: string;
  onClose: () => void;
}

function DetailModal({ item, type, onClose }: DetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-luxury-black/95 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-luxury-charcoal max-w-2xl w-full p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border border-white/20 hover:border-luxury-gold transition-colors"
        >
          <X className="w-5 h-5 text-luxury-white" />
        </button>
        
        <h3 className="font-playfair text-2xl text-luxury-white mb-4">{item.title || item.name}</h3>
        
        {'description' in item && (
          <p className="text-luxury-white/70 font-light mb-6">{item.description}</p>
        )}
        
        {'details' in item && (
          <p className="text-luxury-white/70 font-light mb-6">{item.details}</p>
        )}
        
        {'location' in item && (
          <p className="text-luxury-white/50 mb-2">{item.location}</p>
        )}
        
        {'cuisine' in item && (
          <p className="text-luxury-gold mb-4">{item.cuisine} • {item.specialty}</p>
        )}
        
        {'duration' in item && (
          <p className="text-luxury-gold mb-4">{item.duration}</p>
        )}
        
        <div className="flex flex-wrap gap-3 mt-6">
          {item.mapUrl && (
            <a
              href={item.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors text-luxury-white text-sm"
            >
              <MapPin className="w-4 h-4" />
              View on Maps
            </a>
          )}
          {item.bookingUrl && (
            <a
              href={item.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-luxury-gold hover:bg-luxury-gold/80 transition-colors text-luxury-black text-sm"
            >
              <Calendar className="w-4 h-4" />
              Book Now
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Lifestyle() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedItem, setSelectedItem] = useState<{item: any; type: string} | null>(null);

  return (
    <section 
      id="lifestyle"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-black relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(201, 169, 98, 0.5) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
            Discover
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-white font-light tracking-wide mb-6">
            The Caribbean Lifestyle
          </h2>
          <p className="text-luxury-white/60 font-light leading-relaxed max-w-2xl mx-auto">
            More than a home — it's a lifestyle. Discover why the Mexican Caribbean 
            is the #1 destination for American investors seeking paradise.
          </p>
        </motion.div>

        {/* Lifestyle Grid with Clickable Items */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {lifestyles.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="group relative overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <motion.img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="w-12 h-12 flex items-center justify-center bg-luxury-gold/20 mb-4 backdrop-blur-sm">
                  <item.icon className="w-6 h-6 text-luxury-gold" />
                </div>
                <h3 className="font-playfair text-xl text-luxury-white mb-2">{item.title}</h3>
                <p className="text-luxury-white/60 text-sm font-light leading-relaxed mb-4">{item.description}</p>
                
                <button
                  onClick={() => setSelectedItem({item, type: 'lifestyle'})}
                  className="inline-flex items-center gap-2 text-luxury-gold text-sm hover:text-luxury-white transition-colors"
                >
                  <span>Learn More</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Restaurants Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-8">
            <Utensils className="w-6 h-6 text-luxury-gold" />
            <h3 className="font-playfair text-3xl text-luxury-white">Top Restaurants</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="bg-luxury-charcoal/50 p-6 border border-white/5 hover:border-luxury-gold/30 transition-colors"
              >
                <h4 className="font-playfair text-lg text-luxury-white mb-1">{restaurant.name}</h4>
                <p className="text-luxury-gold text-sm">{restaurant.cuisine}</p>
                <div className="flex items-center gap-2 mt-2 text-luxury-white/40 text-sm mb-4">
                  <MapPin className="w-3 h-3" />
                  <span>{restaurant.location}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem({item: restaurant, type: 'restaurant'})}
                    className="flex-1 py-2 text-xs border border-white/20 hover:border-luxury-gold text-luxury-white/60 hover:text-luxury-gold transition-colors"
                  >
                    Details
                  </button>
                  <a
                    href={restaurant.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-white/10 hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                  </a>
                  <a
                    href={restaurant.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black transition-colors"
                  >
                    Book
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activities Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-8">
            <Compass className="w-6 h-6 text-luxury-gold" />
            <h3 className="font-playfair text-3xl text-luxury-white">Things To Do</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.9 + index * 0.05 }}
                className="bg-luxury-charcoal/50 p-6 border border-white/5 hover:border-luxury-gold/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wider text-luxury-gold">{activity.type}</span>
                </div>
                <h4 className="font-playfair text-lg text-luxury-white mb-2">{activity.name}</h4>
                <p className="text-luxury-white/50 text-sm mb-4">{activity.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem({item: activity, type: 'activity'})}
                    className="flex-1 py-2 text-xs border border-white/20 hover:border-luxury-gold text-luxury-white/60 hover:text-luxury-gold transition-colors"
                  >
                    Details
                  </button>
                  <a
                    href={activity.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-white/10 hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                  </a>
                  <a
                    href={activity.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black transition-colors"
                  >
                    Book
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tours Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <Camera className="w-6 h-6 text-luxury-gold" />
            <h3 className="font-playfair text-3xl text-luxury-white">Must-Do Tours</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map((tour, index) => (
              <motion.div
                key={tour.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1 + index * 0.05 }}
                className="bg-luxury-charcoal/50 p-6 border border-white/5 hover:border-luxury-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-playfair text-lg text-luxury-white">{tour.name}</h4>
                  <span className="text-xs text-luxury-gold">{tour.duration}</span>
                </div>
                <p className="text-luxury-white/50 text-sm mb-4">{tour.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem({item: tour, type: 'tour'})}
                    className="flex-1 py-2 text-xs border border-white/20 hover:border-luxury-gold text-luxury-white/60 hover:text-luxury-gold transition-colors"
                  >
                    Details
                  </button>
                  <a
                    href={tour.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-white/10 hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                  </a>
                  <a
                    href={tour.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black transition-colors"
                  >
                    Book
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Climate & Cost */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2 }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="bg-luxury-charcoal/50 p-8 border border-white/10">
            <h3 className="font-playfair text-2xl text-luxury-white mb-4">Climate</h3>
            <p className="text-luxury-white/60 font-light leading-relaxed">
              Enjoy 350+ days of sunshine annually. Average temperature of 80°F (27°C) 
              with gentle sea breezes. Hurricane season (June-November) rarely impacts the region.
            </p>
          </div>
          <div className="bg-luxury-charcoal/50 p-8 border border-white/10">
            <h3 className="font-playfair text-2xl text-luxury-white mb-4">Cost of Living</h3>
            <p className="text-luxury-white/60 font-light leading-relaxed">
              Significantly lower than major US cities. Property taxes average 1/10th of California. 
              World-class healthcare at a fraction of US costs.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal 
            item={selectedItem.item} 
            type={selectedItem.type}
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}
