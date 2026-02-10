import { motion } from "framer-motion";
import { Quote, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "Dr. Amina Kwame",
    role: "Task Owner",
    organisation: "Health Innovation Hub, Ghana",
    quote: "Posting a challenge here connected me with skilled providers who transformed my project idea into a working solution.",
    rating: 5,
    initials: "AK",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "James Okonkwo",
    role: "Solution Provider",
    organisation: "Digital Health Consultant, Nigeria",
    quote: "I applied to a digital health task and collaborated with global experts. It boosted my career and impact.",
    rating: 5,
    initials: "JO",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Dr. Maria Santos",
    role: "Policy Analyst",
    organisation: "WHO Regional Office, Switzerland",
    quote: "This platform bridges the gap between health challenges and those ready to solve them. A brilliant initiative!",
    rating: 5,
    initials: "MS",
    color: "from-purple-500 to-purple-600",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const displayCount = 3;
  
  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % (testimonials.length - displayCount + 1));
  };
  
  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + (testimonials.length - displayCount + 1)) % (testimonials.length - displayCount + 1));
  };

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-[var(--color-bg)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-[var(--color-primary-light)]/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm font-semibold mb-6">
            <Star size={14} className="fill-current" />
            Success Stories
          </span> */}
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
            What Our <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] bg-clip-text text-transparent">Users</span> Say
          </h2>
          {/* <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Hear from health professionals who have transformed their work and created lasting impact through our platform.
          </p> */}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonials.slice(activeIndex, activeIndex + displayCount).map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-[var(--color-surface)] rounded-2xl p-8 h-full border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:shadow-xl hover:shadow-[var(--color-accent)]/5 transition-all duration-300 relative">
                <div className="absolute top-6 right-6 text-[var(--color-accent)]/10 group-hover:text-[var(--color-accent)]/20 transition-colors">
                  <Quote size={48} />
                </div>
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-[var(--color-accent-light)] text-[var(--color-accent-light)]" />
                  ))}
                </div>
                
                <p className="text-[var(--color-text)] leading-relaxed mb-8 relative z-10 text-lg">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-4 mt-auto">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--color-text)]">{testimonial.name}</h4>
                    <p className="text-sm text-[var(--color-accent)]">{testimonial.role}</p>
                    {/* <p className="text-xs text-[var(--color-text-muted)]">{testimonial.organisation}</p> */}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevSlide}
            disabled={activeIndex === 0}
            className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} />
          </motion.button>
          
          <div className="flex gap-2">
            {Array.from({ length: testimonials.length - displayCount + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === activeIndex 
                    ? "bg-[var(--color-accent)] w-8" 
                    : "bg-[var(--color-border)] hover:bg-[var(--color-text-muted)]"
                }`}
              />
            ))}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextSlide}
            disabled={activeIndex >= testimonials.length - displayCount}
            className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight size={20} />
          </motion.button>
        </div> */}
      </div>
    </section>
  );
}
