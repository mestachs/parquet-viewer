import { useMemo } from "react";
import type { SupersetWidgetConfig, SupersetFilter } from "./supersetModel";
import DeckGL from "deck.gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as Layers from "@deck.gl/layers";

const INITIAL_VIEW_STATE = {
  longitude: -122.41669,
  latitude: 37.7853,
  zoom: 13,
  pitch: 0,
  bearing: 0,
};

export function MapWidget({
  config,
  data,
}: {
  config: SupersetWidgetConfig;
  filters?: SupersetFilter[];
  data: any[];
}) {
  const geojsonData = useMemo(() => {
    return data.reduce((acc, row) => {
      if (row && row.simplified_geom_geojson) {
        try {
          acc.push(JSON.parse(row.simplified_geom_geojson));
        } catch (error) {
          console.error("Error parsing GeoJSON:", error);
        }
      }
      return acc;
    }, [] as any[]);
  }, [data]);

  if (data.length === 0) {
    return <div>Map will load after initial data is loaded.</div>;
  }

  const layers = [
    new Layers.GeoJsonLayer({
      id: "geojson-layer",
      data: geojsonData,
      pickable: true,
      stroked: false,
      filled: true,
      extruded: true,
      pointType: "circle",
      lineWidthScale: 20,
      lineWidthMinPixels: 2,
      getFillColor: [160, 160, 180, 200],
      getPointRadius: 100,
      getLineWidth: 1,
      getElevation: 30,
    }),
  ];

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layers}
      getTooltip={({ object }) => {
        if (object && object.properties) {
          const nameColumn = config.params.columns?.find(col => col.column === 'org_unit_name');
          if (nameColumn) {
            return object.properties[nameColumn.label || nameColumn.column];
          }
          return object.properties.name; // Fallback if org_unit_name is not explicitly defined
        }
        return null;
      }}
    ></DeckGL>
  );
}
