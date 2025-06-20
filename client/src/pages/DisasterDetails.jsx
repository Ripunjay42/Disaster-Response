import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getDisasterById, 
  getReportsForDisaster,
  getResourcesForDisaster,
  getSocialMediaPosts,
  getOfficialUpdates,
  createReport,
  createResource,
  verifyImage,
  updateDisaster,
  deleteDisaster
} from '../services/api';
import ResourceMap from '../components/ResourceMap';
import DisasterEditForm from '../components/DisasterEditForm';

const DisasterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin } = useAuth();
  
  const [disaster, setDisaster] = useState(null);
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Admin functionality states
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states with optimized change handling
  const [reportForm, setReportForm] = useState({ content: '', image_url: '' });
  const [resourceForm, setResourceForm] = useState({ name: '', location_name: '', type: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Load disaster data and related information
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get disaster details
        const disasterRes = await getDisasterById(id);
        setDisaster(disasterRes.data);
        
        // Get reports
        const reportsRes = await getReportsForDisaster(id);
        setReports(reportsRes.data);
        
        // Get resources
        const resourcesRes = await getResourcesForDisaster(id);
        setResources(resourcesRes.data);
        
        // Get social media posts and official updates if on those tabs
        if (activeTab === 'socialMedia') {
          const socialRes = await getSocialMediaPosts(id);
          setSocialMedia(socialRes.data);
        }
        
        if (activeTab === 'officialUpdates') {
          const updatesRes = await getOfficialUpdates(id);
          setOfficialUpdates(updatesRes.data);
        }
      } catch (err) {
        console.error('Error fetching disaster data:', err);
        setError('Failed to load disaster information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, activeTab]);
  
  // Handle tab changes with data fetching if needed
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    
    // Fetch data for tabs that haven't been loaded yet
    if (tab === 'socialMedia' && socialMedia.length === 0) {
      try {
        const socialRes = await getSocialMediaPosts(id);
        setSocialMedia(socialRes.data);
      } catch (err) {
        console.error('Error fetching social media posts:', err);
      }
    }
    
    if (tab === 'officialUpdates' && officialUpdates.length === 0) {
      try {
        const updatesRes = await getOfficialUpdates(id);
        setOfficialUpdates(updatesRes.data);
      } catch (err) {
        console.error('Error fetching official updates:', err);
      }
    }
  };
  
  // Handle report form submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportForm.content) {
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      const response = await createReport({
        disaster_id: id,
        content: reportForm.content,
        image_url: reportForm.image_url
      });
      
      // Add the new report to the list
      setReports([response.data, ...reports]);
      
      // Reset form
      setReportForm({ content: '', image_url: '' });
      
      // If image was provided, check verification
      if (reportForm.image_url) {
        try {
          const verifyRes = await verifyImage(id, reportForm.image_url);
          setVerificationResult(verifyRes.data);
        } catch (err) {
          console.error('Image verification failed:', err);
        }
      }
    } catch (err) {
      console.error('Error creating report:', err);
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle resource form submission
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    
    if (!resourceForm.name || !resourceForm.location_name || !resourceForm.type) {
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      const response = await createResource({
        disaster_id: id,
        name: resourceForm.name,
        location_name: resourceForm.location_name,
        type: resourceForm.type
      });
      
      // Add the new resource to the list
      setResources([...resources, response.data]);
      
      // Reset form
      setResourceForm({ name: '', location_name: '', type: '' });
    } catch (err) {
      console.error('Error creating resource:', err);
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle report form changes efficiently
  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle resource form changes efficiently
  const handleResourceFormChange = (e) => {
    const { name, value } = e.target;
    setResourceForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Admin functions
  const handleEditSubmit = async (updatedData) => {
    try {
      setActionLoading(true);
      await updateDisaster(id, updatedData);
      
      // Update the disaster in state
      setDisaster({ ...disaster, ...updatedData });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating disaster:', err);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDeleteDisaster = async () => {
    try {
      setActionLoading(true);
      await deleteDisaster(id);
      
      // Redirect to home page after successful deletion
      navigate('/');
    } catch (err) {
      console.error('Error deleting disaster:', err);
      setError('Failed to delete disaster');
      setDeleteModalOpen(false);
      setActionLoading(false);
    }
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
  
  // Display edit form if editing
  if (isEditing) {
    return (
      <div>
        <DisasterEditForm 
          disaster={disaster}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        {/* Admin controls */}
        {isAdmin && (
          <div className="mb-4 flex justify-end space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Edit Disaster
            </button>
            <button 
              onClick={() => setDeleteModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Delete Disaster
            </button>
          </div>
        )}
        
        <h1 className="text-3xl font-bold">{disaster.title}</h1>
        <div className="text-gray-600 mb-4">
          <span className="font-medium">Location: </span>{disaster.location_name}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="whitespace-pre-line">{disaster.description}</p>
          
          {disaster.tags && disaster.tags.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Tags:</h3>
              <div className="flex flex-wrap gap-1">
                {disaster.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b mb-6">
        <nav className="flex flex-wrap">
          <button 
            onClick={() => handleTabChange('overview')}
            className={`mr-2.5 py-1 px-1 ${
              activeTab === 'overview' 
                ? 'border-b-2 border-blue-600 font-medium text-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => handleTabChange('reports')}
            className={`mr-2.5 py-1 px-1 ${
              activeTab === 'reports' 
                ? 'border-b-2 border-blue-600 font-medium text-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            Reports
          </button>
          <button 
            onClick={() => handleTabChange('resources')}
            className={`mr-2.5 py-1 px-1 ${
              activeTab === 'resources' 
                ? 'border-b-2 border-blue-600 font-medium text-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            Resources
          </button>
          <button 
            onClick={() => handleTabChange('socialMedia')}
            className={`mr-2.5 py-1 px-1 ${
              activeTab === 'socialMedia' 
                ? 'border-b-2 border-blue-600 font-medium text-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            Social Media
          </button>
          <button 
            onClick={() => handleTabChange('officialUpdates')}
            className={`mr-2.5 py-1 px-1 ${
              activeTab === 'officialUpdates' 
                ? 'border-b-2 border-blue-600 font-medium text-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            Official Updates
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div>
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Reports Overview</h2>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="mb-2">
                    <span className="font-medium">Total reports:</span> {reports.length}
                  </p>
                  {/* More report stats could go here */}
                </div>
                
                <h2 className="text-xl font-semibold mt-6 mb-4">Resources Overview</h2>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="mb-2">
                    <span className="font-medium">Total resources:</span> {resources.length}
                  </p>
                  {/* Resource type breakdown */}
                  {resources.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Resource types:</h3>
                      <ul className="list-disc list-inside">
                        {Object.entries(
                          resources.reduce((acc, resource) => {
                            acc[resource.type] = (acc[resource.type] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([type, count]) => (
                          <li key={type}>
                            {type}: {count}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Location Map</h2>
                <div className="bg-white rounded-lg shadow p-4">
                  <ResourceMap 
                    disaster={disaster} 
                    resources={resources}
                    height="400px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reports tab */}
        {activeTab === 'reports' && (
          <div>
            {isAuthenticated && (
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4">Submit a Report</h2>
                <form onSubmit={handleReportSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Report Content *
                    </label>
                    <textarea
                      name="content"
                      value={reportForm.content}
                      onChange={handleReportFormChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      rows={3}
                      required
                      placeholder="Describe the situation..."
                    />
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
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Note: Images will be automatically verified for authenticity
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
                
                {verificationResult && (
                  <div className={`mt-4 p-4 rounded ${
                    verificationResult.verification === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : verificationResult.verification === 'fake'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <h3 className="font-bold mb-2">Image Verification Result</h3>
                    <p>Status: {verificationResult.verification}</p>
                    <p>Score: {verificationResult.score}/100</p>
                    {/* <p className="mt-2">{verificationResult.analysis}</p> */}
                  </div>
                )}
              </div>
            )}
            
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            {reports.length === 0 ? (
              <p>No reports yet. Be the first to submit a report.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                      {report.verification_status && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          report.verification_status === 'verified' 
                            ? 'bg-green-100 text-green-800' 
                            : report.verification_status === 'fake'
                            ? 'bg-red-100 text-red-800'
                            : report.verification_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.verification_status}
                        </span>
                      )}
                    </div>
                    <p className="mt-2">{report.content}</p>
                    {report.image_url && (
                      <div className="mt-3">
                        <img 
                          src={report.image_url} 
                          alt="Report" 
                          className="max-h-60 rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Resources tab */}
        {activeTab === 'resources' && (
          <div>
            {isAuthenticated && (
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4">Add a Resource</h2>
                <form onSubmit={handleResourceSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Resource Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={resourceForm.name}
                        onChange={handleResourceFormChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                        placeholder="e.g., City Memorial Hospital"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Resource Type *
                      </label>
                      <select
                        name="type"
                        value={resourceForm.type}
                        onChange={handleResourceFormChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      >
                        <option value="">Select a type</option>
                        <option value="shelter">Shelter</option>
                        <option value="medical">Medical</option>
                        <option value="food">Food</option>
                        <option value="water">Water</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location_name"
                      value={resourceForm.location_name}
                      onChange={handleResourceFormChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                      placeholder="e.g., 123 Main St, City, State"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Adding...' : 'Add Resource'}
                  </button>
                </form>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Available Resources</h2>
                {resources.length === 0 ? (
                  <p>No resources have been added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <div key={resource.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{resource.name}</h3>
                            <p className="text-gray-600">{resource.location_name}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-sm ${
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
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Resources Map</h2>
                <div className="bg-white rounded-lg shadow p-4">
                  <ResourceMap 
                    disaster={disaster} 
                    resources={resources}
                    height="500px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Social Media tab */}
        {activeTab === 'socialMedia' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Social Media Updates</h2>
            {socialMedia.length === 0 ? (
              <p>Loading social media posts...</p>
            ) : (
              <div className="space-y-4">
                {socialMedia.map((post) => (
                  <div 
                    key={post.id} 
                    className={`bg-white rounded-lg shadow p-4 ${
                      post.priority === 'high' ? 'border-l-4 border-red-500' : ''
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">@{post.username}</span>
                      <span className="text-gray-600 text-sm">
                        {new Date(post.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2">{post.content}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        post.type === 'need' ? 'bg-red-100 text-red-800' :
                        post.type === 'offer' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {post.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Official Updates tab */}
        {activeTab === 'officialUpdates' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Official Updates</h2>
            {officialUpdates.length === 0 ? (
              <p>Loading official updates...</p>
            ) : (
              <div className="space-y-4">
                {officialUpdates.map((update, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between">
                      <span className="font-bold">{update.source}</span>
                      <span className="text-gray-600 text-sm">{update.date}</span>
                    </div>
                    <h3 className="font-medium mt-2">{update.title}</h3>
                    <p className="mt-2">{update.content}</p>
                    <div className="mt-4">
                      <a 
                        href={update.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Source Link
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this disaster? This action cannot be undone.</p>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDisaster}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Disaster'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterDetails;