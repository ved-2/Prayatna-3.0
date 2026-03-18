"use client";

import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom icons to differentiate roles
const ambulanceIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const patientIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ lat, lng, routePointsLeg1, routePointsLeg2, patientLocation, hospitalLocation }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      // Create a LatLngBounds object to fit all relevant points
      const bounds = L.latLngBounds([lat, lng]);
      
      if (patientLocation?.lat && patientLocation?.lng) {
        bounds.extend([patientLocation.lat, patientLocation.lng]);
      }
      if (hospitalLocation?.lat && hospitalLocation?.lng) {
        bounds.extend([hospitalLocation.lat, hospitalLocation.lng]);
      }
      if (routePointsLeg1?.length > 0) {
        routePointsLeg1.forEach(p => bounds.extend(p));
      }
      if (routePointsLeg2?.length > 0) {
        routePointsLeg2.forEach(p => bounds.extend(p));
      }

      // Fit map to bounds with some padding
      map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 1.5 });
    }
  }, [lat, lng, routePointsLeg1, routePointsLeg2, patientLocation, hospitalLocation, map]);

  return null;
}

export default function LiveTrackerMap({ 
  lat, 
  lng, 
  popupText = "Ambulance",
  routePointsLeg1 = [], 
  routePointsLeg2 = [],
  patientLocation = null,
  hospitalLocation = null
}) {
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
      <MapContainer 
        center={[numericLat, numericLng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 10 }}
        zoomControl={false}
      >
        <TileLayer 
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Leg 2: Patient to Hospital (Lighter Green) */}
        {routePointsLeg2.length > 0 && (
          <Polyline 
            positions={routePointsLeg2} 
            pathOptions={{ color: "#10B981", weight: 3, dashArray: "5, 10", opacity: 0.6 }} 
          />
        )}

        {/* Leg 1: Current position to Patient or Hospital (Primary Blue) */}
        {routePointsLeg1.length > 0 && (
          <Polyline 
            positions={routePointsLeg1} 
            pathOptions={{ color: "#3B82F6", weight: 5, opacity: 0.8 }} 
          />
        )}

        {/* Ambulance Marker */}
        <Marker position={[numericLat, numericLng]} icon={ambulanceIcon}>
          <Popup>{popupText}</Popup>
        </Marker>

        {/* Patient Marker */}
        {patientLocation?.lat && patientLocation?.lng && (
          <Marker position={[patientLocation.lat, patientLocation.lng]} icon={patientIcon}>
            <Popup>Patient Location</Popup>
          </Marker>
        )}

        {/* Hospital Marker */}
        {hospitalLocation?.lat && hospitalLocation?.lng && (
          <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon}>
            <Popup>Hospital / Destination</Popup>
          </Marker>
        )}

        <MapController 
          lat={numericLat} 
          lng={numericLng} 
          routePointsLeg1={routePointsLeg1}
          routePointsLeg2={routePointsLeg2}
          patientLocation={patientLocation}
          hospitalLocation={hospitalLocation}
        />
      </MapContainer>
    </div>
  );
}
