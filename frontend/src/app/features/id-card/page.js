'use client';

import IDCardGenerator from '../../../components/ui/IDCardGenerator';
import PremiumCard from '../../../components/ui/PremiumCard';
import { motion } from 'framer-motion';

export default function IDCardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">ID Card Generator</h1>
          <p className="text-slate-600 mb-6">Create a simple professional ID card for event attendees. Provide a name and an image (URL or upload), then generate and download a PNG.</p>
          <PremiumCard className="p-6">
            <IDCardGenerator />
          </PremiumCard>
        </motion.div>
      </div>
    </div>
  );
}
