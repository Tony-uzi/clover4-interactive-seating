// ShareModal component for generating shareable links with dietary filters

import React, { useState, useEffect } from 'react';
import { FiX, FiCopy, FiCheck, FiShare2 } from 'react-icons/fi';

export default function ShareModal({
  isOpen,
  onClose,
  eventId,
  onGenerateToken,
  guests = [], // Pass guests from parent to determine available dietary preferences
}) {
  const [shareToken, setShareToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    all: true,
  });
  const [availableDietaryPreferences, setAvailableDietaryPreferences] = useState([]);

  useEffect(() => {
    if (isOpen && !shareToken) {
      generateToken();
    }
  }, [isOpen]);

  // Extract unique dietary preferences from guests
  useEffect(() => {
    if (guests && guests.length > 0) {
      const uniqueDietary = new Set();
      guests.forEach(guest => {
        const dietary = (guest.dietaryPreference || guest.dietary_preference || guest.dietary_requirements || '').toLowerCase().trim();
        if (dietary && dietary !== 'none' && dietary !== '') {
          uniqueDietary.add(dietary);
        }
      });

      // Always add 'none' option
      uniqueDietary.add('none');

      const dietaryArray = Array.from(uniqueDietary).sort();
      setAvailableDietaryPreferences(dietaryArray);

      // Initialize selected filters based on available preferences
      const initialFilters = { all: true };
      dietaryArray.forEach(pref => {
        initialFilters[pref] = false;
      });
      setSelectedFilters(initialFilters);
    }
  }, [guests]);

  const generateToken = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await onGenerateToken(eventId);
      if (result.success) {
        setShareToken(result.data.shareToken);
      } else {
        setError(result.error || 'Failed to generate share token');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate share token');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    if (filter === 'all') {
      // Toggle "Show All" - if it's already selected, unselect it; if not, select it and clear others
      setSelectedFilters(prev => {
        if (prev.all) {
          // If "Show All" is already selected, just unselect it (don't auto-select anything else)
          return { ...prev, all: false };
        } else {
          // Select "Show All" and clear all other filters
          const resetFilters = { all: true };
          availableDietaryPreferences.forEach(pref => {
            resetFilters[pref] = false;
          });
          return resetFilters;
        }
      });
    } else {
      // When selecting a specific dietary preference, unselect "Show All"
      setSelectedFilters(prev => ({
        ...prev,
        all: false,
        [filter]: !prev[filter],
      }));
    }
  };

  const getShareUrl = () => {
    if (!shareToken) return '';
    
    const baseUrl = `${window.location.origin}/conference/share/${shareToken}`;
    const activeFilters = Object.entries(selectedFilters)
      .filter(([key, value]) => value && key !== 'all')
      .map(([key]) => key);
    
    if (activeFilters.length === 0) {
      return baseUrl;
    }
    
    return `${baseUrl}?filter=${activeFilters.join(',')}`;
  };

  const copyToClipboard = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  const shareUrl = getShareUrl();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FiShare2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Share Event</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Generating share link...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && shareToken && (
            <>
              {/* Filter Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Dietary Preference Filters
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which dietary preferences to show in the shared view. This is useful for catering services and food vendors.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Show All option */}
                  <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedFilters.all ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={selectedFilters.all}
                      onChange={() => handleFilterChange('all')}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                    />
                    <span className="font-medium text-gray-700">Show All Guests</span>
                  </label>

                  {/* Dynamic dietary preferences from guests */}
                  {availableDietaryPreferences.map(pref => {
                    const isSelected = selectedFilters[pref] || false;
                    const isDisabled = loading; // Only disable during loading, allow clicking when "Show All" is selected

                    // Get display label and emoji for preference
                    const getDisplayInfo = (preference) => {
                      const prefLower = preference.toLowerCase();
                      const emojiMap = {
                        'vegan': '🌱',
                        'vegetarian': '🥗',
                        'halal': '🍖',
                        'kosher': '✡️',
                        'gluten-free': '🌾',
                        'gluten free': '🌾',
                        'dairy-free': '🥛',
                        'dairy free': '🥛',
                        'nut-free': '🥜',
                        'nut free': '🥜',
                        'none': '➖',
                      };

                      const emoji = emojiMap[prefLower] || '🍽️';
                      const label = preference === 'none'
                        ? 'No Preference'
                        : preference.charAt(0).toUpperCase() + preference.slice(1);

                      return { emoji, label };
                    };

                    const { emoji, label } = getDisplayInfo(pref);

                    return (
                      <label
                        key={pref}
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFilterChange(pref)}
                          disabled={isDisabled}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-gray-700">{emoji} {label}</span>
                      </label>
                    );
                  })}
                </div>

                {availableDietaryPreferences.length === 0 && (
                  <p className="text-sm text-gray-500 italic mt-2">
                    No dietary preferences found in guest list
                  </p>
                )}
              </div>

              {/* Share URL */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Shareable Link
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Share this link with stakeholders. No login required.
                </p>
              </div>

              {/* Preview Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What recipients will see:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Read-only view of the conference layout</li>
                  <li>
                    • {selectedFilters.all 
                      ? 'All tables with assigned guests'
                      : `Only tables with guests matching: ${Object.entries(selectedFilters)
                          .filter(([key, value]) => value && key !== 'all')
                          .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                          .join(', ')}`
                    }
                  </li>
                  <li>• Room layout and dimensions</li>
                  <li>• No editing or guest management capabilities</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


