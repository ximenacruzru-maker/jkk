import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Check } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyType: string;
  budget: string;
  message: string;
}

const steps = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Preferences' },
  { id: 3, label: 'Details' },
];

const propertyTypes = [
  'Beachfront Villa',
  'Oceanfront Condo',
  'Jungle Estate',
  'Penthouse',
  'Investment Property',
  'Development / Pre-Construction',
];

const budgetRanges = [
  'Under $1M',
  '$1M - $2M',
  '$2M - $3M',
  '$3M - $5M',
  '$5M+',
];

export default function ContactForm() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyType: '',
    budget: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Required';
      if (!formData.email.trim()) newErrors.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email';
      }
    } else if (step === 2) {
      if (!formData.propertyType) newErrors.propertyType = 'Required';
      if (!formData.budget) newErrors.budget = 'Required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(3)) {
      setIsSubmitted(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <section 
      id="contact"
      ref={containerRef}
      className="py-24 lg:py-32 bg-luxury-black relative overflow-hidden"
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

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Column - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
              Get In Touch
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-white font-light tracking-wide mb-8">
              Let's Start Your Journey
            </h2>
            <p className="text-luxury-white/60 text-lg font-light leading-relaxed mb-12">
              Whether you're looking to buy or sell a luxury property, I'm here to provide 
              personalized service and expert guidance every step of the way.
            </p>

            {/* Contact Details */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-luxury-gold/30">
                  <Phone className="w-5 h-5 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-luxury-white/40 text-sm uppercase tracking-wider">Phone</p>
                  <p className="text-luxury-white text-lg">+1 (310) 555-0100</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-luxury-gold/30">
                  <Mail className="w-5 h-5 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-luxury-white/40 text-sm uppercase tracking-wider">Email</p>
                  <p className="text-luxury-white text-lg">carlos@cancunluxury.properties</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-luxury-gold/30">
                  <MapPin className="w-5 h-5 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-luxury-white/40 text-sm uppercase tracking-wider">Office</p>
                  <p className="text-luxury-white text-lg">Cancún, Quintana Roo, México</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-luxury-gold/30">
                  <Clock className="w-5 h-5 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-luxury-white/40 text-sm uppercase tracking-wider">Availability</p>
                  <p className="text-luxury-white text-lg">By Appointment Only</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Multi-step Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="bg-luxury-charcoal/50 backdrop-blur-xl border border-white/10 p-8 lg:p-12"
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-luxury-gold" />
                </div>
                <h3 className="font-playfair text-3xl text-luxury-white mb-4">Thank You</h3>
                <p className="text-luxury-white/60">
                  Your inquiry has been received. I'll be in touch within 24 hours.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-10">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                            currentStep >= step.id
                              ? 'bg-luxury-gold text-luxury-black'
                              : 'border border-luxury-taupe/40 text-luxury-taupe'
                          }`}
                        >
                          {currentStep > step.id ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <span className={`mt-2 text-xs tracking-wider uppercase ${
                          currentStep >= step.id ? 'text-luxury-gold' : 'text-luxury-taupe'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 lg:w-24 h-px mx-2 transition-colors duration-500 ${
                          currentStep > step.id ? 'bg-luxury-gold' : 'bg-luxury-taupe/30'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Personal Info */}
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            className="input-luxury"
                          />
                          {errors.firstName && (
                            <p className="text-red-400 text-xs mt-2">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            className="input-luxury"
                          />
                          {errors.lastName && (
                            <p className="text-red-400 text-xs mt-2">{errors.lastName}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email Address"
                          className="input-luxury"
                        />
                        {errors.email && (
                          <p className="text-red-400 text-xs mt-2">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone Number"
                          className="input-luxury"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Preferences */}
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <select
                          name="propertyType"
                          value={formData.propertyType}
                          onChange={handleChange}
                          className="input-luxury appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238B8B8B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem', backgroundSize: '1.25rem' }}
                        >
                          <option value="">Property Type</option>
                          {propertyTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {errors.propertyType && (
                          <p className="text-red-400 text-xs mt-2">{errors.propertyType}</p>
                        )}
                      </div>
                      <div>
                        <select
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          className="input-luxury appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238B8B8B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem', backgroundSize: '1.25rem' }}
                        >
                          <option value="">Budget Range</option>
                          {budgetRanges.map((range) => (
                            <option key={range} value={range}>{range}</option>
                          ))}
                        </select>
                        {errors.budget && (
                          <p className="text-red-400 text-xs mt-2">{errors.budget}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Details */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell me about your goals..."
                          rows={4}
                          className="input-luxury resize-none"
                        />
                      </div>
                      <p className="text-luxury-white/40 text-sm">
                        By submitting, you agree to our privacy policy and terms of service.
                      </p>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="text-luxury-white/60 hover:text-luxury-white transition-colors text-sm tracking-widest uppercase"
                      >
                        Back
                      </button>
                    ) : (
                      <div />
                    )}
                    
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="btn-luxury btn-luxury-primary text-xs"
                      >
                        <span>Continue</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        onClick={handleSubmit}
                        className="btn-luxury btn-luxury-primary text-xs"
                      >
                        <span>Submit Inquiry</span>
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
