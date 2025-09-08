import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { parseStoredLocation } from '../utils/geocoding';

const LocationMap = ({ employees = [], showMap, embedded = false, onMarkerClick }) => {
  const employeeLocations = useMemo(() => {
    if (!employees?.length) return [];
    
    return employees
      .filter(emp => emp.workLocation)
      .map(emp => {
        try {
          const locationData = parseStoredLocation(emp.workLocation);
          
          if (locationData.isValid) {
            return {
              id: emp.id || emp.$id,
              name: emp.name || emp.fullName,
              employee: emp,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timestamp: locationData.timestamp || new Date().toISOString(),
              address: emp.workLocationAddress || locationData.address
            };
          }
        } catch (error) {
          console.warn('Error parsing work location for employee:', emp.name, error);
        }
        return null;
      })
      .filter(location => location !== null);
  }, [employees]);



  const getMapHtml = () => {
    let mapCenter = [33.6844, 73.0479], mapZoom = 10;
    
    if (employeeLocations.length > 0) {
      const lats = employeeLocations.map(loc => loc.latitude);
      const lngs = employeeLocations.map(loc => loc.longitude);
      mapCenter = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
      
      const maxDiff = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
      mapZoom = maxDiff < 0.01 ? 15 : maxDiff < 0.1 ? 12 : maxDiff < 1 ? 10 : 8;
    }
    
    const markers = employeeLocations.map((loc, index) => `
    var marker${index} = L.circleMarker([${loc.latitude}, ${loc.longitude}], {
  radius: 10,
  fillColor: '#007AFF',
  color: '#fff',
  weight: 4,
  opacity: 1,
  fillOpacity: 0.9
}).addTo(map);

var tooltipContent${index} = '<div style="font-family: Arial, sans-serif; padding: 4px; min-width: 140px; font-size: 11px;">' +
  '<h3 style="margin: 0 0 4px 0; color: #333; font-size: 12px; font-weight: bold;">${loc.name.replace(/'/g, "\\'")}</h3>' +
  '<div><strong>Rank:</strong> ${(loc.employee.rank || 'N/A').replace(/'/g, "\\'")}</div>' +
  '<div><strong>Dept:</strong> ${(loc.employee.department || 'N/A').replace(/'/g, "\\'")}</div>' +
  ${loc.address ? `'<div><strong>Address:</strong> ${loc.address.replace(/'/g, "\\'")}</div>' +` : ''}
  '<div><strong>Lat:</strong> ${loc.latitude.toFixed(6)}</div>' +
  '<div><strong>Lng:</strong> ${loc.longitude.toFixed(6)}</div>' +
  '<div><strong>Time:</strong> ${new Date(loc.timestamp).toLocaleString()}</div>' +
  '</div>';

marker${index}.bindTooltip(tooltipContent${index}, {
  permanent: true,
  direction: 'top',
  className: 'employee-tooltip',
  offset: [0, -14]
}).openTooltip();

      
      var clickArea${index} = L.circleMarker([${loc.latitude}, ${loc.longitude}], {
        radius: 50, fillColor: 'transparent', color: 'transparent', weight: 0, opacity: 0, fillOpacity: 0
      }).addTo(map);
      
      var popupContent${index} = '<div style="font-family: Arial, sans-serif; padding: 4px; min-width: 120px; font-size: 10px;">' +
        '<h3 style="margin: 0 0 4px 0; color: #333; font-size: 11px; font-weight: bold;">${loc.name.replace(/'/g, "\\'")}</h3>' +
        '<div style="margin-bottom: 2px;"><strong>Rank:</strong> ${(loc.employee.rank || 'N/A').replace(/'/g, "\\'")}</div>' +
        '<div style="margin-bottom: 2px;"><strong>Dept:</strong> ${(loc.employee.department || 'N/A').replace(/'/g, "\\'")}</div>' +
        ${loc.address ? `'<div style="margin-bottom: 2px;"><strong>Address:</strong> ${loc.address.replace(/'/g, "\\'")}</div>' +` : ''}
        '<div style="margin-bottom: 2px;"><strong>Lat:</strong> ${loc.latitude.toFixed(6)}</div>' +
        '<div style="margin-bottom: 2px;"><strong>Lng:</strong> ${loc.longitude.toFixed(6)}</div>' +
        '<div style="margin-bottom: 2px;"><strong>Time:</strong> ${new Date(loc.timestamp).toLocaleString()}</div>' +
        '</div>';
      
      
      allMarkers.push(marker${index});
      markerData.push({ index: ${index}, lat: ${loc.latitude}, lng: ${loc.longitude}, name: '${loc.name.replace(/'/g, "\\'")}', rank: '${(loc.employee.rank || 'N/A').replace(/'/g, "\\'")}', department: '${(loc.employee.department || 'N/A').replace(/'/g, "\\'")}', timestamp: '${loc.timestamp.replace(/'/g, "\\'")}' });
      markerReferences[${index}] = marker${index};
      
      [marker${index}, clickArea${index}].forEach(marker => marker.on('click', function() {
        marker${index}.setStyle({ fillColor: '#FF4444', color: '#fff', fillOpacity: 0.9 });
        setTimeout(() => marker${index}.setStyle({ fillColor: '#007AFF', color: '#fff', fillOpacity: 0.9 }), 2000);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', employee: { name: '${loc.name.replace(/'/g, "\\'")}', rank: '${(loc.employee.rank || 'N/A').replace(/'/g, "\\'")}', department: '${(loc.employee.department || 'N/A').replace(/'/g, "\\'")}', latitude: ${loc.latitude}, longitude: ${loc.longitude}, timestamp: '${loc.timestamp.replace(/'/g, "\\'")}' } }));
      }));
    `).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Locations</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; height: 100%; width: 100%; overflow: hidden; }
          #map { height: 100vh; width: 100vw; margin: 0; padding: 0; }

          .employee-popup .leaflet-popup-content-wrapper { background: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); font-size: 10px; padding: 4px; }
          .employee-popup .leaflet-popup-tip { background: #fff; }
          .employee-popup .leaflet-popup-close-button { color: #666; font-size: 14px; font-weight: bold; padding: 2px; }
          .employee-popup .leaflet-popup-content { margin: 4px; font-size: 10px; line-height: 1.2; }
          .custom-popup { background: transparent !important; border: none !important; }
          .custom-popup div { background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); padding: 4px; font-size: 10px; min-width: 120px; white-space: nowrap; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${mapCenter[0]}, ${mapCenter[1]}], ${mapZoom});
          var allMarkers = [], markerData = [], markerReferences = [];
          
          map.on('popupopen', function(e) {});
          map.closePopup = function(popup) { return this; };
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
          
          // Disable zoom controls
          map.zoomControl.remove();
          
          ${markers}
          
          [map.on('click', handleMapClick), map.on('mousedown', handleMapClick), map.on('touchstart', handleMapClick)];
          
          function handleMapClick(e) {
            var clickLat = e.latlng.lat, clickLng = e.latlng.lng;
            markerData.forEach(function(marker) {
              var latDiff = Math.abs(clickLat - marker.lat), lngDiff = Math.abs(clickLng - marker.lng);
              var distanceInMeters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;
              if (distanceInMeters <= 1000 && markerReferences[marker.index]) {
                markerReferences[marker.index].setStyle({ fillColor: '#FF4444', color: '#fff', fillOpacity: 0.9 });
                setTimeout(() => markerReferences[marker.index].setStyle({ fillColor: '#007AFF', color: '#fff', fillOpacity: 0.9 }), 2000);
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', employee: { name: marker.name, rank: marker.rank, department: marker.department, latitude: marker.lat, longitude: marker.lng, timestamp: marker.timestamp } }));
              }
            });
          }
          

          
         
        </script>
      </body>
      </html>
    `;
  };

  const mapHtml = useMemo(() => getMapHtml(), [employeeLocations]);

  if (!showMap) return null;

  return (
    <View style={[
      styles.container,
      {
        position: embedded ? 'relative' : 'absolute',
        top: embedded ? 0 : 0,
        left: embedded ? 0 : 0,
        right: embedded ? 0 : 0,
        bottom: embedded ? 0 : 0,
        zIndex: embedded ? 1 : 9999,
        flex: embedded ? 1 : undefined,
      }
    ]}>
      <View style={[
        styles.mapSection,
        {
          height: embedded ? '100%' : '100%',
          flex: embedded ? 1 : undefined,
        }
      ]}>
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onShouldStartLoadWithRequest={() => true}
            onLoadStart={() => console.log('WebView loading started')}
            onLoadEnd={() => console.log('WebView loading finished')}
            onError={(error) => console.error('WebView error:', error)}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'marker_click') console.log('Marker clicked:', data.employee);
              } catch (error) {
                console.warn('Error parsing WebView message:', error);
              }
            }}
          />
        </View>
        

        

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: '#fff', 
  },
  mapSection: { 
    width: '100%', 
    position: 'relative', 
    backgroundColor: '#fff',
  },
  mapContainer: { flex: 1, position: 'relative', backgroundColor: '#fff' },
  map: { flex: 1, backgroundColor: '#fff' },
});

export default LocationMap;
