// components/shop/MapPicker.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
// Import CSS directly
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

// --- LEAFLET ICON FIX (CRITICAL FOR NEXT.JS/WEBPACK) ---
// This ensures marker icons display correctly.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
// --------------------------------------------------------

// --- Configuration for Rwanda ---
const RWANDA_CENTER: [number, number] = [-1.9403, 30.0594]; // Kigali Center (Lat, Lng)

// Approximate Bounds for Rwanda
const RWANDA_BOUNDS: L.LatLngBoundsExpression = [
  [-2.8, 28.8], // SW (South, West)
  [-1.0, 31.0], // NE (North, East)
];
const rwandaBoundsInstance = L.latLngBounds(RWANDA_BOUNDS);

interface MapPickerProps {
  onLocationChange: (lat: number | null, lng: number | null) => void;
  initialPosition?: { lat: number; lng: number };
}

const containerStyle = {
  width: "100%",
  height: "400px",
  zIndex: 0,
};

// =========================================================================
// 1. SearchControl Component (Handles Geocoding Search Box with Dynamic Import)
// =========================================================================
const SearchControl: React.FC<{
  onLocationFound: (latlng: L.LatLng) => void;
}> = ({ onLocationFound }) => {
  const map = useMap();

  // Use useCallback to prevent unnecessary re-creation of the handler function
  const handleMarkGeocode = useCallback(
    (e: any) => {
      const latlng = e.geocode.center as L.LatLng;

      // Check if the search result is within Rwanda's bounds
      if (rwandaBoundsInstance.contains(latlng)) {
        onLocationFound(latlng);

        // Fit the map to the result's bounding box
        map.fitBounds(e.geocode.bbox as L.LatLngBoundsExpression, {
          padding: [20, 20],
          maxZoom: 15,
        });
      } else {
        alert("The search result is outside Rwanda's restricted area.");
      }
    },
    [map, onLocationFound]
  );

  useEffect(() => {
    // 💡 Dynamic Import Fix: Import the plugin only in the browser environment
    // This avoids the 'Module not found' error during SSR.
    if (typeof window !== "undefined" && L.Control.Geocoder) {
      const geocoder = L.Control.Geocoder.nominatim();

      const control = L.Control.geocoder({
        geocoder: geocoder,
        defaultMarkGeocode: false,
        placeholder: "Search for a location in Rwanda...",
        collapsed: true,
      }).addTo(map);

      // Attach the markgeocode event handler
      control.on("markgeocode", handleMarkGeocode);

      // Cleanup
      return () => {
        control.off("markgeocode", handleMarkGeocode);
        map.removeControl(control);
      };
    }
  }, [map, handleMarkGeocode]);

  return null;
};

// =========================================================================
// 2. LocationHandler Component (Manages Marker, Clicks, and Current Location)
// =========================================================================
const LocationHandler: React.FC<
  MapPickerProps & {
    handleLocationFound: (latlng: L.LatLng) => void;
  }
> = ({ onLocationChange, initialPosition, handleLocationFound }) => {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLngLiteral | null>(
    initialPosition || null
  );

  // Function to update local state and external form state
  const updatePosition = useCallback(
    (latlng: L.LatLng) => {
      setPosition(latlng);
      onLocationChange(latlng.lat, latlng.lng);
    },
    [onLocationChange]
  );

  // Handle Map Clicks to Pick Location
  useMapEvents({
    click: (e) => {
      const newPos = e.latlng;
      updatePosition(newPos);
    },

    // Handle Geolocation Success Event (Fired by map.locate())
    locationfound: (e) => {
      const newPos = e.latlng;

      if (rwandaBoundsInstance.contains(newPos)) {
        updatePosition(newPos);
        map.setView(newPos, 15);
      } else {
        alert(
          "Your current GPS location is outside Rwanda's boundaries. Please select a location manually."
        );
      }
    },
    locationerror: (e) => {
      alert(`Geolocation failed: ${e.message}`);
    },
  });

  // Handle Initial/External Position Update
  useEffect(() => {
    if (initialPosition) {
      const { lat, lng } = initialPosition;
      const initialLatLng = L.latLng(lat, lng);
      setPosition(initialLatLng);

      if (rwandaBoundsInstance.contains(initialLatLng)) {
        map.setView(initialLatLng, 13);
      }
    }
  }, [initialPosition, map]);

  // Current Location Button Logic
  const handleCurrentLocation = () => {
    map.locate({ setView: false, maxZoom: 15 });
  };

  // Update state when location is found via search (or any other external source)
  useEffect(() => {
    if (position) {
      handleLocationFound(position);
    }
  }, [position, handleLocationFound]);

  return (
    <>
      {/* Marker for Selected Location */}
      {position && (
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const newPos = e.target.getLatLng();
              if (rwandaBoundsInstance.contains(newPos)) {
                updatePosition(newPos);
              } else {
                alert("Cannot place marker outside Rwanda's boundaries.");
                e.target.setLatLng(position); // Revert
              }
            },
          }}
        />
      )}

      {/* Current Location Button Control */}
      <div
        className="leaflet-control leaflet-bar absolute bottom-5 right-5 z-[1000]"
        style={{ zIndex: 1000 }}>
        <button
          onClick={handleCurrentLocation}
          className="bg-white p-2 rounded-full shadow-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          title="Use my current GPS location">
          {/* SVG icon for location */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-locate-fixed">
            <line x1="2" x2="5" y1="12" y2="12"></line>
            <line x1="19" x2="22" y1="12" y2="12"></line>
            <line x1="12" x2="12" y1="2" y2="5"></line>
            <line x1="12" x2="12" y1="19" y2="22"></line>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
        </button>
      </div>
    </>
  );
};

// =========================================================================
// 3. Main MapPicker Component (Map Container)
// =========================================================================
const MapPicker: React.FC<MapPickerProps> = ({
  onLocationChange,
  initialPosition,
}) => {
  // Centralized function to handle all location updates from child components
  const handleLocationFound = useCallback(
    (latlng: L.LatLng) => {
      onLocationChange(latlng.lat, latlng.lng);
    },
    [onLocationChange]
  );

  return (
    <MapContainer
      center={RWANDA_CENTER}
      zoom={9}
      scrollWheelZoom={true}
      style={containerStyle}
      maxBounds={RWANDA_BOUNDS}
      minZoom={8}
      maxBoundsViscosity={1.0}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Add the Search Control */}
      <SearchControl onLocationFound={handleLocationFound} />

      {/* Manages marker, clicks, and current location button */}
      <LocationHandler
        onLocationChange={onLocationChange}
        initialPosition={initialPosition}
        handleLocationFound={handleLocationFound}
      />
    </MapContainer>
  );
};

export default React.memo(MapPicker);
