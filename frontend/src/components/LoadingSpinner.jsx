import { motion } from "framer-motion";

export default function LoadingSpinner({ size = 24, text = "Loading...", className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)]/20"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-primary)] border-r-[var(--color-primary-light)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary-light)]/10"
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {text && (
        <motion.p 
          className="text-[var(--color-text-secondary)] text-sm font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size={48} text={text} />
    </div>
  );
}

export function InlineLoader({ size = 16 }) {
  return (
    <motion.div
      className="rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  );
}
