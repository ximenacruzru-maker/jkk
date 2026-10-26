import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  location: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Carlos made our dream of owning a beachfront villa in Tulum a reality. His expertise in Mexican real estate law and tax implications saved us hundreds of thousands. Exceptional service from start to finish.",
    author: "Robert & Jennifer Adams",
    location: "Miami, Florida",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    id: 2,
    quote: "As first-time international buyers, we were nervous about investing in Mexico. Carlos guided us through every step— from property selection to closing. Our condo in Cancún has already appreciated 20%.",
    author: "Mark & Susan Thompson",
    location: "Austin, Texas",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    id: 3,
    quote: "We invested in a rental property through Carlos and it's been incredibly profitable. He connected us with an excellent property management company. Best investment decision we've made.",
    author: "David & Linda Martinez",
    location: "Los Angeles, California",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  },
  {
    id: 4,
    quote: "Carlos understands the American investor mindset. He speaks our language, understands our tax concerns, and delivers results. Our family office now uses him for all Mexico real estate investments.",
    author: "William & Caroline Johnson",
    location: "New York, NY",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  },
];

export default function Testimonials() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section 
      id="testimonials"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-cream overflow-hidden"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-16 lg:mb-20"
      >
        <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
          Client Stories
        </p>
        <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-black font-light tracking-wide">
          What They Say
        </h2>
      </motion.div>

      {/* Testimonial Carousel */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="relative">
          {/* Quote Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute -top-4 left-0 lg:left-8 text-luxury-gold/20"
          >
            <Quote className="w-24 h-24" />
          </motion.div>

          {/* Testimonial Content */}
          <div className="relative min-h-[300px]">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 },
                }}
                className="text-center px-4"
              >
                <blockquote className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-luxury-dark font-light leading-relaxed mb-8">
                  "{testimonials[currentIndex].quote}"
                </blockquote>
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-4 rounded-full overflow-hidden">
                    <img
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <cite className="not-italic">
                    <p className="font-playfair text-lg text-luxury-black">
                      {testimonials[currentIndex].author}
                    </p>
                    <p className="text-luxury-taupe text-sm mt-1">
                      {testimonials[currentIndex].location}
                    </p>
                  </cite>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-8 mt-12">
            <button
              onClick={prevSlide}
              className="group p-3 border border-luxury-taupe/30 hover:border-luxury-gold transition-all duration-300"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-luxury-stone group-hover:text-luxury-gold transition-colors" />
            </button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-luxury-gold w-8' 
                      : 'bg-luxury-taupe/30 hover:bg-luxury-taupe/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="group p-3 border border-luxury-taupe/30 hover:border-luxury-gold transition-all duration-300"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-luxury-stone group-hover:text-luxury-gold transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
