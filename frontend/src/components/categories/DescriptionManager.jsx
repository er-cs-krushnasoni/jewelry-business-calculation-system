import React, { useState } from 'react';
import { Eye, EyeOff, Info, MessageSquare } from 'lucide-react';

const DescriptionManager = ({ category, userRole = 'admin' }) => {
  const [showAllDescriptions, setShowAllDescriptions] = useState(false);
  
  // Get description based on priority: Universal → Role-based → None
  const getEffectiveDescription = (role = userRole) => {
    if (!category?.descriptions) return '';
    
    const roleMap = {
      'admin': 'admin',
      'manager': 'manager', 
      'pro_client': 'proClient',
      'client': 'client'
    };
    
    const mappedRole = roleMap[role];
    
    // First check universal description
    if (category.descriptions.universal && category.descriptions.universal.trim()) {
      return {
        content: category.descriptions.universal.trim(),
        source: 'universal',
        priority: 1
      };
    }
    
    // Then check role-specific description
    if (mappedRole && category.descriptions[mappedRole] && category.descriptions[mappedRole].trim()) {
      return {
        content: category.descriptions[mappedRole].trim(),
        source: mappedRole,
        priority: 2
      };
    }
    
    // No description available
    return {
      content: '',
      source: 'none',
      priority: 0
    };
  };

  const effectiveDescription = getEffectiveDescription();
  
  const roleLabels = {
    universal: 'Universal',
    admin: 'Admin Only',
    manager: 'Manager Only', 
    proClient: 'Pro Client Only',
    client: 'Client Only',
    none: 'No Description'
  };

  const getRoleColor = (source) => {
    const colors = {
      universal: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-green-100 text-green-800',
      proClient: 'bg-yellow-100 text-yellow-800',
      client: 'bg-gray-100 text-gray-800',
      none: 'bg-red-100 text-red-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const getAllDescriptions = () => {
    const descriptions = [];
    
    if (category?.descriptions?.universal?.trim()) {
      descriptions.push({
        role: 'universal',
        content: category.descriptions.universal.trim(),
        label: 'Universal Description'
      });
    }
    
    if (category?.descriptions?.admin?.trim()) {
      descriptions.push({
        role: 'admin',
        content: category.descriptions.admin.trim(),
        label: 'Admin Only Description'
      });
    }
    
    if (category?.descriptions?.manager?.trim()) {
      descriptions.push({
        role: 'manager',
        content: category.descriptions.manager.trim(),
        label: 'Manager Only Description'
      });
    }
    
    if (category?.descriptions?.proClient?.trim()) {
      descriptions.push({
        role: 'proClient',
        content: category.descriptions.proClient.trim(),
        label: 'Pro Client Only Description'
      });
    }
    
    if (category?.descriptions?.client?.trim()) {
      descriptions.push({
        role: 'client',
        content: category.descriptions.client.trim(),
        label: 'Client Only Description'
      });
    }
    
    return descriptions;
  };

  const allDescriptions = getAllDescriptions();

  if (!category) {
    return null;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Current Effective Description */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-luxury p-6 border border-gold-200 dark:border-slate-700 transition-all duration-300 hover:shadow-luxury-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-gold rounded-lg shadow-gold">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white text-lg">
                Displayed Description
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                effectiveDescription.source === 'universal' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : effectiveDescription.source === 'admin'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                  : effectiveDescription.source === 'manager'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : effectiveDescription.source === 'proClient'
                  ? 'bg-gradient-gold text-white shadow-gold'
                  : effectiveDescription.source === 'client'
                  ? 'bg-gradient-silver text-white shadow-silver'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
              }`}>
                {roleLabels[effectiveDescription.source]}
              </span>
            </div>
          </div>
          
          {allDescriptions.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllDescriptions(!showAllDescriptions)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gold-700 dark:text-gold-400 bg-gold-50 dark:bg-slate-700 hover:bg-gold-100 dark:hover:bg-slate-600 rounded-lg transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              aria-label={showAllDescriptions ? 'Hide all descriptions' : `Show all ${allDescriptions.length} descriptions`}
            >
              {showAllDescriptions ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="hidden sm:inline">
                {showAllDescriptions ? 'Hide All' : `Show All (${allDescriptions.length})`}
              </span>
            </button>
          )}
        </div>
        
        {effectiveDescription.content ? (
          <div className="pl-0 sm:pl-14">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {effectiveDescription.content}
            </p>
          </div>
        ) : (
          <div className="pl-0 sm:pl-14">
            <p className="text-gray-500 dark:text-gray-400 text-sm italic flex items-center gap-2">
              <Info size={14} className="flex-shrink-0" />
              No description available for this category
            </p>
          </div>
        )}
      </div>
  
      {/* Priority System Info */}
      <div className="glass-effect bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 rounded-xl p-5 shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-md flex-shrink-0">
            <Info size={18} className="text-white" />
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-100 flex-1">
            <p className="font-semibold mb-3 text-base">Description Priority System:</p>
            <ol className="space-y-2 text-xs">
              <li className="flex items-start gap-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">1.</span>
                <span>
                  <strong className="text-blue-800 dark:text-blue-200">Universal Description</strong> - Shown to all users when available
                </span>
              </li>
              <li className="flex items-start gap-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">2.</span>
                <span>
                  <strong className="text-blue-800 dark:text-blue-200">Role-Specific Description</strong> - Overrides universal for specific roles
                </span>
              </li>
              <li className="flex items-start gap-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">3.</span>
                <span>
                  <strong className="text-blue-800 dark:text-blue-200">No Description</strong> - Nothing shown if neither exists
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>
  
      {/* All Descriptions (when expanded) */}
      {showAllDescriptions && allDescriptions.length > 0 && (
        <div className="border border-gold-200 dark:border-slate-700 rounded-xl p-6 space-y-5 bg-white dark:bg-slate-800 shadow-luxury animate-slide-up">
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <MessageSquare size={18} className="text-gold-600 dark:text-gold-400" />
            All Available Descriptions
          </h4>
          
          {allDescriptions.map((desc, index) => (
            <div 
              key={desc.role} 
              className="border-l-4 border-gold-400 dark:border-gold-600 pl-5 py-3 bg-gradient-to-r from-gold-50/30 to-transparent dark:from-slate-700/30 rounded-r-lg transition-all duration-300 hover:from-gold-50 dark:hover:from-slate-700 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 shadow-sm ${
                  desc.role === 'universal' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                    : desc.role === 'admin'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    : desc.role === 'manager'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : desc.role === 'proClient'
                    ? 'bg-gradient-gold text-white'
                    : 'bg-gradient-silver text-white'
                }`}>
                  {desc.label}
                </span>
                {desc.role === effectiveDescription.source && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full animate-glow">
                    <Eye size={12} />
                    Currently Displayed
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {desc.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DescriptionManager;