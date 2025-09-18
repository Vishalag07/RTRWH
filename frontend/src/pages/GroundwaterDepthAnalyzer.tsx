import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../components/ThemeProvider';

type GwPoint = { lat: number; lon: number; groundwater_level_m: number; location?: string; aquifer_type?: string; borewells_connected?: number; last_updated?: string; };
type PredictionResult = { summary?: string; daily?: { date: string; rainfall_mm: number }[]; tank_fill_level_l?: number; recommended_recharge_l?: number; raw?: any; };

function getColorForMm(mm: number) {
  if (mm <= 2) return '#8ecae6';
  if (mm <= 10) return '#219ebc';
  if (mm <= 25) return '#023e8a';
  return '#d90429';
}

function ClickableMap({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e: any) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function GroundwaterDepthAnalyzer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locations: GwPoint[] = [{ lat: 12.9716, lon: 77.5946, groundwater_level_m: 8, location: 'Bengaluru Urban' }, { lat: 28.6139, lon: 77.2090, groundwater_level_m: 35, location: 'New Delhi' }];
  const [gwData, setGwData] = useState<GwPoint[]>(locations);
  const [lat, setLat] = useState<number>(22.5);
  const [lon, setLon] = useState<number>(77);
  const [roofArea, setRoofArea] = useState<number>(100);
  const [tankCapacity, setTankCapacity] = useState<number>(5000);
  const [currentTank, setCurrentTank] = useState<number>(1000);
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [errorPred, setErrorPred] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  const useGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(Number(pos.coords.latitude.toFixed(5))); setLon(Number(pos.coords.longitude.toFixed(5))); },
        () => { setErrorPred(t('gda.gps_error')); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  useEffect(() => { useGPS(); }, []);

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingPred(true);
    setErrorPred(null);
    setPrediction(null);
    setProgressMsg(t('gda.progress_starting'));
    try {
      const res = await api.post('/rain-prediction/predict', { latitude: lat, longitude: lon, roof_area_m2: roofArea, tank_capacity_liters: tankCapacity, current_tank_level_liters: currentTank, forecast_days: forecastDays });
      if (res.data.result) {
        setPrediction(res.data.result);
        setProgressMsg(t('gda.progress_immediate'));
      } else if (res.data) {
        setPrediction(res.data);
      }
    } catch (err: any) {
      setErrorPred(err?.response?.data?.detail || err?.message || t('gda.prediction_failed'));
    } finally {
      setLoadingPred(false);
    }
  };

  const voiceCommands = {
    [t('voice_commands.set_latitude')]: (val: string) => setLat(parseFloat(val)),
    [t('voice_commands.set_longitude')]: (val: string) => setLon(parseFloat(val)),
    [t('voice_commands.set_roof_area')]: (val: string) => setRoofArea(parseFloat(val)),
    [t('voice_commands.set_tank_capacity')]: (val: string) => setTankCapacity(parseFloat(val)),
    [t('voice_commands.predict')]: () => handlePredict(),
    [t('voice_commands.use_gps')]: useGPS,
    [t('voice_commands.toggle_heatmap')]: () => setShowHeatmap(s => !s),
    [t('voice_commands.toggle_markers')]: () => setShowMarkers(s => !s),
    [t('voice_commands.go_home')]: () => navigate('/'),
  };

  // Voice assistant handled globally in navbar

  return (
    <AnimatePresence>
      <motion.div className="p-6 space-y-6 bg-gray-50 min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('gda.title')}</h1>
            <p className="text-base text-gray-600 mt-1">{t('gda.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-blue-600 hover:underline">{t('gda.back_to_dashboard')}</Link>
            {/* Language switcher available in navbar */}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.section className="bg-white rounded-2xl p-2 shadow-lg border" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="px-3 py-2 font-semibold text-gray-700">{t('gda.map_title')}</h2>
            <div style={{ height: 520 }} className="rounded-b-xl overflow-hidden" role="application" aria-label={t('aria.gda_map')}>
              <MapContainer center={[lat, lon]} zoom={6} style={{ height: '100%', width: '100%' }} >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={t('gda.map_attribution')} />
                {showMarkers && gwData.map((d, i) => (
                  <CircleMarker key={i} center={[d.lat, d.lon]} radius={12} pathOptions={{ color: d.groundwater_level_m <= 10 ? '#2b9348' : d.groundwater_level_m <= 30 ? '#f6c90e' : '#d00000' }}>
                    <Popup>{d.location || `${d.lat.toFixed(3)}, ${d.lon.toFixed(3)}`}: {d.groundwater_level_m} m</Popup>
                  </CircleMarker>
                ))}
                {showHeatmap && prediction?.daily?.length && prediction.daily.map((d, idx) => (
                  <Circle key={idx} center={[lat + (idx - prediction.daily!.length / 2) * 0.0015, lon + (idx - prediction.daily!.length / 2) * 0.0015]} radius={Math.min(80, Math.max(6, d.rainfall_mm * 4)) * 10} pathOptions={{ color: getColorForMm(d.rainfall_mm), fillColor: getColorForMm(d.rainfall_mm), fillOpacity: 0.18 }} />
                ))}
                <ClickableMap onClick={(a, b) => { setLat(Number(a.toFixed(5))); setLon(Number(b.toFixed(5))) }} />
                <Marker position={[lat, lon]} draggable={true} eventHandlers={{ dragend: (e: any) => { const t = (e.target).getLatLng(); setLat(Number(t.lat.toFixed(5))); setLon(Number(t.lng.toFixed(5))); } }}>
                  <Popup>{t('gda.selected_location_popup')}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </motion.section>

          <motion.aside className="space-y-4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <form className="bg-white rounded-2xl p-4 shadow-lg border" onSubmit={handlePredict}>
              <h3 className="font-semibold mb-3 text-gray-700">{t('gda.controls_title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold">{t('gda.latitude')}</label><input type="number" step="any" value={lat} onChange={e => setLat(Number(e.target.value))} className="input input-bordered w-full" aria-label={t('aria.gda_latitude')} /></div>
                <div><label className="block text-xs font-semibold">{t('gda.longitude')}</label><input type="number" step="any" value={lon} onChange={e => setLon(Number(e.target.value))} className="input input-bordered w-full" aria-label={t('aria.gda_longitude')} /></div>
                <div><label className="block text-xs font-semibold">{t('gda.forecast_days')}</label><input type="range" min={1} max={14} value={forecastDays} onChange={e => setForecastDays(Number(e.target.value))} className="w-full" /><div className="text-xs text-gray-600">{forecastDays} {t('gda.days')}</div></div>
                <div><label className="block text-xs font-semibold">{t('gda.roof_area')}</label><input type="number" min={1} value={roofArea} onChange={e => setRoofArea(Number(e.target.value))} className="input input-bordered w-full" aria-label={t('aria.gda_roof_area')} /></div>
                <div><label className="block text-xs font-semibold">{t('gda.tank_capacity')}</label><input type="number" min={1} value={tankCapacity} onChange={e => setTankCapacity(Number(e.target.value))} className="input input-bordered w-full" aria-label={t('aria.gda_tank_capacity')} /></div>
                <div><label className="block text-xs font-semibold">{t('gda.current_tank_level')}</label><input type="number" min={0} value={currentTank} onChange={e => setCurrentTank(Number(e.target.value))} className="input input-bordered w-full" aria-label={t('aria.gda_current_tank')} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <motion.button type="button" whileHover={{ scale: 1.05 }} onClick={useGPS} className="btn btn-outline">{t('gda.use_gps_button')}</motion.button>
                <motion.button type="submit" whileHover={{ scale: 1.05 }} className="btn btn-primary" disabled={loadingPred}>{loadingPred ? t('gda.predicting') : t('gda.predict_button')}</motion.button>
              </div>
              {progressMsg && <div className="mt-3 text-xs text-gray-600">{t('gda.transmission_label')}: {progressMsg}</div>}
              {errorPred && <div className="text-red-600 mt-3">{errorPred}</div>}
            </form>

            <motion.div className="bg-white rounded-2xl p-4 shadow-lg border">
              <h3 className="font-semibold text-gray-700">{t('gda.results_title')}</h3>
              {!prediction && <div className="text-sm text-gray-500 mt-3">{t('gda.no_prediction_text')}</div>}
              {prediction && <div className="mt-3 space-y-2 text-sm">{prediction.summary && <p>{prediction.summary}</p>}</div>}
            </motion.div>
            <div className="flex gap-2 items-center">
                <motion.button whileHover={{ scale: 1.1 }} className="btn btn-sm btn-accent" onClick={() => { setShowHeatmap(s => !s) }}>{showHeatmap ? t('gda.hide_heatmap') : t('gda.show_heatmap')}</motion.button>
                <motion.button whileHover={{ scale: 1.1 }} className="btn btn-sm btn-info" onClick={() => { setShowMarkers(s => !s) }}>{showMarkers ? t('gda.hide_markers') : t('gda.show_markers')}</motion.button>
            </div>
          </motion.aside>
        </div>
        {/* Voice assistant UI available globally in navbar */}
      </motion.div>
    </AnimatePresence>
  );
}

export default GroundwaterDepthAnalyzer;