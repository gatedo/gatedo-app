import { motion } from 'framer-motion';

export default function AnimatedProgressBar({
  value = 0,
  max = 100,
  height = 10,
  className = '',
}) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Math.min(Number(value) || 0, safeMax));
  const percent = (safeValue / safeMax) * 100;

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-white/10 ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_14px_rgba(255,140,0,.35)]"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      />
    </div>
  );
}