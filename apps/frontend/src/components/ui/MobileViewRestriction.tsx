import React from 'react';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileViewRestriction: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-6 text-center lg:hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-8 px-4"
      >
        <div className="relative flex justify-center">
          <div className="relative h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
            <Smartphone className="h-10 w-10 text-primary/40" />
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -right-2 top-1/2 -translate-y-1/2"
            >
              <ArrowRight className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-2xl bg-primary/5 blur-2xl" />
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl font-black tracking-tight text-foreground leading-tight">
            Desktop Only<br />Experience
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Skemly is a professional diagramming tool designed for large screens. Please switch to a <span className="text-primary font-bold">PC or Tablet</span> for the best experience.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/50 bg-muted/30 p-6 backdrop-blur-sm">
          <Monitor className="h-8 w-8 text-primary animate-pulse" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
              Recommended View
            </p>
            <p className="text-xs font-bold text-foreground">
              Full Screen Desktop (1280px+)
            </p>
          </div>
        </div>

        <div className="pt-4">
          <div className="h-1 w-12 bg-primary/20 rounded-full mx-auto" />
        </div>
      </motion.div>
    </div>
  );
};
