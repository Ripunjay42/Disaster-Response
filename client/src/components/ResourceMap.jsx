import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const ResourceMap = ({ resources, disaster, height = "500px" }) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [resourceMarkers, setResourceMarkers] = useState([]);
  const [disasterMarker, setDisasterMarker] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return;

    // Get API key from .env file (Vite prepends with VITE_)
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    // Set default location if disaster location not available
    const defaultLocation = [78.9629, 20.5937]; // Center of India
    
    // Create map instance
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: defaultLocation,
      zoom: 4
    });

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    return () => {
      // Clean up on unmount
      mapInstance.remove();
    };
  }, []);

  // Add disaster marker when disaster changes
  useEffect(() => {
    if (!map || !disaster) return;
    
    // Remove existing disaster marker
    if (disasterMarker) {
      disasterMarker.remove();
    }

    // Extract location from disaster object if exists
    if (disaster && disaster.location && disaster.location.coordinates) {
      try {
        const [longitude, latitude] = disaster.location.coordinates;
        
        // Create a popup for the disaster
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3 class="font-bold text-lg">${disaster.title}</h3>
            <p>${disaster.location_name}</p>
          `);

        // Create a disaster marker with a distinctive style
        const marker = new mapboxgl.Marker({
          color: '#DC2626', // red color for disaster
          scale: 1.2
        })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map);

        setDisasterMarker(marker);

        // Center map on disaster location
        map.flyTo({
          center: [longitude, latitude],
          zoom: 10,
          essential: true
        });
      } catch (error) {
        console.error('Error adding disaster marker:', error);
      }
    }
  }, [map, disaster]);

  // Add resource markers when resources or map changes
  useEffect(() => {
    if (!map || !resources || resources.length === 0) return;
    
    // Remove existing resource markers
    resourceMarkers.forEach(marker => marker.remove());
    
    // Create new markers for each resource
    const newMarkers = resources.map(resource => {
      if (!resource.location || !resource.location.coordinates) return null;

      try {
        const [longitude, latitude] = resource.location.coordinates;
        
        // Get color based on resource type
        let color = '#3B82F6'; // default blue
        if (resource.type === 'shelter') color = '#10B981'; // green for shelter
        if (resource.type === 'medical') color = '#EF4444'; // red for medical
        if (resource.type === 'food') color = '#F59E0B'; // amber for food
        if (resource.type === 'water') color = '#3B82F6'; // blue for water

        // Create a popup for the resource with more info
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div>
              <h3 class="font-bold">${resource.name}</h3>
              <p class="text-gray-600">${resource.location_name}</p>
              <p class="mt-2"><span class="font-semibold">Type:</span> ${resource.type}</p>
            </div>
          `);

        // Create the marker and add to map
        const marker = new mapboxgl.Marker({ color })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map);

        marker.getElement().addEventListener('click', () => {
          setSelectedResource(resource);
        });

        return marker;
      } catch (error) {
        console.error('Error adding resource marker:', error);
        return null;
      }
    }).filter(Boolean); // Remove any null markers
    
    setResourceMarkers(newMarkers);
    
    // Fit map to show all markers including disaster if available
    if (newMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      // Add resource markers to bounds
      newMarkers.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      // Add disaster marker to bounds if available
      if (disasterMarker) {
        bounds.extend(disasterMarker.getLngLat());
      }
      
      // Fit map to bounds with padding
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [map, resources]);

  // Filter resources by type
  const filterResources = (type) => {
    resourceMarkers.forEach((marker, i) => {
      if (resources[i] && resources[i].type === type) {
        marker.getElement().style.display = 'block';
      } else if (type === 'all') {
        marker.getElement().style.display = 'block';
      } else {
        marker.getElement().style.display = 'none';
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex flex-wrap gap-2">
        <button 
          onClick={() => filterResources('all')}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-sm"
        >
          All Resources
        </button>
        <button 
          onClick={() => filterResources('shelter')}
          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-full text-sm"
        >
          Shelters
        </button>
        <button 
          onClick={() => filterResources('medical')}
          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-full text-sm"
        >
          Medical
        </button>
        <button 
          onClick={() => filterResources('food')}
          className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full text-sm"
        >
          Food
        </button>
        <button 
          onClick={() => filterResources('water')}
          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm"
        >
          Water
        </button>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg border border-gray-300 shadow-sm" 
        style={{ height: height }}
      />
      
      {selectedResource && (
        <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{selectedResource.name}</h3>
            <button 
              onClick={() => setSelectedResource(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600">{selectedResource.location_name}</p>
          <div className="mt-2 flex items-center">
            <span className="font-semibold mr-2">Type:</span> 
            <span className={`px-2 py-0.5 rounded text-sm ${
              selectedResource.type === 'shelter' ? 'bg-green-100 text-green-800' :
              selectedResource.type === 'medical' ? 'bg-red-100 text-red-800' :
              selectedResource.type === 'food' ? 'bg-amber-100 text-amber-800' :
              selectedResource.type === 'water' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedResource.type}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceMap;