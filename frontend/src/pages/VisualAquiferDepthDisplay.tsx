import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';

// ... (interface definitions and helper functions remain the same)
interface Aquifer { id: string; name: string; depth_from: number; depth_to: number; water_table: number; color: string; aquifer_type: string; borewells_connected: number; }
interface AquiferData { location: { name: string; lat: number; lon: number }; timestamp: string; data_source: string; aquifers: Aquifer[]; }
const fetchAquiferFromBackend = async (lat: number, lon: number): Promise<AquiferData> => {
    const url = `/api/gamification/groundwater?lat=${lat}&lon=${lon}`;
    let res = await fetch(url);
    if (res.status === 404 || res.status === 405) { res = await fetch(`/groundwater?lat=${lat}&lon=${lon}`); }
    if (!res.ok) throw new Error('Failed to fetch groundwater data');
    const d = await res.json();
    return { location: { name: d.location, lat, lon }, timestamp: d.last_updated, data_source: 'RTRWH Backend', aquifers: [{ id: `${lat},${lon}`, name: d.location, depth_from: 0, depth_to: 80, water_table: d.groundwater_level_m, color: '#60a5fa', aquifer_type: d.aquifer_type, borewells_connected: d.borewells_connected }] };
};
const getDepthColor = (depth: number) => { if (depth < 10) return '#34d399'; if (depth < 30) return '#fbbf24'; if (depth < 60) return '#fb7185'; return '#6366f1'; };

function MapClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
    useMapEvents({ click: (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng) });
    return null;
}

function MapPicker({ onPick, lat, lon }: { onPick: (lat: number, lon: number) => void; lat: number; lon: number }) {
    const { t } = useTranslation();
    return (
        <MapContainer center={[lat, lon]} zoom={5} style={{ height: 300, width: '100%', borderRadius: 16 }} className="z-10">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={t('gda.map_attribution')} />
            <Marker position={[lat, lon]} />
            <MapClickHandler onPick={onPick} />
        </MapContainer>
    );
}

function VisualAquiferDepthDisplay() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [data, setData] = useState<AquiferData | null>(null);
    const [lat, setLat] = useState(22.5);
    const [lon, setLon] = useState(77.0);
    const [hoveredAquifer, setHoveredAquifer] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const chartHeight = 500;
    const chartWidth = 200;

    useEffect(() => {
        setError(null);
        setData(null);
        fetchAquiferFromBackend(lat, lon).then(setData).catch((e) => setError(e.message || t('vad.error_fetch')));
    }, [lat, lon, t]);

    const aquifers = useMemo(() => data?.aquifers || [], [data]);
    const maxDepth = useMemo(() => Math.max(...aquifers.map((aq) => aq.depth_to), 1), [aquifers]);
    const pxPerMeter = chartHeight / (maxDepth || 1);

    const downloadData = () => {
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aquifer_data_${data.location.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const voiceCommands = {
        [t('voice_commands.set_latitude')]: (val: string) => setLat(parseFloat(val)),
        [t('voice_commands.set_longitude')]: (val: string) => setLon(parseFloat(val)),
        [t('voice_commands.download_data')]: downloadData,
        [t('voice_commands.go_home')]: () => navigate('/'),
    };

    // Voice assistant handled globally in navbar

    return (
        <motion.div className="mx-auto my-8 p-6 rounded-3xl shadow-2xl border bg-white/80 backdrop-blur-lg" aria-label={t('aria.vad_main')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <header className="mb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{t('vad.title')}</h2>
                    <p className="text-gray-600 mt-1">{t('vad.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-blue-600 hover:underline">{t('gda.back_to_dashboard')}</Link>
                    {/* Language switcher available in navbar */}
                </div>
            </header>

            <div className="mb-6"><MapPicker onPick={(a, b) => { setLat(Number(a.toFixed(5))); setLon(Number(b.toFixed(5))); }} lat={lat} lon={lon} /></div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 min-w-[220px]">{error ? <div>{error}</div> : !data ? <div>{t('vad.loading')}</div> : <div /> /* Chart component would go here */}</div>
                <aside className="flex-1 w-full max-w-[350px] bg-gray-50 rounded-2xl p-4 shadow-inner border">
                    {data && (
                        <>
                            <div>
                                <h3 className="font-semibold text-gray-700">{t('vad.location_title')}</h3>
                                <p>{data.location.name}</p>
                                <p className="text-sm text-gray-500">({data.location.lat}, {data.location.lon})</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-700">{t('vad.source_title')}</h3>
                                <p>{data.data_source}</p>
                                <p className="text-sm text-gray-500">{t('vad.last_updated')}: {new Date(data.timestamp).toLocaleString()}</p>
                            </div>
                            <button onClick={downloadData} className="btn btn-sm btn-outline mt-6" aria-label={t('aria.download_data')}>{t('vad.download_button')}</button>
                        </>
                    )}
                </aside>
            </div>
            {/* Voice assistant UI available globally in navbar */}
        </motion.div>
    );
}

export default VisualAquiferDepthDisplay;