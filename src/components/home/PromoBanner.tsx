
'use client';

import { motion } from 'framer-motion';

export default function PromoBanner() {
  return (
    <motion.div
      className="bg-yellow-100 border border-yellow-300 text-yellow-900 text-center py-4 px-6 rounded-xl shadow mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      ✨ Discover Haitian heritage in every vector. Limited prints now available!
    </motion.div>
  );
}
