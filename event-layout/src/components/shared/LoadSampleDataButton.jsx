/**
 * Button component to load sample conference data to backend API
 */

import { useState } from 'react';
import { FiDownload, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { loadSampleConferenceDataToAPI } from '../../lib/utils/loadSampleDataAPI';
import * as ConferenceAPI from '../../server-actions/conference-planner';

export default function LoadSampleDataButton({ onDataLoaded }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadSampleData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Load sample data to backend API
      const result = await loadSampleConferenceDataToAPI();
      
      if (result.success) {
        setSuccess(true);
        
        // Notify parent component to reload data from API
        if (onDataLoaded) {
          onDataLoaded(result.data);
        }

        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all conference data? This will delete from the database.')) {
      setLoading(true);
      setError(null);
      
      try {
        // Get all events and delete them
        const eventsResult = await ConferenceAPI.getAllEvents();
        
        if (eventsResult.success && eventsResult.data.length > 0) {
          // Delete all events
          for (const event of eventsResult.data) {
            await ConferenceAPI.deleteEvent(event.id);
          }
          
          // Clear localStorage as well
          localStorage.clear();
          
          // Reload page
          window.location.reload();
        } else {
          // Just clear localStorage
          localStorage.clear();
          window.location.reload();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLoadSampleData}
        disabled={loading || success}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${success 
            ? 'bg-green-600 text-white' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {success && <FiCheck className="w-4 h-4" />}
        {!loading && !success && <FiDownload className="w-4 h-4" />}
        {loading ? 'Loading...' : success ? 'Loaded!' : 'Load Sample Data'}
      </button>

      <button
        onClick={handleClearData}
        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
      >
        Clear All Data
      </button>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
          <FiAlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
