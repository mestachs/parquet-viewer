import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.glify";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { SupersetFilter, SupersetWidgetConfig } from "./supersetModel";
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
  filters: SupersetFilter[];
  data: any[];
}

function fromHex(hex) {
  if (hex.length < 6) return null;
  hex = hex.toLowerCase();

  if (hex[0] === "#") {
    hex = hex.substring(1, hex.length);
  }

  var r = parseInt(hex[0] + hex[1], 16),
    g = parseInt(hex[2] + hex[3], 16),
    b = parseInt(hex[4] + hex[5], 16);
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
  };
}

const GlifyLayer: React.FC<MapWidgetProps> = ({ config, data, filters }) => {
  const map = useMap();
  const glifyLayerRef = useRef<any>(null);

  useEffect(() => {
    console.log("GlifyLayer useEffect triggered, data changed:", data.length);
    if (!map) return;

    const latitudeColumn = config.params?.latitude;
    const longitudeColumn = config.params?.longitude;

    if (!latitudeColumn || !longitudeColumn) {
      console.error(
        "MapWidget: latitudeColumn or longitudeColumn not provided in config.params"
      );
      return;
    }

    const points = data
      .map((d) => ({
        latitude: parseFloat(d[latitudeColumn]),
        longitude: parseFloat(d[longitudeColumn]),
      }))
      .filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));

    if (points.length === 0) {
      return;
    }

    glifyLayerRef.current = L.glify
      .points({
        map: map,
        data: points.map((p) => [p.latitude, p.longitude]), // Transform to [lng, lat]
        color: fromHex("#000000"),
        size: 5,
        opacity: 0.7,
      })
      .addTo(map);

    // Optional: Fit map to points
    if (points.length > 0) {
      const latLngs = points.map((p) => [p.latitude, p.longitude]);
      map.fitBounds(latLngs as L.LatLngExpression[]);
    }

    return () => {
      if (glifyLayerRef.current) {
        console.log("Cleanup: removing glifyLayerRef", glifyLayerRef.current);
        map.removeLayer(glifyLayerRef.current);
        glifyLayerRef.current = null; // Clear the ref after removal
      }
    };
  }, [map, config, filters, data]);

  return null;
};

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const GeoJsonLayer: React.FC<Pick<MapWidgetProps, "data">> = ({
  data,
  config,
}) => {
  const map = useMap();
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  useEffect(() => {
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonFeatures: GeoJSON.Feature[] = [];
    data.forEach((d) => {
      if (d.org_unit_simplified_geom_geojson) {
        try {
          const geoJson = JSON.parse(d.org_unit_simplified_geom_geojson);

          if (geoJson.type === "FeatureCollection") {
            geoJsonFeatures.push(...geoJson.features);
          } else if (geoJson.type === "Feature") {
            geoJsonFeatures.push(geoJson);
          } else if (geoJson.geometry) {
            // Handle bare geometries
            geoJsonFeatures.push({
              type: "Feature",
              properties: d, // Pass all data properties as GeoJSON properties
              geometry: geoJson,
            });
          } else {
            geoJsonFeatures.push(geoJson);
            geoJson.properties = {};
            for (let col of config.params.columns) {
              if (col.label != "org_unit_simplified_geom_geojson") {
                geoJson.properties[col.label] = d[col.label];
              }
            }
          }
        } catch (e) {
          console.error("Error parsing GeoJSON:", e);
        }
      }
    });

    if (geoJsonFeatures.length > 0) {
      geoJsonLayerRef.current = L.geoJSON(geoJsonFeatures, {
        style: (feature) => {
          const randomColor = getRandomColor();
          return {
            color: randomColor,
            weight: 2,
            opacity: 0.7,
            fillColor: randomColor,
            fillOpacity: 0.3,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<table>";
            for (const key in feature.properties) {
              if (feature.properties[key] != null) {
                popupContent += `<tr><td><b>${key}:</b></td><td>${JSON.stringify(
                  feature.properties[key]
                )}</td></tr>`;
              }
            }
            popupContent += "</table>";
            layer.bindPopup(popupContent);
          }
        },
      }).addTo(map);

      // Fit bounds to the GeoJSON layer
      map.fitBounds(geoJsonLayerRef.current.getBounds());
    }

    return () => {
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
      }
    };
  }, [map, data]);

  return null;
};

export function MapWidget({ config, data, filters }: MapWidgetProps) {
  const { tableVersion } = useDuckDB();
  return (
    <div>
      <h2 className="mt-4">{config.label}</h2>
      <MapContainer
        key={"map-" + tableVersion}
        center={[0, 0]}
        zoom={2}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <GlifyLayer
          key={"map-" + tableVersion}
          config={config}
          data={data}
          filters={filters}
        />
        <GeoJsonLayer
          key={"geojson-" + tableVersion}
          config={config}
          data={data}
        />
      </MapContainer>
    </div>
  );
}
