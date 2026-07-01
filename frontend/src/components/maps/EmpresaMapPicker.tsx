import { useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import { welvePinIcon } from "./leafletIcons";

const LIMA: [number, number] = [-12.0464, -77.0428];

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function EmpresaMapPicker({ lat, lng, onChange }: Props) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const hasLocation = lat !== null && lng !== null;
  const center: [number, number] = hasLocation ? [lat!, lng!] : LIMA;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer center={center} zoom={hasLocation ? 16 : 12} style={{ height: 260, width: "100%" }} className="welve-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasLocation && (
          <Marker
            position={center}
            draggable
            ref={markerRef}
            icon={welvePinIcon}
            eventHandlers={{
              dragend: () => {
                const pos = markerRef.current?.getLatLng();
                if (pos) onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
      <p className="bg-gray-50 px-3 py-1.5 text-[11px] text-gray-400">
        Haz clic en el mapa o arrastra el marcador para ubicar tu negocio.
      </p>
    </div>
  );
}
