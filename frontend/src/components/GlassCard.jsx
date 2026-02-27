import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  hover = true,
  gradient = false,
  glow = false,
  delay = 0,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`
        bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl
        ${hover ? 'transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]' : ''}
        ${gradient ? 'gradient-border' : ''}
        ${glow ? 'animate-glow-pulse' : ''}
        ${className}
      `}
      style={{
        boxShadow: glow
          ? '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(139,92,246,0.15), inset 0 1px 0 0 rgba(255,255,255,0.05)'
          : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.05)',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
