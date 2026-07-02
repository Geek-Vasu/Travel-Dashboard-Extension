import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

export default function ChatButton({ onClick, isOpen }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 flex items-center justify-center transition-all cursor-pointer border-none outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <>
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </>
      )}
    </motion.button>
  );
}
