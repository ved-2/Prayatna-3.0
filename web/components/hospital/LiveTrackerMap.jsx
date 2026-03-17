"use client";

import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js/Leaflet
// Using explicitly hosted icons avoids Next.js webpack require() issues during dynamic loading
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle imperative updates to the map AND the marker
function MapController({ lat, lng, popupText }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (lat && lng) {
      // 1. Pan the map smoothly
      map.flyTo([lat, lng], map.getZoom(), {
        animate: true,
        duration: 1.5
      });

      // 2. Manage the marker imperatively
      if (!markerRef.current) {
        // Create marker if it doesn't exist
        markerRef.current = L.marker([lat, lng]).addTo(map);
        if (popupText) {
          markerRef.current.bindPopup(popupText);
        }
      } else {
        // Move existing marker
        markerRef.current.setLatLng([lat, lng]);
        if (popupText) {
          markerRef.current.setPopupContent(popupText);
        }
      }
    }

    // Cleanup when component unmounts
    return () => {
      if (markerRef.current && map) {
        // Only remove if the map hasn't been destroyed yet
        // A try-catch prevents errors during hot reloads
        try {
          map.removeLayer(markerRef.current);
        } catch (e) {}
        markerRef.current = null;
      }
    };
  }, [lat, lng, map, popupText]);

  return null;
}

export default function LiveTrackerMap({ lat, lng, popupText = "Ambulance Location" }) {
  // Ensure we are working with pure numbers
  const numericLat = Number(lat);
  const numericLng = Number(lng);

  if (!numericLat || !numericLng || isNaN(numericLat) || isNaN(numericLng)) {
    return (
      <div className="flex items-center justify-center font-bold text-slate-400 bg-slate-100 h-full w-full">
        Waiting for GPS...
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", zIndex: 0 }}>
      {/* We purposefully omit a changing 'key' on MapContainer to prevent it from destroying itself */}
      <MapContainer 
        center={[numericLat, numericLng]} 
        zoom={15} 
        style={{ height: "100%", width: "100%", zIndex: 10 }} // z-index lower than Nextjs nav
        zoomControl={false}
      >
        <TileLayer 
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* This invisible component creates the marker, updates its position directly, and pans the map */}
        <MapController lat={numericLat} lng={numericLng} popupText={popupText} />
      </MapContainer>
    </div>
  );
}
