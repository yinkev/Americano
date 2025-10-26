import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <motion.div whileFocus={{ scale: 1.01 }} className="w-full" transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-transparent bg-card px-3 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-none focus-visible:shadow-none",
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }
);
Input.displayName = "Input";

export { Input };
