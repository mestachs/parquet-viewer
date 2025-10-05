import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.glify";
import type { SupersetWidgetConfig } from "./supersetModel";
import { useDuckDB } from "./DuckDBProvider";

// Fix for default icon issue with Webpack/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface MapWidgetProps {
  config: SupersetWidgetConfig;
  data: any[];
}

const GlifyLayer: React.FC<MapWidgetProps> = ({ config, data }) => {
  const map = useMap();
  const glifyLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    if (glifyLayerRef.current) {
      map.removeLayer(glifyLayerRef.current);
    }

    const latitudeColumn = config.params?.latitude;
    const longitudeColumn = config.params?.longitude;

    if (!latitudeColumn || !longitudeColumn) {
      console.error("MapWidget: latitudeColumn or longitudeColumn not provided in config.params");
      return;
    }

    const points = data.map(d => ({
      latitude: parseFloat(d[latitudeColumn]),
      longitude: parseFloat(d[longitudeColumn]),
    })).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));

    if (data.length > 0) {
      debugger
    }

    if (points.length === 0) {
      return;
    }

    glifyLayerRef.current = L.glify.points({
      map: map,
      data: points.map(p => [p.latitude, p.longitude]), // Transform to [lng, lat]
      color: 'red',
      size: 5,
      opacity: 0.7,
    }).addTo(map);

    // Optional: Fit map to points
    if (points.length > 0) {
      const latLngs = points.map(p => [p.latitude, p.longitude]);
      map.fitBounds(latLngs as L.LatLngExpression[]);
    }

    return () => {
      if (glifyLayerRef.current) {
        map.removeLayer(glifyLayerRef.current);
      }
    };
  }, [map, config, data]);

  return null;
};

export function MapWidget({ config, data }: MapWidgetProps) {
  const {tableVersion } = useDuckDB()
  return (
    <MapContainer key={"map-"+tableVersion} center={[0, 0]} zoom={2} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <GlifyLayer key={"map-"+tableVersion} config={config} data={data} />
    </MapContainer>
  );
}
