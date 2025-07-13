
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function WhyHaitianArt() {
  return (
    <motion.div
      className="grid md:grid-cols-2 gap-8 items-center my-24"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <Image
          src="/images/haitian-artists.jpg"
          alt="Haitian artist at work"
          width={600}
          height={400}
          className="rounded-xl shadow"
        />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Why Haitian Art?</h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Haitian art is a vibrant celebration of resilience, spirituality, and community. Each piece reflects generations of cultural heritage and artistic mastery.
        </p>
        <p className="text-gray-700 mt-4">
          Support local creators and own a piece of soul-crafted artwork that tells a story.
        </p>
      </div>
    </motion.div>
  );
}
