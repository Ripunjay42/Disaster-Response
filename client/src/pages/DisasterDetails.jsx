import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getDisasterById, 
  getReportsForDisaster, 
  getResourcesForDisaster,
  getSocialMediaPosts,
  getOfficialUpdates,
  createReport,
  createResource
} from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  
  useEffect(() => {
    const fetchDisasterData = async () => {
      try {
        setLoading(true);
        
        // Fetch disaster details
        const disasterRes = await getDisasterById(id);
        setDisaster(disasterRes.data);
        
        // Fetch related data
        const [reportsRes, resourcesRes, socialRes, updatesRes] = await Promise.all([
          getReportsForDisaster(id),
          getResourcesForDisaster(id),
          getSocialMediaPosts(id),
          getOfficialUpdates(id)
        ]);
        
        setReports(reportsRes.data);
        setResources(resourcesRes.data);
        setSocialMedia(socialRes.data);
        setOfficialUpdates(updatesRes.data);
      } catch (err) {
        console.error('Error fetching disaster data:', err);
        setError('Failed to load disaster information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisasterData();
  }, [id]);
  
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.content) return;
    
    try {
      setSubmitLoading(true);
      const response = await createReport({
        disaster_id: id,
        content: reportForm.content,
        image_url: reportForm.image_url || null
      });
      
      // Add new report to the list
      setReports([response.data, ...reports]);
      setReportForm({ content: '', image_url: '' });
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resourceForm.name || !resourceForm.location_name || !resourceForm.type) return;
    
    try {
      setSubmitLoading(true);
      const response = await createResource({
        disaster_id: id,
        name: resourceForm.name,
        location_name: resourceForm.location_name,
        type: resourceForm.type
      });
      
      // Add new resource to the list
      setResources([...resources, response.data]);
      setResourceForm({ name: '', location_name: '', type: '' });
    } catch (err) {
      console.error('Error submitting resource:', err);
      alert('Failed to map resource. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle report form changes efficiently
  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };
  
  // Handle resource form changes efficiently
  const handleResourceFormChange = (e) => {
    const { name, value } = e.target;
    setResourceForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading disaster information...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }
  
  if (!disaster) {
    return <div className="text-center py-10">Disaster not found</div>;
  }

  return (
    <div>
      {/* Disaster header */}
      <div className="bg-red-600 text-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold mb-2">{disaster.title}</h1>
        <div className="flex flex-wrap gap-4">
          <p><span className="opacity-80">Location:</span> {disaster.location_name}</p>
          <p><span className="opacity-80">Created:</span> {new Date(disaster.created_at).toLocaleDateString()}</p>
        </div>
        <p className="mt-3">{disaster.description}</p>
        
        {disaster.tags && disaster.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {disaster.tags.map(tag => (
              <span key={tag} className="bg-red-700 text-white text-sm px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'resources'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resources ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Social Media
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'updates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Official Updates
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="mb-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.slice(0, 3).map(report => (
                    <div key={report.id} className="border rounded p-4">
                      <p className="mb-2">{report.content}</p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Status: {report.verification_status}</span>
                        <span>{new Date(report.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reports available yet.</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-4">Available Resources</h2>
              {resources.length > 0 ? (
                <div className="space-y-4">
                  {resources.slice(0, 3).map(resource => (
                    <div key={resource.id} className="border rounded p-4">
                      <h3 className="font-semibold">{resource.name}</h3>
                      <p className="text-gray-700">
                        Type: {resource.type}<br />
                        Location: {resource.location_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No resources mapped yet.</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div>
            {isAuthenticated && (
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Submit a Report</h2>
                <form onSubmit={handleReportSubmit}>
                  <div className="mb-3">
                    <textarea
                      className="w-full border rounded p-2"
                      rows={4}
                      placeholder="Describe what you're seeing..."
                      name="content"
                      value={reportForm.content}
                      onChange={handleReportFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="url"
                      className="w-full border rounded p-2"
                      placeholder="Image URL (optional)"
                      name="image_url"
                      value={reportForm.image_url}
                      onChange={handleReportFormChange}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>
            )}
            
            <h2 className="text-xl font-bold mb-4">All Reports</h2>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.id} className="border rounded bg-white p-4 shadow">
                    <p className="mb-2">{report.content}</p>
                    
                    {report.image_url && (
                      <div className="mb-3">
                        <img 
                          src={report.image_url} 
                          alt="Report" 
                          className="max-h-60 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x300?text=Image+Unavailable";
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        report.verification_status === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : report.verification_status === 'fake'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.verification_status}
                      </span>
                      <span>{new Date(report.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reports available yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'resources' && (
          <div>
            {isAuthenticated && (
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Map a Resource</h2>
                <form onSubmit={handleResourceSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Name
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="e.g., Community Shelter"
                        name="name"
                        value={resourceForm.name}
                        onChange={handleResourceFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Type
                      </label>
                      <select
                        className="w-full border rounded p-2"
                        name="type"
                        value={resourceForm.type}
                        onChange={handleResourceFormChange}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="shelter">Shelter</option>
                        <option value="medical">Medical</option>
                        <option value="food">Food</option>
                        <option value="water">Water</option>
                        <option value="supplies">Supplies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded p-2"
                      placeholder="Address or location name"
                      name="location_name"
                      value={resourceForm.location_name}
                      onChange={handleResourceFormChange}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Mapping...' : 'Map Resource'}
                  </button>
                </form>
              </div>
            )}
            
            <h2 className="text-xl font-bold mb-4">Available Resources</h2>
            {resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map(resource => (
                  <div key={resource.id} className="border rounded bg-white p-4 shadow">
                    <h3 className="font-semibold text-lg">{resource.name}</h3>
                    <div className="mt-2">
                      <p className="text-gray-700">
                        <span className="font-medium">Type:</span> {resource.type}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Location:</span> {resource.location_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No resources mapped yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'social' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Social Media Updates</h2>
            {socialMedia.length > 0 ? (
              <div className="space-y-4">
                {socialMedia.map(post => (
                  <div 
                    key={post.id} 
                    className={`border rounded p-4 ${
                      post.priority === 'high' ? 'bg-yellow-50 border-yellow-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">@{post.username}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(post.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mb-2">{post.content}</p>
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        post.type === 'need' 
                          ? 'text-red-600' 
                          : post.type === 'offer'
                            ? 'text-green-600'
                            : 'text-blue-600'
                      }`}>
                        {post.type === 'need' ? '⚠️ Need' : post.type === 'offer' ? '✅ Offering' : 'ℹ️ Update'}
                      </span>
                      {post.priority === 'high' && (
                        <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No social media updates available.</p>
            )}
          </div>
        )}
        
        {activeTab === 'updates' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Official Updates</h2>
            {officialUpdates.length > 0 ? (
              <div className="space-y-6">
                {officialUpdates.map((update, index) => (
                  <div key={index} className="border rounded bg-white p-4 shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{update.title}</h3>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {update.type}
                      </span>
                    </div>
                    <p className="mb-4">{update.content}</p>
                    <div className="flex justify-between items-center text-sm">
                      <a 
                        href={update.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Source: {update.source}
                      </a>
                      <span className="text-gray-500">{update.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No official updates available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisasterDetails;