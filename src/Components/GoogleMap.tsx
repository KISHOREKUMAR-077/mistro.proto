import React, { useState, useEffect } from 'react';
import './GoogleMap.css';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface GoogleMapProps {
  onLocationConfirm: (location: LocationData) => void;
  onLocationReset?: () => void;
  initialLocation?: LocationData | null;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({
  onLocationConfirm,
  onLocationReset,
  initialLocation
}) => {
  // Geolocation states
  const [latitude, setLatitude] = useState<number | null>(
    initialLocation ? initialLocation.lat : null
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialLocation ? initialLocation.lng : null
  );
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(!!initialLocation);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Restore session location on load if no initialLocation is provided
  useEffect(() => {
    if (!initialLocation) {
      const savedLocation = sessionStorage.getItem('mistro_selected_location');
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation) as LocationData;
          setLatitude(parsed.lat);
          setLongitude(parsed.lng);
          // Try to extract accuracy if it was stored, or leave null
          if (parsed.address && parsed.address.includes('Accuracy:')) {
            const accMatch = parsed.address.match(/Accuracy:\s*([\d.]+)/);
            if (accMatch) setAccuracy(parseFloat(accMatch[1]));
          }
          setIsConfirmed(true);
        } catch (e) {
          console.error('Error parsing session location:', e);
        }
      }
    }
  }, [initialLocation]);

  // Request browser location permission and detect coordinates
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);
    setLatitude(null);
    setLongitude(null);
    setAccuracy(null);
    setIsConfirmed(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(acc);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied. Please allow location access to continue.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable on your device.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Please try again.');
            break;
          default:
            setGeoError('An unknown error occurred while retrieving your location.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Confirm location trigger
  const handleConfirm = () => {
    if (latitude !== null && longitude !== null) {
      const displayAccuracy = accuracy !== null ? `${accuracy.toFixed(1)}m` : 'N/A';
      const finalData = {
        lat: latitude,
        lng: longitude,
        address: `Detected Location (Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, Accuracy: ${displayAccuracy})`
      };
      setIsConfirmed(true);
      sessionStorage.setItem('mistro_selected_location', JSON.stringify(finalData));
      onLocationConfirm(finalData);
    }
  };

  // Change location trigger
  const handleChangeLocation = () => {
    setIsConfirmed(false);
    if (onLocationReset) {
      onLocationReset();
    }
  };

  // Open location in external maps
  const handleOpenLocation = () => {
    if (latitude !== null && longitude !== null) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="mistro-geolocation-wrapper">
      {/* Alert Error Box */}
      {geoError && (
        <div className="map-alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{geoError}</span>
        </div>
      )}

      {!isConfirmed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
          {latitude === null || longitude === null ? (
            /* DETECT BUTTON STATE */
            <div style={{ textAlign: 'center', padding: '30px 10px', width: '100%' }}>
              <button
                type="button"
                className="btn-detect-location"
                onClick={detectCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <>
                    <div className="btn-spinner" style={{ marginRight: '8px' }}></div>
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-crosshairs" style={{ marginRight: '8px' }}></i>
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '15px' }}>
                We will request your browser's location coordinates for accurate smart-matching.
              </p>
            </div>
          ) : (
            /* PREMIUM MISTRO LOCATION CARD */
            <div className="location-details-card glass-card">
              <div className="location-card-header">
                <i className="fas fa-map-marker-alt pin-glow"></i>
                <div>
                  <h4>📍 Location Detected</h4>
                  <p className="success-text">Your current location has been detected successfully.</p>
                </div>
              </div>

              <div className="location-coords-grid">
                <div className="coord-item">
                  <span className="coord-label">Latitude</span>
                  <strong className="coord-value">{latitude.toFixed(6)}</strong>
                </div>
                <div className="coord-item">
                  <span className="coord-label">Longitude</span>
                  <strong className="coord-value">{longitude.toFixed(6)}</strong>
                </div>
                <div className="coord-item">
                  <span className="coord-label">Accuracy</span>
                  <strong className="coord-value">{accuracy !== null ? `${accuracy.toFixed(1)} meters` : 'N/A'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-open-maps"
                  onClick={handleOpenLocation}
                >
                  <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i>
                  <span>📍 Open Location</span>
                </button>
                <button
                  type="button"
                  className="btn-confirm-location"
                  style={{ flex: 1, margin: 0 }}
                  onClick={handleConfirm}
                >
                  ✓ Confirm Location
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '5px' }}>
                <button
                  type="button"
                  className="btn-re-detect"
                  onClick={detectCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? 'Detecting...' : 'Redetect Location'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CONFIRMED STATE */
        <div className="map-confirmed-card glass-card">
          <div className="confirmed-header">
            <div className="success-badge">✓</div>
            <div>
              <h3>Location Confirmed</h3>
              <p className="confirmed-address">
                Your coordinates are locked and stored.
              </p>
            </div>
          </div>
          <div className="confirmed-details">
            <div>
              <span>Latitude</span>
              <strong>{latitude ? latitude.toFixed(6) : 'N/A'}</strong>
            </div>
            <div>
              <span>Longitude</span>
              <strong>{longitude ? longitude.toFixed(6) : 'N/A'}</strong>
            </div>
            {accuracy !== null && (
              <div>
                <span>Accuracy</span>
                <strong>{accuracy.toFixed(1)}m</strong>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn-change-location"
            onClick={handleChangeLocation}
          >
            Change Location
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
