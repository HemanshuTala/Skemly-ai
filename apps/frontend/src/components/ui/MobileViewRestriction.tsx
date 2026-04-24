import React from 'react';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileViewRestriction: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center lg:hidden"
    >
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: '24px',
            border: '1px solid rgba(63,63,70,0.5)',
            background: 'rgba(24,24,27,0.9)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          {/* Icons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(63,63,70,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(113,113,122,0.3)' }}>
              <Smartphone size={24} color="rgba(161,161,170,0.6)" />
            </div>
            <ArrowRight size={20} color="#a1a1aa" />
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(63,63,70,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(113,113,122,0.3)' }}>
              <Monitor size={24} color="#e4e4e7" />
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em', color: '#fafafa' }}>
            Desktop Only
          </h1>

          {/* Description */}
          <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '24px' }}>
            Skemly is a professional diagramming tool designed for large screens. 
            Please switch to a <span style={{ color: '#d4d4d8', fontWeight: 600 }}>PC or Tablet</span> for the best experience.
          </p>

          {/* Info Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid rgba(63,63,70,0.5)', background: 'rgba(39,39,42,0.6)', padding: '16px', textAlign: 'left' }}>
            <Monitor size={20} color="#d4d4d8" />
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', marginBottom: '4px' }}>
                Recommended View
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>
                Full Screen Desktop (1280px+)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};