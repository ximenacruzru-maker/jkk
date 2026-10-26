import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calendar, User, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  image: string;
  slug: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: "Why American Investors Are Choosing Cancun in 2026",
    excerpt: "The Mexican Caribbean has become the top destination for US real estate investors seeking high returns and lifestyle benefits.",
    content: `
The Mexican Caribbean real estate market has experienced unprecedented growth, with American investors leading the charge. Here's why Cancun and the Riviera Maya have become the hottest destinations for US property buyers.

## Strong ROI Potential
Properties in the Cancun Hotel Zone have seen average appreciation of 12-15% annually, significantly outpacing many US markets. Rental yields of 8-12% are common, especially with the region's year-round tourism.

## Favorable Exchange Rates
The USD-MXN exchange rate makes Mexican real estate exceptionally affordable for American buyers. A luxury property that costs $5M in Malibu might be available for $2-3M inulum with comparable or T better amenities.

## Tax Advantages
Mexico offers significant tax benefits for foreign investors, including no capital gains tax on primary residences and favorable treatment of rental income. The Fideicomiso (trust) structure provides full ownership rights.

## Lifestyle Benefits
With direct flights from most US cities, world-class dining, and 350+ days of sunshine, Cancun offers an unbeatable lifestyle. Property owners enjoy access to pristine beaches, championship golf, and world-renowned spas.

## Growing Infrastructure
New developments are bringing US-level infrastructure to the region. Modern hospitals, international schools, and luxury shopping centers make this a viable option for full-time living.
    `,
    category: "Investment Guide",
    date: "February 28, 2026",
    readTime: "8 min read",
    author: "Carlos Mendoza",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    slug: "why-american-investors-choosing-cancun-2026"
  },
  {
    id: 2,
    title: "Understanding the Fideicomiso: Your Complete Guide",
    excerpt: "How foreigners can own property in Mexico's restricted zones through the trust system.",
    content: `
Mexico's constitution restricts direct property ownership in "restricted zones" (within 50km of the coast and 100km of borders). However, foreigners can easily invest through a Fideicomiso (bank trust).

## What is a Fideicomiso?
A Fideicomiso is a trust agreement where a Mexican bank holds the title on behalf of the foreign buyer. You maintain full control and can sell, lease, or will the property at any time.

## Key Benefits
- 100% beneficial ownership
- Can be passed to heirs
- 50-year renewable term (automatic renewal)
- No impact on US tax status
- Bank provides additional security

## Costs Involved
Setup typically costs $1,500-2,500 plus annual trustee fees of $400-800. This is a one-time investment that protects your ownership rights forever.

## Choosing Your Trustee
Major Mexican banks offer Fideicomiso services. We recommend working with established institutions like Banorte, BBVA, or Santander who have English-speaking representatives.
    `,
    category: "Buying Guide",
    date: "February 20, 2026",
    readTime: "6 min read",
    author: "Carlos Mendoza",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    slug: "understanding-fideicomiso-complete-guide"
  },
  {
    id: 3,
    title: "Top 5 Luxury Neighborhoods in the Riviera Maya",
    excerpt: "A comprehensive guide to the most prestigious communities for property investment.",
    content: `
The Riviera Maya offers diverse communities, each with unique characteristics. Here are the top five neighborhoods for luxury property investment.

## 1. Cancun Hotel Zone
The most established luxury market with highest rental demand. Oceanfront condos here command premium prices and excellent rental income. Expect to pay $2,000-5,000 per square foot.

## 2. Tulum Beach
The hottest market in Mexico with exclusive beachfront properties. New developments offer modern eco-chic designs. Prices range from $1.5M-10M with strong appreciation potential.

## 3. Playa del Carmen
Balanced mix of investment and lifestyle. The famous 5th Avenue provides excellent rental demand. More affordable than Tulum with similar returns.

## 4. Puerto Morelos
The hidden gem - still affordable with massive growth potential. Quiet fishing village turning into luxury destination. Best value for money.

## 5. Isla Holbox
Emerging destination for eco-tourism investments. Car-free island with laid-back luxury. Early investors seeing 20%+ annual returns.
    `,
    category: "Market Insights",
    date: "February 15, 2026",
    readTime: "5 min read",
    author: "Carlos Mendoza",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    slug: "top-5-luxury-neighborhoods-riviera-maya"
  },
  {
    id: 4,
    title: "FIRPTA and US Tax Implications for Mexican Property",
    excerpt: "What American sellers need to know about FIRPTA withholding and tax obligations.",
    content: `
Selling property in Mexico as a US citizen involves specific tax considerations. Understanding FIRPTA and related regulations is essential.

## FIRPTA Overview
The Foreign Investment in Real Property Tax Act requires buyers to withhold 15% of the gross sale price when selling to a foreign person. However, this can be reduced or eliminated.

## Reducing FIRPTA Withholding
- Apply for a withholding certificate from IRS
- Sale price under $300,000 with buyer intended use as residence
- Provide W-7 for ITIN if needed
- Work with a qualified tax attorney

## US Tax Treatment
Capital gains on foreign property are taxed in the US. However, you may qualify for:
- Exclusion of gain from sale of primary residence
- Foreign tax credit for Mexican taxes paid
- Tax treaty benefits between US and Mexico

## Reporting Requirements
- Form 1040 (Schedule E) for rental income
- Form 8865 for foreign real property interests
- FBAR if foreign accounts exceed thresholds

We strongly recommend working with a cross-border tax specialist.
    `,
    category: "Tax Guide",
    date: "February 10, 2026",
    readTime: "7 min read",
    author: "Carlos Mendoza",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    slug: "firpta-us-tax-implications-mexican-property"
  },
  {
    id: 5,
    title: "Rental Property Management in Cancun: Everything You Need to Know",
    excerpt: "Maximize your investment returns with professional property management.",
    content: `
The short-term rental market in Cancun is thriving, but success requires professional management. Here's what property owners need to know.

## Market Overview
Average daily rates of $300-800 for luxury properties yield excellent returns. Peak season (December-April) commands premium pricing, while summer months remain strong.

## Property Management Services
Full-service management includes:
- Marketing on VRBO, Airbnb, Booking.com
- Guest screening and communication
- Check-in/check-out coordination
- Housekeeping and maintenance
- Revenue management and pricing
- 24/7 guest support

## Costs and Contracts
Management fees typically range 15-25% of gross revenue. Look for companies with proven track records and English-speaking staff.

## Licensing Requirements
Mexican tourism licenses are required for short-term rentals. Professional managers handle this process and ensure compliance with local regulations.

## Maximizing Returns
- Professional photography is essential
- Responsive guest communication increases ratings
- Regular updates and renovations maintain premium pricing
- Calendar synchronization prevents overbooking
    `,
    category: "Investment Guide",
    date: "February 5, 2026",
    readTime: "6 min read",
    author: "Carlos Mendoza",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    slug: "rental-property-management-cancun-guide"
  },
  {
    id: 6,
    title: "The Ultimate Cancun Lifestyle Guide",
    excerpt: "Discover what makes the Mexican Caribbean the perfect second home destination.",
    content: `
Beyond real estate investment, Cancun offers an exceptional lifestyle that keeps property owners returning year after year.

## Climate and Weather
Enjoy 350+ days of sunshine annually with temperatures averaging 80°F. Hurricane season (June-November) rarely disrupts the region due to modern infrastructure and early warning systems.

## World-Class Amenities
- Over 200 golf courses in the region
- Michelin-starred dining experiences
- Championship sports fishing
- World-renowned diving and snorkeling
- Luxury spa and wellness centers
- High-end shopping at La Isla and Puerto Cancun

## Healthcare
International hospitals with US-trained doctors provide excellent care at a fraction of US costs. Many Americans choose to live here part-time for healthcare affordability.

## Accessibility
Cancun International Airport offers direct flights from most major US cities. US citizens don't need visas for stays up to 180 days.

## Community
Expatriate communities in areas like Puerto Morelos and Playa del Carmen offer welcoming environments with established support networks.
    `,
    category: "Lifestyle",
    date: "January 28, 2026",
    readTime: "5 min read",
    author: "Carlos Mendoza",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    slug: "ultimate-cancun-lifestyle-guide"
  },
];

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[16/10] overflow-hidden mb-6">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-xs text-luxury-taupe">
          <span className="text-luxury-gold font-medium">{article.category}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {article.date}
          </span>
        </div>
        <h3 className="font-playfair text-xl text-luxury-black group-hover:text-luxury-gold transition-colors duration-300">
          {article.title}
        </h3>
        <p className="text-luxury-taupe font-light text-sm leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 text-luxury-gold text-sm pt-2">
          <span>Read Article</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.article>
  );
}

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true });

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

      {/* Hero */}
      <div className="relative h-[40vh] lg:h-[50vh]">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative -mt-24 pb-24">
        <div className="max-w-3xl mx-auto px-6" ref={contentRef}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="bg-luxury-charcoal/90 backdrop-blur-xl p-8 lg:p-12"
          >
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-luxury-white/60 mb-6">
              <span className="text-luxury-gold font-medium">{article.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {article.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {article.author}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-playfair text-3xl lg:text-4xl text-luxury-white mb-6">
              {article.title}
            </h1>

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none text-luxury-white/80 font-light leading-relaxed">
              {article.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="font-playfair text-2xl text-luxury-white mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter(p => p.startsWith('- '));
                  return (
                    <ul key={index} className="list-disc list-inside space-y-2 my-4">
                      {items.map((item, i) => (
                        <li key={i}>{item.replace('- ', '')}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={index} className="my-4">{paragraph}</p>;
              })}
            </div>

            {/* Back Button */}
            <button
              onClick={onClose}
              className="mt-8 flex items-center gap-2 text-luxury-gold hover:text-luxury-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Articles</span>
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Blog() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <>
      <section 
        id="blog"
        ref={containerRef}
        className="py-24 lg:py-32 bg-luxury-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-luxury-gold text-sm tracking-luxury uppercase mb-4 font-inter">
              Insights
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-luxury-black font-light tracking-wide mb-6">
              Latest Articles
            </h2>
            <p className="text-luxury-stone font-light leading-relaxed max-w-2xl mx-auto">
              Expert insights on Mexican real estate investment, market trends, and the Caribbean lifestyle.
            </p>
          </motion.div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {articles.map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                onClick={() => setSelectedArticle(article)} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal 
            article={selectedArticle} 
            onClose={() => setSelectedArticle(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

export { articles };
