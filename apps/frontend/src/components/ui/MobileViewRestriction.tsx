import React from 'react';
import { ArrowRight, Monitor, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export const MobileViewRestriction: React.FC = () => {
  const location = useLocation();

  if (!location.pathname.startsWith('/diagram')) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#09090b]/95 px-4 py-6 text-white backdrop-blur-xl md:hidden">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/[0.09] bg-[#111116] p-6 text-center shadow-2xl shadow-black/50 sm:p-8"
        >
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
              <Smartphone size={20} className="text-zinc-400" />
            </div>
            <ArrowRight size={16} className="text-zinc-600" />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-950/40">
              <Monitor size={20} className="text-white" />
            </div>
          </div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">Designed for a large canvas</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Open the editor on desktop
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-zinc-400">
            The diagram editor needs more room for precise canvas controls. Your dashboard, projects, and settings are still available here.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Back to dashboard
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};