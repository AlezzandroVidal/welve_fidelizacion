import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "./leafletIcons";

interface Props {
  lat: number;
  lng: number;
  nombre: string;
}

export default function EmpresaMapView({ lat, lng, nombre }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: 200, width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{nombre}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
