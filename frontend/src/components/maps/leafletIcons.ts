import L from "leaflet";

/** Pin en el morado de marca (#7C5CFC) en vez del ícono azul por defecto de
 * Leaflet — se usa en ambos mapas (picker y vista de solo lectura) así que
 * no hace falta parchear L.Icon.Default (evita el problema conocido de
 * bundlers con las URLs relativas de sus PNG). */
export const welvePinIcon = L.divIcon({
  className: "welve-map-pin",
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="#7C5CFC"/>
    <circle cx="15" cy="15" r="5.5" fill="white"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});
