import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Briefcase, Globe, Sparkles, Shield, Zap, Award, Heart, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function Hero() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  const scrollToHowItWorks = () => {
  const element = document.getElementById('how-it-works');

  if (element) {
    const navHeight = 80;
    const elementPosition =
      element.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({
      top: elementPosition - navHeight,
      behavior: 'smooth',
    });
  }
};


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with video and fallback image */}
      <div className="absolute inset-0 z-0">
        {/* Fallback image - shows until video loads */}
        <img
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80"
          alt="Healthcare professionals collaborating"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/90 via-[#1e293b]/85 to-[#0f172a]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[var(--color-primary-light)]/30 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-[var(--color-accent)]/20 to-transparent rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent rounded-full blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="text-center">
          {/*<motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-8"
          >
             <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
              <Sparkles size={16} className="text-[var(--color-accent-light)]" />
              The Future of Global Health Collaboration 
            </span>
          </motion.div>*/}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.8rem] font-bold text-white leading-tight mb-8 md:mt-6 lg:mt-10"
          >
            The Marketplace for<br/>
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-light)] to-[var(--color-primary-light)] bg-clip-text text-transparent">
                Global Health Work
              </span>
              {/* <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full origin-left"
              /> */}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Where Global Health Problems Meet Global Health Solutions.
            
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link
              to="/signup?role=TO"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[var(--color-accent)] to-[#d45428] hover:from-[#d45428] hover:to-[var(--color-accent)] text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[var(--color-accent)]/30 hover:shadow-xl hover:shadow-[var(--color-accent)]/40 hover:-translate-y-1"
            >
              <Briefcase size={22} />
              I want to post a task
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/signup?role=SP"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-1"
            >
              <Users size={22} />
              I want to work on tasks
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { 
                icon: Globe, 
                title: "Global Network", 
                description: "Connect with health professionals across 50+ countries worldwide" 
              },
              { 
                icon: Shield, 
                title: "Vetted Experts", 
                description: "All solution providers are verified and approved by our team" 
              },
              { 
                icon: Zap, 
                title: "Fast Matching", 
                description: "Get matched with the right experts for your health projects quickly" 
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-accent)]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} className="text-white/90" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div> */}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        onClick={scrollToHowItWorks}
        className="z-20 cursor-pointer absolute bottom-8 left-1/2 -translate-x-1/2 hover:scale-110 transition-transform"
        aria-label="Scroll to next section"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/30 hover:border-white/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-2.5 bg-white/60 rounded-full" />
        </motion.div>
      </motion.button>

    </section>
  );
}
