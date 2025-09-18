import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';

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
    <Marker position={position}>
      <Popup>Your current location</Popup>
    </Marker>
  );
};

export default UserLocationMarker;
