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
    <div className="space-y-3">
      {/* Current Effective Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-600" />
            <span className="font-medium text-gray-900">
              Displayed Description
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(effectiveDescription.source)}`}>
              {roleLabels[effectiveDescription.source]}
            </span>
          </div>
          
          {allDescriptions.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllDescriptions(!showAllDescriptions)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {showAllDescriptions ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAllDescriptions ? 'Hide All' : `Show All (${allDescriptions.length})`}
            </button>
          )}
        </div>
        
        {effectiveDescription.content ? (
          <p className="text-gray-700 text-sm leading-relaxed">
            {effectiveDescription.content}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No description available for this category
          </p>
        )}
      </div>

      {/* Priority System Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Description Priority System:</p>
            <ol className="space-y-1 text-xs">
              <li>1. <strong>Universal Description</strong> - Shown to all users when available</li>
              <li>2. <strong>Role-Specific Description</strong> - Overrides universal for specific roles</li>
              <li>3. <strong>No Description</strong> - Nothing shown if neither exists</li>
            </ol>
          </div>
        </div>
      </div>

      {/* All Descriptions (when expanded) */}
      {showAllDescriptions && allDescriptions.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">All Available Descriptions</h4>
          
          {allDescriptions.map((desc, index) => (
            <div key={desc.role} className="border-l-4 border-gray-200 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(desc.role)}`}>
                  {desc.label}
                </span>
                {desc.role === effectiveDescription.source && (
                  <span className="text-xs text-green-600 font-medium">
                    ← Currently Displayed
                  </span>
                )}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
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