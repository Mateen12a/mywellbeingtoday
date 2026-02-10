// import { motion } from "framer-motion";

// const partners = [
//   { name: "World Health Organisation", abbr: "WHO" },
//   { name: "UNICEF", abbr: "UNICEF" },
//   { name: "Bill & Melinda Gates Foundation", abbr: "BMGF" },
//   { name: "Doctors Without Borders", abbr: "MSF" },
//   { name: "The Global Fund", abbr: "TGF" },
//   { name: "GAVI Alliance", abbr: "GAVI" },
// ];

// Temporarily commented out - can be re-enabled later when partners are confirmed
export default function Partners() {
  return null;
  
  // return (
  //   <section className="py-16 bg-[var(--color-bg)] border-y border-[var(--color-border)]">
  //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  //       <motion.div
  //         initial={{ opacity: 0, y: 20 }}
  //         whileInView={{ opacity: 1, y: 0 }}
  //         viewport={{ once: true }}
  //         transition={{ duration: 0.6 }}
  //         className="text-center mb-10"
  //       >
  //         <p className="text-[var(--color-text-muted)] text-sm font-medium uppercase tracking-wider">
  //           Trusted by Leading Health Organisations
  //         </p>
  //       </motion.div>

  //       <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
  //         {partners.map((partner, index) => (
  //           <motion.div
  //             key={partner.name}
  //             initial={{ opacity: 0, y: 10 }}
  //             whileInView={{ opacity: 1, y: 0 }}
  //             viewport={{ once: true }}
  //             transition={{ duration: 0.4, delay: index * 0.05 }}
  //             className="group"
  //           >
  //             <div className="flex items-center justify-center h-12 px-6 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)]/30 transition-all duration-300 group-hover:shadow-md">
  //               <span className="text-[var(--color-text-secondary)] font-semibold text-lg group-hover:text-[var(--color-primary-light)] transition-colors">
  //                 {partner.abbr}
  //               </span>
  //             </div>
  //           </motion.div>
  //         ))}
  //       </div>
  //     </div>
  //   </section>
  // );
}
