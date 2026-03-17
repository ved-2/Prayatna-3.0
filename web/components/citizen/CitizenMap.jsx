"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, PlusSquare } from "lucide-react";
import { renderToString } from "react-dom/server";

// We use custom HTML divs for markers instead of static icons so we can use Lucide React icons
const createCustomIcon = (iconString, iconColorClass, bgColorClass, size = 40) => {
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        border: 2px solid white;
      " class="${bgColorClass} ${iconColorClass}">
        ${iconString}
      </div>
    `,
    className: "custom-leaflet-icon", // Prevents default square white background applied by Leaflet
    iconSize: [size, size],
    iconAnchor: [size / 2, size], // Anchor at bottom center of the circle
    popupAnchor: [0, -size], // Open popup directly above the circle
  });
};

function MapBoundsController({ userLocation, hospitals }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Create an array of all LatLngs we want to fit in the viewport
    const points = [];
    
    // 1. Add User Location
    if (userLocation?.lat && userLocation?.lng) {
      points.push([userLocation.lat, userLocation.lng]);
    }
    
    // 2. Add Hospital Locations
    hospitals.forEach(hosp => {
       // Check for valid lat/lng. You might store these differently in Firestore (e.g. nested object or Geopoint)
      if (hosp?.gpsLat && hosp?.gpsLng) {
        points.push([hosp.gpsLat, hosp.gpsLng]);
      } else if (hosp.location?.latitude && hosp.location?.longitude) { // Handle GeoPoint format
         points.push([hosp.location.latitude, hosp.location.longitude]);
      }
    });

    // If we have points to display, calculate bounds and snap map to fit them perfectly
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      // Pad by 10% so markers aren't mashed right against the edge of the iframe
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, userLocation, hospitals]);

  return null;
}

export default function CitizenMap({ hospitals = [], userLocation = { lat: 22.7196, lng: 75.8577 } }) {
  
  // Convert React Component to html string once so Leaflet can render it dynamically inside the map canvas
  const hospitalIconHtml = renderToString(<PlusSquare size={20} fill="currentColor" stroke="white" />);
  const hospitalMarkerIcon = createCustomIcon(hospitalIconHtml, "text-blue-600", "bg-blue-100");

  const userIconHtml = renderToString(<MapPin size={24} stroke="white" />);
  const userMarkerIcon = createCustomIcon(userIconHtml, "text-white", "bg-emerald-500 animate-pulse", 48);

  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-sm border border-slate-200 z-0 relative isolate">
      <MapContainer 
        center={[userLocation.lat, userLocation.lng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 10 }}
        zoomControl={false}
      >
        <TileLayer 
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Dynamic Bounds controller */}
        <MapBoundsController userLocation={userLocation} hospitals={hospitals} />

        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
           <Popup className="font-sans">
              <div className="text-center p-1">
                 <p className="font-bold text-slate-800 text-sm">You are here</p>
                 <p className="text-xs text-slate-500 font-medium">110, Manglaya Sadak</p>
              </div>
           </Popup>
        </Marker>

        {/* Hospital Markers */}
        {hospitals.map((hosp, i) => {
            // Support flat lat/lng or firebase GeoPoint
            const lat = hosp?.gpsLat || hosp.location?.latitude;
            const lng = hosp?.gpsLng || hosp.location?.longitude;
            
            // Skip rendering if no coordinates exist for this hospital record
            if (!lat || !lng) return null;

            return (
              <Marker key={hosp.id || i} position={[lat, lng]} icon={hospitalMarkerIcon}>
                <Popup className="font-sans min-w-[200px]">
                  <div className="p-1">
                    <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">{hosp.hospitalName || hosp.name}</h4>
                    <p className="text-xs text-slate-500 mb-2 truncate">{hosp.address || "Local District"}</p>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-700">ICU Available</span>
                       <span className="text-sm font-black text-blue-600">{hosp.beds?.icu?.available || 0}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
        })}
        
      </MapContainer>
    </div>
  );
}
