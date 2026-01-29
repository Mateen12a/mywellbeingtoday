import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonCardProps {
  className?: string;
  variant?: "default" | "activity" | "mood" | "stat" | "list";
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

const shimmerAnimation = {
  backgroundPosition: ["200% 0", "-200% 0"],
};

const Shimmer = ({ className }: { className?: string }) => (
  <motion.div
    className={cn(
      "rounded-md bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 bg-[length:200%_100%]",
      className
    )}
    animate={shimmerAnimation}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  />
);

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, variant = "default", lines = 3, showAvatar = false, showImage = false }, ref) => {
    if (variant === "activity") {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "rounded-xl border bg-card p-4 space-y-3",
            className
          )}
        >
          <div className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
            </div>
          </div>
          <Shimmer className="h-3 w-full" />
          <div className="flex justify-between items-center pt-1">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
        </motion.div>
      );
    }

    if (variant === "mood") {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "rounded-xl border bg-card p-4 space-y-4",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shimmer className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Shimmer className="h-5 w-20" />
                <Shimmer className="h-3 w-24" />
              </div>
            </div>
            <Shimmer className="h-8 w-8 rounded-lg" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          <Shimmer className="h-4 w-full" />
        </motion.div>
      );
    }

    if (variant === "stat") {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "rounded-xl border bg-card p-6 space-y-3",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-8 w-8 rounded-lg" />
          </div>
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-3 w-20" />
        </motion.div>
      );
    }

    if (variant === "list") {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn("space-y-3", className)}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              {showAvatar && <Shimmer className="w-10 h-10 rounded-full shrink-0" />}
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-xl border bg-card overflow-hidden",
          className
        )}
      >
        {showImage && <Shimmer className="w-full h-40" />}
        <div className="p-6 space-y-4">
          {showAvatar && (
            <div className="flex items-center gap-3">
              <Shimmer className="w-10 h-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Shimmer className="h-4 w-1/3" />
                <Shimmer className="h-3 w-1/4" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Shimmer className="h-5 w-2/3" />
            {Array.from({ length: lines }).map((_, i) => (
              <Shimmer key={i} className={`h-3 w-[${70 + (i % 3) * 10}%]`} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
);
SkeletonCard.displayName = "SkeletonCard";

interface FadeInContentProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}

const FadeInContent = React.forwardRef<HTMLDivElement, FadeInContentProps>(
  ({ children, className, delay = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);
FadeInContent.displayName = "FadeInContent";

export { SkeletonCard, Shimmer, FadeInContent };
