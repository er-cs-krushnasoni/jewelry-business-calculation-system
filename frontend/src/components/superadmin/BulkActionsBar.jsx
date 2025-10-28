import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import Button from '../ui/Button';

const BulkActionsBar = ({ selectedCount, onActivate, onDeactivate, onCancel }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="glass-effect bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-white rounded-2xl shadow-luxury-lg border border-gold-500/20 dark:border-gold-400/30 px-6 py-4 flex items-center gap-6 backdrop-blur-xl transition-all duration-300 hover:shadow-gold">
        {/* Selection Count Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-gold rounded-full px-4 py-1.5 font-bold text-sm shadow-gold animate-glow">
            {selectedCount}
          </div>
          <span className="font-medium text-gray-100 dark:text-white">
            {selectedCount === 1 ? 'shop selected' : 'shops selected'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-gold-400/50 to-transparent"></div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Activate Button */}
          <Button
            variant="secondary"
            size="small"
            onClick={onActivate}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 text-white border-0 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg font-medium"
          >
            <CheckCircle size={16} className="animate-pulse" />
            Activate
          </Button>

          {/* Deactivate Button */}
          <Button
            variant="secondary"
            size="small"
            onClick={onDeactivate}
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 dark:from-rose-600 dark:to-rose-700 dark:hover:from-rose-700 dark:hover:to-rose-800 text-white border-0 flex items-center gap-2 shadow-lg hover:shadow-rose-500/50 transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg font-medium"
          >
            <XCircle size={16} />
            Deactivate
          </Button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="ml-2 p-2 hover:bg-gold-500/20 dark:hover:bg-gold-400/20 rounded-lg transition-all duration-300 hover:scale-110 group border border-transparent hover:border-gold-400/30"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X size={20} className="text-gray-300 group-hover:text-gold-400 transition-colors duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;