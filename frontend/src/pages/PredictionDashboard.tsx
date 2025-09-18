import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FiMapPin, FiZap } from 'react-icons/fi';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';

// ... (interface definitions remain the same)
interface WeatherData { timestamp: string; temperature: number; humidity: number; precipitation: number; precipitation_probability: number; }
interface RainPrediction { forecast_hours: number; predicted_rainfall: number; confidence: number; time_series: Array<{ timestamp: string; predicted_rainfall_mm: number; hour: number; }>; }
interface HarvestCalculation { roof_area_m2: number; runoff_coefficient: number; tank_capacity_liters: number; current_tank_level_liters: number; predicted_harvest_liters: number; overflow_risk: boolean; overflow_liters: number; }
interface ActionAlert { alert_type: string; priority: string; title: string; message: string; action_required: string; deadline?: string; estimated_impact: string; }
interface PredictionResponse { location: { latitude: number; longitude: number; city: string; country: string; }; weather_data: WeatherData; rain_predictions: RainPrediction[]; harvest_calculations: HarvestCalculation; action_alerts: ActionAlert[]; generated_at: string; }


export function PredictionDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<string>('checking');
  const [form, setForm] = useState({ latitude: 12.9716, longitude: 77.5946, roof_area_m2: 100, tank_capacity_liters: 5000, current_tank_level_liters: 2000, forecast_days: 7 });

  // Redirect if not authenticated (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?mode=login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch service health status on mount and periodically
  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const { data } = await api.get('/rain-prediction/health');
        const base = data?.status === 'healthy' ? 'healthy' : 'unhealthy';
        const degraded = (data?.weather_service !== 'available' || data?.prediction_service !== 'available') ? ' (degraded)' : '';
        if (mounted) setServiceStatus(base + degraded);
      } catch (e) {
        if (mounted) setServiceStatus('unavailable');
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 60000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const useGPS = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
    });
  };

  const generatePrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/rain-prediction/predict', form);
      setPrediction(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t('predict.error_generate'));
    } finally {
      setLoading(false);
    }
  };

  const voiceCommands = {
    [t('voice_commands.set_latitude')]: (val: string) => setForm(p => ({...p, latitude: parseFloat(val)})),
    [t('voice_commands.set_longitude')]: (val: string) => setForm(p => ({...p, longitude: parseFloat(val)})),
    [t('voice_commands.set_roof_area')]: (val: string) => setForm(p => ({...p, roof_area_m2: parseFloat(val)})),
    [t('voice_commands.set_tank_capacity')]: (val: string) => setForm(p => ({...p, tank_capacity_liters: parseFloat(val)})),
    [t('voice_commands.generate_prediction')]: generatePrediction,
    [t('voice_commands.use_gps')]: useGPS,
    [t('voice_commands.go_home')]: () => navigate('/'),
  };

  // Voice assistant handled globally in navbar

  // ... (getPriorityColor and getAlertIcon functions remain the same)
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'filter_clean': return '🔧';
      case 'tank_overflow': return '⚠️';
      case 'recharge_opportunity': return '💧';
      case 'maintenance_reminder': return '🔧';
      default: return '📢';
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-10 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <div className="p-6 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>AI Rainwater Harvest Prediction</h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('predict.service_status')}: {serviceStatus}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-blue-600 hover:underline">{t('predict.back_to_dashboard')}</Link>
          </div>
        </header>

        <div className="bg-white rounded-2xl border shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('predict.config_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Form inputs with labels and aria-labels */}
            <div><label className="block text-sm text-gray-700 mb-1">{t('gda.latitude')}</label><input type="number" name="latitude" value={form.latitude} onChange={handleChange} className="w-full rounded-lg border p-2" aria-label={t('aria.gda_latitude')} /></div>
            <div><label className="block text-sm text-gray-700 mb-1">{t('gda.longitude')}</label><input type="number" name="longitude" value={form.longitude} onChange={handleChange} className="w-full rounded-lg border p-2" aria-label={t('aria.gda_longitude')} /></div>
            <div><label className="block text-sm text-gray-700 mb-1">{t('gda.roof_area')}</label><input type="number" name="roof_area_m2" value={form.roof_area_m2} onChange={handleChange} className="w-full rounded-lg border p-2" aria-label={t('aria.gda_roof_area')} /></div>
            <div><label className="block text-sm text-gray-700 mb-1">{t('gda.tank_capacity')}</label><input type="number" name="tank_capacity_liters" value={form.tank_capacity_liters} onChange={handleChange} className="w-full rounded-lg border p-2" aria-label={t('aria.gda_tank_capacity')} /></div>
            <div><label className="block text-sm text-gray-700 mb-1">{t('gda.current_tank_level')}</label><input type="number" name="current_tank_level_liters" value={form.current_tank_level_liters} onChange={handleChange} className="w-full rounded-lg border p-2" aria-label={t('aria.gda_current_tank')} /></div>
            <div><label className="block text-sm text-gray-700 mb-1">{t('gda.forecast_days')}</label><input type="number" name="forecast_days" value={form.forecast_days} onChange={handleChange} min="1" max="7" className="w-full rounded-lg border p-2" /></div>
            <div className="flex items-end gap-3 col-span-1 md:col-span-2 lg:col-span-3">
                <button
                  onClick={useGPS}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 shadow-sm ${
                    isDark
                      ? 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-100 border-slate-600'
                      : 'bg-white hover:bg-slate-50 text-black border-slate-300'
                  }`}
                >
                  <FiMapPin className="w-4 h-4" />
                  <span>Use My Location</span>
                </button>
                <button
                  onClick={generatePrediction}
                  disabled={loading}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md ${
                    loading
                      ? 'opacity-80 cursor-not-allowed'
                      : 'hover:shadow-lg hover:-translate-y-0.5'
                  } ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <FiZap className="w-4 h-4" />
                  <span>{loading ? t('predict.generating') : 'Generate Prediction'}</span>
                </button>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mb-6">{error}</div>}
        {loading && <div className="bg-blue-100 border border-blue-300 text-blue-800 p-3 rounded-lg mb-6">{t('predict.loading_message')}</div>}

        {prediction && (
          <div className="space-y-6">
            {/* Results */}
            <div className="bg-white rounded-2xl border shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('predict.results_title')}</h2>
                {/* Simplified display of results - expand as needed */}
                <p>{t('predict.predicted_harvest')}: {prediction.harvest_calculations.predicted_harvest_liters.toFixed(0)}L</p>
            </div>
            <div className="bg-white rounded-2xl border shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('predict.chart_title')}</h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prediction.rain_predictions[0]?.time_series || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" label={{ value: t('predict.chart_xaxis'), position: 'insideBottom', offset: -10 }} />
                            <YAxis label={{ value: t('predict.chart_yaxis'), angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="predicted_rainfall_mm" stroke="#3B82F6" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {prediction.action_alerts.length > 0 && (
              <div className="bg-white rounded-2xl border shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('predict.alerts_title')}</h2>
                <div className="space-y-3">
                  {prediction.action_alerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priority)}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-1">{getAlertIcon(alert.alert_type)}</span>
                        <div>
                          <div className="font-semibold">{alert.title}</div>
                          <p>{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Voice assistant UI available globally in navbar */}
    </div>
  );
}

export default PredictionDashboard;