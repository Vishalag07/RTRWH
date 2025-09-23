import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const PinIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'><path fill='%23ff3b3b' d='M12 0C6.48 0 2 4.48 2 10c0 7 10 26 10 26s10-19 10-26C22 4.48 17.52 0 12 0z'/><circle cx='12' cy='10' r='4' fill='%23ffffff' opacity='0.85'/></svg>",
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -30]
});

const UserLocationMarker: React.FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setPosition(null)
    );
  }, []);

  if (!position) return null;
  return (
    <Marker position={position} icon={PinIcon}>
      <Popup>Your current location</Popup>
    </Marker>
  );
};

export default UserLocationMarker;
