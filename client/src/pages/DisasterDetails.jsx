import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getDisasterById, 
  getReportsForDisaster, 
  getResourcesForDisaster, 
  getSocialMediaPosts,
  getOfficialUpdates,
  createResource,
  createReport,
  verifyImage
} from '../services/api';
import ResourceMap from '../components/ResourceMap';

const DisasterDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  
  const [disaster, setDisaster] = useState(null);
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states with optimized change handling
  const [reportForm, setReportForm] = useState({ content: '', image_url: '' });
  const [resourceForm, setResourceForm] = useState({ name: '', location_name: '', type: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Load disaster data and related information
  useEffect(() => {
    const fetchDisasterDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch disaster details
        const disasterResponse = await getDisasterById(id);
        setDisaster(disasterResponse.data);
        
        // Fetch related data in parallel
        const [reportsResponse, resourcesResponse, socialResponse, updatesResponse] = await Promise.all([
          getReportsForDisaster(id),
          getResourcesForDisaster(id),
          getSocialMediaPosts(id),
          getOfficialUpdates(id)
        ]);
        
        setReports(reportsResponse.data);
        setResources(resourcesResponse.data);
        setSocialMedia(socialResponse.data);
        setOfficialUpdates(updatesResponse.data);
        
      } catch (err) {
        console.error('Error fetching disaster details:', err);
        setError('Failed to load disaster information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisasterDetails();
  }, [id]);
  
  // Handle report form submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportForm.content) {
      setError('Report content is required');
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError(null);
      
      const response = await createReport({
        disaster_id: id,
        content: reportForm.content,
        image_url: reportForm.image_url || null
      });
      
      // Add the new report to the list
      setReports(prevReports => [response.data, ...prevReports]);
      
      // Clear the form
      setReportForm({ content: '', image_url: '' });
      
      // If there's an image, verify it
      if (reportForm.image_url) {
        try {
          const verifyResponse = await verifyImage(id, reportForm.image_url, response.data.id);
          setVerificationResult(verifyResponse.data);
        } catch (verifyErr) {
          console.error('Error verifying image:', verifyErr);
        }
      }
      
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle resource form submission
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    
    if (!resourceForm.name || !resourceForm.location_name || !resourceForm.type) {
      setError('All resource fields are required');
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError(null);
      
      const response = await createResource({
        disaster_id: id,
        name: resourceForm.name,
        location_name: resourceForm.location_name,
        type: resourceForm.type
      });
      
      // Add the new resource to the list
      setResources(prevResources => [...prevResources, response.data]);
      
      // Clear the form
      setResourceForm({ name: '', location_name: '', type: '' });
      
    } catch (err) {
      console.error('Failed to add resource:', err);
      setError(err.response?.data?.error || 'Failed to add resource');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle report form changes efficiently
  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle resource form changes efficiently
  const handleResourceFormChange = (e) => {
    const { name, value } = e.target;
    setResourceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!disaster) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Disaster not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Disaster Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{disaster.title}</h1>
        <div className="flex items-center text-gray-600 mb-4">
          <span className="mr-4">Location: {disaster.location_name}</span>
          <span>Created: {new Date(disaster.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-lg">{disaster.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {disaster.tags && disaster.tags.map((tag) => (
            <span 
              key={tag} 
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'resources' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'updates' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Updates
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Social Media Updates</h2>
              {socialMedia.length === 0 ? (
                <p className="text-gray-500">No social media updates available</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {socialMedia.map((post) => (
                    <div 
                      key={post.id} 
                      className={`p-4 rounded-lg border ${
                        post.priority === 'high' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">@{post.username}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-2">{post.content}</p>
                      {post.priority === 'high' && (
                        <div className="mt-2 text-sm text-red-600">High Priority</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Official Updates</h2>
              {officialUpdates.length === 0 ? (
                <p className="text-gray-500">No official updates available</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {officialUpdates.map((update, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{update.source}</span>
                        <span className="text-sm text-gray-500">{update.date}</span>
                      </div>
                      <h3 className="font-medium mt-1">{update.title}</h3>
                      <p className="mt-2 text-sm">{update.content}</p>
                      {update.source_url && (
                        <a 
                          href={update.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 text-blue-600 hover:underline text-sm inline-block"
                        >
                          Source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Available Resources</h2>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                  {resources.length} Total
                </span>
              </div>
              
              {/* Resource Map */}
              <div className="mb-6">
                <ResourceMap 
                  resources={resources} 
                  disaster={disaster} 
                  height="500px" 
                />
              </div>
              
              {/* Resource List */}
              {resources.length === 0 ? (
                <p className="text-gray-500">No resources available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <h3 className="font-medium text-lg">{resource.name}</h3>
                      <p className="text-gray-600 mt-1">{resource.location_name}</p>
                      <div className="mt-2 flex items-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          resource.type === 'shelter' ? 'bg-green-100 text-green-800' :
                          resource.type === 'medical' ? 'bg-red-100 text-red-800' :
                          resource.type === 'food' ? 'bg-amber-100 text-amber-800' :
                          resource.type === 'water' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {resource.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Add Resource Form */}
            {isAuthenticated && (
              <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Add a Resource</h3>
                {error && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                  </div>
                )}
                <form onSubmit={handleResourceSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={resourceForm.name}
                        onChange={handleResourceFormChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        name="location_name"
                        value={resourceForm.location_name}
                        onChange={handleResourceFormChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={resourceForm.type}
                      onChange={handleResourceFormChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="shelter">Shelter</option>
                      <option value="medical">Medical</option>
                      <option value="food">Food</option>
                      <option value="water">Water</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={submitLoading}
                    >
                      {submitLoading ? 'Adding...' : 'Add Resource'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Community Reports</h2>
            
            {/* Add Report Form */}
            {isAuthenticated && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Add a Report</h3>
                {error && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                  </div>
                )}
                <form onSubmit={handleReportSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Content *
                    </label>
                    <textarea
                      name="content"
                      value={reportForm.content}
                      onChange={handleReportFormChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={reportForm.image_url}
                      onChange={handleReportFormChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Images will be verified for authenticity
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={submitLoading}
                    >
                      {submitLoading ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
                
                {/* Verification Result */}
                {/* {verificationResult && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    verificationResult.verification === 'verified' ? 'bg-green-50 border border-green-200' : 
                    verificationResult.verification === 'fake' ? 'bg-red-50 border border-red-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <h4 className="font-medium mb-2">Image Verification Result</h4>
                    <div className="flex items-center gap-2">
                      <span>Verification status:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        verificationResult.verification === 'verified' ? 'bg-green-100 text-green-800' : 
                        verificationResult.verification === 'fake' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {verificationResult.verification === 'verified' ? 'Verified' : 
                         verificationResult.verification === 'fake' ? 'Potentially Misleading' : 
                         'Uncertain'}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{verificationResult.analysis}</p>
                  </div>
                )} */}
              </div>
            )}
            
            {/* Reports List */}
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports available</p>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div 
                    key={report.id} 
                    className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 whitespace-pre-line">{report.content}</p>
                      {report.verification_status && report.verification_status !== 'not_applicable' && (
                        <span className={`ml-4 px-2 py-0.5 rounded text-xs ${
                          report.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 
                          report.verification_status === 'fake' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.verification_status === 'verified' ? 'Verified' : 
                           report.verification_status === 'fake' ? 'Potentially Misleading' : 
                           report.verification_status}
                        </span>
                      )}
                    </div>
                    
                    {report.image_url && (
                      <div className="mt-4">
                        <img 
                          src={report.image_url} 
                          alt="Report"
                          className="rounded-lg max-h-80 object-contain bg-gray-50"
                        />
                      </div>
                    )}
                    
                    <div className="mt-4 text-sm text-gray-500">
                      Reported at {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Official Updates</h2>
            
            {officialUpdates.length === 0 ? (
              <p className="text-gray-500">No official updates available</p>
            ) : (
              <div className="space-y-6">
                {officialUpdates.map((update, index) => (
                  <div 
                    key={index} 
                    className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <h3 className="font-medium text-lg">{update.title}</h3>
                      <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          update.type === 'government' ? 'bg-purple-100 text-purple-800' : 
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {update.type}
                        </span>
                        <span className="text-gray-500 text-sm">{update.date}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p>{update.content}</p>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <span className="text-gray-600 text-sm mr-2">Source:</span>
                      {update.source_url ? (
                        <a 
                          href={update.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {update.source}
                        </a>
                      ) : (
                        <span className="text-sm">{update.source}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisasterDetails;