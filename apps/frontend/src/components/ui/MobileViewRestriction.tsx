import React from 'react';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const MobileViewRestriction: React.FC = () => {
  const location = useLocation();
  
  // Only restrict the core authenticated app pages (editor, dashboard, projects, settings)
  const isAppPage = 
    location.pathname.startsWith('/diagram') || 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/projects') || 
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/workspace');
    
  if (!isAppPage) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#09090b] text-white flex items-center justify-center lg:hidden"
    >
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#0d0d10',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          {/* Icons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Smartphone size={24} color="#71717a" />
            </div>
            <ArrowRight size={20} color="#52525b" />
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600" style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Monitor size={24} color="#ffffff" />
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em', color: '#fafafa' }}>
            Desktop Only
          </h1>

          {/* Description */}
          <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '24px' }}>
            Schemely is a professional system design tool built for large screens. 
            Please switch to a <span style={{ color: '#d4d4d8', fontWeight: 600 }}>PC or Tablet</span> for the best experience.
          </p>

          {/* Info Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '16px', textAlign: 'left' }}>
            <Monitor size={20} color="#a1a1aa" />
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