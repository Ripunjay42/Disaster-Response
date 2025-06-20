import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDisaster, geocodeLocation } from '../services/api';

const CreateDisaster = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
    description: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractingLocation, setExtractingLocation] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const extractLocation = async () => {
    if (!formData.description) {
      setError('Please provide a description first');
      return;
    }
    
    try {
      setExtractingLocation(true);
      setError(null);
      
      const response = await geocodeLocation(formData.description);
      
      setFormData({
        ...formData,
        location_name: response.data.location_name
      });
    } catch (err) {
      console.error('Failed to extract location:', err);
      setError('Failed to extract location from description. Please enter it manually.');
    } finally {
      setExtractingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location_name || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Process tags into array
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      const response = await createDisaster({
        title: formData.title,
        location_name: formData.location_name,
        description: formData.description,
        tags: tagsArray
      });
      
      // Navigate to the newly created disaster
      navigate(`/disasters/${response.data.id}`);
    } catch (err) {
      console.error('Failed to create disaster:', err);
      setError(err.response?.data?.error || 'Failed to create disaster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create New Disaster</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., Hurricane Florence"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows={4}
            placeholder="Describe the disaster in detail"
            required
          />
          <button
            type="button"
            onClick={extractLocation}
            className="mt-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm disabled:opacity-50"
            disabled={extractingLocation || !formData.description}
          >
            {extractingLocation ? 'Extracting...' : 'Extract Location from Description'}
          </button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="location_name" className="block text-gray-700 text-sm font-bold mb-2">
            Location *
          </label>
          <input
            type="text"
            id="location_name"
            name="location_name"
            value={formData.location_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., Miami, FL"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., flood, hurricane, emergency"
          />
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Disaster'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDisaster;