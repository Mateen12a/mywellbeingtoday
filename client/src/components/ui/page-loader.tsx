import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface PageLoaderProps {
  className?: string;
  message?: string;
  showLogo?: boolean;
  isLoading?: boolean;
}

const PageLoader = React.forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ className, message, showLogo = true, isLoading = true }, ref) => {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex flex-col items-center justify-center min-h-[400px] gap-6",
              className
            )}
          >
            {showLogo && (
              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center shadow-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 10px 25px -5px rgba(151, 181, 203, 0.2)",
                      "0 15px 35px -5px rgba(151, 181, 203, 0.4)",
                      "0 10px 25px -5px rgba(151, 181, 203, 0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Heart className="w-10 h-10 text-primary" fill="currentColor" fillOpacity={0.3} />
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-primary/5"
                  animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            )}
            
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              
              {message && (
                <motion.p
                  className="text-muted-foreground text-sm font-medium"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
PageLoader.displayName = "PageLoader";

export { PageLoader };
