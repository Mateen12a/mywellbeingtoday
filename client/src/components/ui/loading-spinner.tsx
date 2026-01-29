import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const loadingSpinnerVariants = cva(
  "relative inline-flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  text?: string;
  showText?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, text, showText = false, ...props }, ref) => {
    const sizeClasses = {
      sm: { outer: "w-4 h-4", inner: "w-2.5 h-2.5", border: "border-[2px]" },
      md: { outer: "w-8 h-8", inner: "w-5 h-5", border: "border-[3px]" },
      lg: { outer: "w-12 h-12", inner: "w-8 h-8", border: "border-4" },
    };
    const currentSize = sizeClasses[size || "md"];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-3", className)}
        {...props}
      >
        <div className={cn("relative", loadingSpinnerVariants({ size }))}>
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-primary/20",
              currentSize.border
            )}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-transparent border-t-primary border-r-primary/50",
              currentSize.border
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className={cn(
              "absolute rounded-full bg-primary/10",
              currentSize.inner
            )}
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        {(showText || text) && (
          <motion.p
            className="text-sm text-muted-foreground font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {text || "Loading..."}
          </motion.p>
        )}
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner, loadingSpinnerVariants };
