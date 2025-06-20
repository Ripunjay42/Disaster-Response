import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDisasters } from '../services/api';

const Home = () => {  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tag, setTag] = useState('');
  const [debouncedTag, setDebouncedTag] = useState('');

  // Fetch disasters with optional tag filter
  const fetchDisasters = async (filterTag) => {
    try {
      setLoading(true);
      const params = filterTag ? { tag: filterTag } : {};
      const response = await getDisasters(params);
      setDisasters(response.data);
    } catch (error) {
      console.error('Error fetching disasters:', error);
      setError('Failed to load disasters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load of disasters
  useEffect(() => {    
    fetchDisasters();
  }, []);

  // Handle tag input with debounce
  const handleTagChange = (e) => {
    const value = e.target.value;
    setTag(value);
    
    // Clear any existing timeout
    if (window.tagFilterTimeout) {
      clearTimeout(window.tagFilterTimeout);
    }
    
    // Set a new timeout to update the filter after typing stops
    window.tagFilterTimeout = setTimeout(() => {
      setDebouncedTag(value);
    }, 500); // 500ms debounce
  };
  
  // Effect to filter disasters when debounced tag changes
  useEffect(() => {
    fetchDisasters(debouncedTag);
  }, [debouncedTag]);
  
  // Still keep the form handler for direct form submission (e.g., Enter key)
  const handleTagFilter = (e) => {
    e.preventDefault();
    setDebouncedTag(tag);
  };
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading disasters...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  return (
    <div>      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Active Disasters</h1>
        <form onSubmit={handleTagFilter} className="flex space-x-2">
          <input
            type="text"
            placeholder="Filter by tag (type to search)"
            value={tag}
            onChange={handleTagChange}
            className="border rounded px-3 py-1"
            aria-label="Filter disasters by tag"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          >
            Filter
          </button>
        </form>
      </div>
      
      {disasters.length === 0 ? (
        <p className="text-center py-10">No disasters found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {disasters.map((disaster) => (
            <Link 
              key={disaster.id}
              to={`/disasters/${disaster.id}`}
              className="block"
            >
              <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gray-700 text-white px-4 py-2">
                  <h2 className="text-xl font-semibold truncate">{disaster.title}</h2>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Location:</span> {disaster.location_name}
                  </p>
                  <p className="text-gray-800 mb-3 line-clamp-3">{disaster.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {disaster.tags && disaster.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;