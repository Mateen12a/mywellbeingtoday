import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Laptop, 
  Building2, 
  Baby, 
  FileText, 
  BarChart2, 
  Heart, 
  GraduationCap,
  X,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const areas = [
  { 
    icon: Activity, 
    name: "Epidemiology & Surveillance", 
    color: "from-blue-500 to-blue-600",
    description: "Disease monitoring, outbreak investigation, and public health surveillance systems.",
    details: [
      "Disease outbreak detection and response",
      "Health data collection and analysis",
      "Surveillance system design and implementation",
      "Epidemiological research and studies",
      "Risk assessment and modeling"
    ],
    opportunities: "Connect with organisations needing expertise in disease tracking, health data analysis, and surveillance infrastructure."
  },
  { 
    icon: Laptop, 
    name: "Digital Health", 
    color: "from-purple-500 to-purple-600",
    description: "Technology solutions for healthcare delivery, telemedicine, and health informatics.",
    details: [
      "Health information systems (HIS)",
      "Telemedicine and remote care solutions",
      "Mobile health (mHealth) applications",
      "Electronic health records (EHR)",
      "Health data interoperability"
    ],
    opportunities: "Work on cutting-edge digital solutions transforming healthcare delivery across the globe."
  },
  { 
    icon: Building2, 
    name: "Health Systems Strengthening", 
    color: "from-green-500 to-green-600",
    description: "Building resilient health systems through governance, financing, and workforce development.",
    details: [
      "Health governance and leadership",
      "Healthcare financing strategies",
      "Supply chain management",
      "Quality improvement initiatives",
      "Health workforce planning"
    ],
    opportunities: "Help build stronger, more resilient health systems in communities that need it most."
  },
  { 
    icon: Baby, 
    name: "Maternal & Child Health", 
    color: "from-pink-500 to-pink-600",
    description: "Improving health outcomes for mothers, newborns, and children worldwide.",
    details: [
      "Antenatal and postnatal care",
      "Immunisation programmes",
      "Nutrition interventions",
      "Child development initiatives",
      "Reproductive health services"
    ],
    opportunities: "Make a direct impact on the health and wellbeing of mothers and children globally."
  },
  { 
    icon: FileText, 
    name: "Policy & Strategy", 
    color: "from-orange-500 to-orange-600",
    description: "Health policy development, strategic planning, and advocacy for better health outcomes.",
    details: [
      "Health policy analysis and development",
      "Strategic planning and roadmapping",
      "Stakeholder engagement",
      "Advocacy and communications",
      "Regulatory affairs"
    ],
    opportunities: "Shape health policies and strategies that affect millions of lives."
  },
  { 
    icon: BarChart2, 
    name: "Data & Evaluation", 
    color: "from-cyan-500 to-cyan-600",
    description: "Monitoring, evaluation, and research to measure and improve health programme impact.",
    details: [
      "Programme monitoring and evaluation",
      "Impact assessment",
      "Data analytics and visualisation",
      "Research design and implementation",
      "Performance measurement"
    ],
    opportunities: "Use data to drive decisions and demonstrate the impact of health interventions."
  },
  { 
    icon: Heart, 
    name: "Community Health", 
    color: "from-red-500 to-red-600",
    description: "Grassroots health initiatives, community engagement, and primary healthcare.",
    details: [
      "Community health worker programmes",
      "Health promotion and education",
      "Primary healthcare delivery",
      "Community engagement strategies",
      "Social determinants of health"
    ],
    opportunities: "Work directly with communities to improve health at the grassroots level."
  },
  { 
    icon: GraduationCap, 
    name: "Training & Capacity Building", 
    color: "from-indigo-500 to-indigo-600",
    description: "Building skills and knowledge in the global health workforce.",
    details: [
      "Curriculum development",
      "Training programme design",
      "Mentorship and coaching",
      "E-learning solutions",
      "Professional development"
    ],
    opportunities: "Help develop the next generation of global health professionals."
  },
];

export default function FocusAreas() {
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedArea(null);
      }
    };
    
    if (selectedArea) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [selectedArea]);

  return (
    <section className="py-24 md:py-32 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)] text-sm font-semibold mb-4">
            Expertise Areas
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
            Explore <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary-light)] bg-clip-text text-transparent">Focus Areas</span>
          </h2>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Find expertise across the full spectrum of global health disciplines and specialisations. Click any area to learn more.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {areas.map((area, index) => (
            <motion.div
              key={area.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group cursor-pointer"
              onClick={() => setSelectedArea(area)}
            >
              <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] hover:border-transparent hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${area.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center mb-4 shadow-lg group-hover:bg-white/20 group-hover:shadow-none transition-all duration-300`}>
                    <area.icon size={26} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)] group-hover:text-white transition-colors duration-300">
                    {area.name}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] group-hover:text-white/80 mt-2 transition-colors duration-300">
                    Click to learn more
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedArea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedArea(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[var(--color-surface)] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-br ${selectedArea.color} p-8 relative`}>
                <button
                  onClick={() => setSelectedArea(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <selectedArea.icon size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedArea.name}</h3>
                    <p className="text-white/80 mt-1">{selectedArea.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-4 text-lg">Key Activities</h4>
                  <ul className="space-y-3">
                    {selectedArea.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[var(--color-text-secondary)]">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[var(--color-bg)] rounded-2xl p-6">
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">Opportunities</h4>
                  <p className="text-[var(--color-text-secondary)]">{selectedArea.opportunities}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <a
                    href="/signup?role=SP"
                    className={`flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${selectedArea.color} hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                  >
                    Join as Solution Provider
                    <ArrowRight size={18} />
                  </a>
                  <a
                    href="/signup?role=TO"
                    className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] hover:bg-[var(--color-bg-secondary)] transition-all"
                  >
                    Post a Task
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
