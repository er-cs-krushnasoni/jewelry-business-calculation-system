import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import Button from '../ui/Button';

const BulkActionsBar = ({ selectedCount, onActivate, onDeactivate, onCancel }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-blue-600 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 rounded-full px-3 py-1 font-bold">
            {selectedCount}
          </div>
          <span className="font-medium">
            {selectedCount === 1 ? 'shop selected' : 'shops selected'}
          </span>
        </div>

        <div className="h-8 w-px bg-blue-400"></div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="small"
            onClick={onActivate}
            className="bg-green-500 hover:bg-green-600 text-white border-0 flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Activate
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={onDeactivate}
            className="bg-red-500 hover:bg-red-600 text-white border-0 flex items-center gap-2"
          >
            <XCircle size={16} />
            Deactivate
          </Button>

          <button
            onClick={onCancel}
            className="ml-2 p-2 hover:bg-blue-500 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;