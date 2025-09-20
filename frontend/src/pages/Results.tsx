import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { api } from '../services/api';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';

export function Results() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const { id } = useParams();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAI, setDownloadingAI] = useState(false);
  const [downloadingGuide, setDownloadingGuide] = useState(false);

  // Redirect if not authenticated (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?mode=login');
    }
  }, [isAuthenticated, authLoading, navigate]);

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

  useEffect(() => {
    if (!id || id === 'undefined') {
      // Show sample data when no ID is provided or ID is undefined
      const sampleData = {
        id: 'sample',
        created_at: new Date().toISOString(),
        latitude: 12.9716,
        longitude: 77.5946,
        inputs: {
          user_name: 'Sample User',
          location_desc: 'Bangalore, India',
          latitude: 12.9716,
          longitude: 77.5946,
          num_dwellers: 4,
          rooftop_area_m2: 100,
          open_space_area_m2: 50
        },
        results: {
          runoff: {
            annual_rainfall_mm: 970,
            runoff_coefficient: 0.85,
            annual_runoff_volume_liters: 82450
          },
          structure: {
            structure_type: 'recharge_well',
            dimensions: '2m x 2m x 3m',
            storage_volume_liters: 12000,
            notes: 'Recommended for your location and rainfall pattern'
          },
          cost: {
            capex_currency: 25000,
            opex_currency_per_year: 2000,
            water_savings_liters_per_year: 82450,
            payback_years: 0.3
          },
          aquifer: {
            aquifer_type: 'Alluvial',
            gw_depth_m: 15.5,
            recharge_potential: 'High'
          },
          recharge_potential_liters: 12000
        }
      };
      setData(sampleData);
      return;
    }
    
    api.get(`/assessments/${id}`)
      .then((res) => {
        console.log('Assessment data received:', res.data);
        setData(res.data);
      })
      .catch((e) => {
        console.error('Error fetching assessment:', e);
        setError(e.response?.data?.detail || t('results.error_load'));
      });
  }, [id, t]);

  async function downloadPdf(type: 'ai' | 'guide') {
    if (!id || id === 'sample') {
      alert('PDF download is not available for sample data. Please complete a real assessment first.');
      return;
    }
    
    const isAI = type === 'ai';
    if (isAI) setDownloadingAI(true); else setDownloadingGuide(true);

    try {
      console.log(`Downloading PDF: /reports/${id}/${type}.pdf`);
      const res = await api.get(`/reports/${id}/${type}.pdf`, { responseType: 'blob' });
      
      if (!res.data || res.data.size === 0) {
        throw new Error('PDF file is empty or corrupted');
      }
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment_${id}_${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`PDF downloaded successfully: assessment_${id}_${type}.pdf`);
    } catch (e: any) {
      console.error('PDF download error:', e);
      const errorMessage = e.response?.data?.detail || e.message || 
        (isAI ? 'Failed to download AI report' : 'Failed to download guide');
      alert(`Error: ${errorMessage}`);
    } finally {
      if (isAI) setDownloadingAI(false); else setDownloadingGuide(false);
    }
  }

  const voiceCommands = {
    [t('voice_commands.download_pdf')]: () => downloadPdf('ai'),
    [t('voice_commands.download_guide')]: () => downloadPdf('guide'),
    [t('voice_commands.new_assessment')]: () => navigate('/assess'),
  };

  // Voice assistant handled globally in navbar

  if (error) return <div className="p-6 max-w-5xl mx-auto text-red-600">{error}</div>;
  if (!data) return <div className="p-6 max-w-5xl mx-auto">{t('results.loading')}</div>;

  // Ensure data.results exists and has the required properties
  if (!data.results || !data.results.runoff || !data.results.structure) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Assessment Data</h2>
          <p className="text-gray-600 mb-4">The assessment data is incomplete or corrupted.</p>
          <Link to="/assess" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Start New Assessment
          </Link>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: t('results.chart_runoff'), runoff: Math.round(data.results.runoff.annual_runoff_volume_liters), storage: null },
    { name: t('results.chart_storage'), runoff: null, storage: Math.round(data.results.structure.storage_volume_liters) },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0]?.value ?? payload[1]?.value;
      const key = payload[0]?.dataKey ?? payload[1]?.dataKey;
      return (
        <div className="rounded-lg border bg-white/90 backdrop-blur p-3 shadow">
          <div className="text-xs text-slate-500 mb-1">{label}</div>
          <div className="text-sm font-semibold text-slate-800">
            {key === 'runoff' ? t('results.chart_runoff') : t('results.chart_storage')}: {Math.round(val || 0)} L
          </div>
        </div>
      );
    }
    return null;
  };

  const DimensionsList = ({ dims }: { dims: any }) => {
    if (!dims) return null;

    const entries: Array<{ label: 'Length'|'Breadth'|'Depth'; value: any }> = [];

    const pushIf = (label: 'Length'|'Breadth'|'Depth', value: any) => {
      if (value !== undefined && value !== null && value !== '') entries.push({ label, value });
    };

    if (Array.isArray(dims)) {
      // Assume [L, B, D]
      pushIf('Length', dims[0]);
      pushIf('Breadth', dims[1]);
      pushIf('Depth', dims[2]);
    } else if (typeof dims === 'object') {
      const norm = Object.fromEntries(
        Object.entries(dims).map(([k, v]) => [k.toLowerCase(), v])
      );
      // Common aliases
      const length = norm.length ?? norm.len ?? norm.l ?? norm.long ?? norm.x;
      const breadth = norm.breadth ?? norm.width ?? norm.b ?? norm.w ?? norm.y;
      const depth = norm.depth ?? norm.d ?? norm.height ?? norm.h ?? norm.z;
      pushIf('Length', length);
      pushIf('Breadth', breadth);
      pushIf('Depth', depth);
    } else if (typeof dims === 'string') {
      // Try to split by x/×/*
      const parts = dims.split(/\s*[x×*]\s*/i).map(s => s.trim());
      if (parts.length >= 1) pushIf('Length', parts[0]);
      if (parts.length >= 2) pushIf('Breadth', parts[1]);
      if (parts.length >= 3) pushIf('Depth', parts[2]);
    } else if (typeof dims === 'number') {
      pushIf('Length', dims);
    }

    if (entries.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {entries.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3 bg-white/60 border border-white/70 rounded-md px-2 py-1">
            <span className="text-[11px] text-slate-600">{label}</span>
            <span className="font-mono text-xs text-gray-800">{Array.isArray(value) ? value.join(' × ') : String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const DimensionsInline = ({ dims }: { dims: any }) => {
    // If backend sent JSON as a string, parse it first
    if (typeof dims === 'string') {
      const s = dims.trim();
      if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
        try { dims = JSON.parse(s); } catch {}
      }
    }
    let L: any = undefined, B: any = undefined, D: any = undefined;
    if (Array.isArray(dims)) {
      [L, B, D] = dims;
    } else if (typeof dims === 'object') {
      const normEntries = Object.entries(dims).map(([k, v]) => [k.toLowerCase(), v] as const);
      const getByIncl = (alts: string[]) => {
        const hit = normEntries.find(([k]) => alts.some(a => k.includes(a)));
        return hit?.[1];
      };
      L = getByIncl(['length','len','long','l','x']);
      B = getByIncl(['breadth','width','wid','b','w','y']);
      D = getByIncl(['depth','dep','height','h','d','z']);
    } else if (typeof dims === 'string') {
      const parts = dims.split(/\s*[x×*]\s*/i);
      L = parts[0];
      B = parts[1];
      D = parts[2];
    } else if (typeof dims === 'number') {
      L = dims;
    }
    // Always render the 3 cells, even if values are missing
    return (
      <div className="grid grid-cols-3 gap-2 w-full">
        {['Length','Breadth','Depth'].map((label, idx) => (
          <div key={label} className="rounded-md bg-white/70 border border-white px-2 py-1 flex items-center justify-between whitespace-nowrap">
            <span className="text-[11px] text-slate-500">{label}</span>
            <span className="font-mono text-xs text-gray-800">{(() => {
              const val = [L,B,D][idx];
              if (val === undefined || val === null || val === '') return '-';
              return Array.isArray(val) ? val.join(' × ') : String(val);
            })()}</span>
          </div>
        ))}
      </div>
    );
  };

  const DimensionsShaftInline = ({ dims }: { dims: any }) => {
    // If backend sent JSON as a string, parse it first
    if (typeof dims === 'string') {
      const s = dims.trim();
      if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
        try { dims = JSON.parse(s); } catch {}
      }
    }
    let Dia: any = undefined, Dep: any = undefined;
    if (Array.isArray(dims)) {
      // Assume [Diameter, Depth]
      [Dia, Dep] = dims;
    } else if (typeof dims === 'object') {
      const normEntries = Object.entries(dims).map(([k, v]) => [k.toLowerCase(), v] as const);
      const getByIncl = (alts: string[]) => normEntries.find(([k]) => alts.some(a => k.includes(a)))?.[1];
      Dia = getByIncl(['diameter','dia','d']);
      Dep = getByIncl(['depth','dep','h','height']);
    } else if (typeof dims === 'string') {
      const parts = dims.split(/\s*[x×*]\s*/i);
      Dia = parts[0];
      Dep = parts[1];
    } else if (typeof dims === 'number') {
      Dia = dims;
    }
    const fmt = (v: any) => {
      const num = Number(v);
      if (!isNaN(num) && isFinite(num)) return Number(num.toFixed(2));
      return String(v || '');
    };
    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        {[
          { label: 'Diameter', value: fmt(Dia) },
          { label: 'Depth', value: fmt(Dep) },
        ].map((it) => (
          <div key={it.label} className="rounded-md bg-white/70 border border-white px-2 py-1 flex items-center justify-between whitespace-nowrap">
            <span className="text-[11px] text-slate-500">{it.label}</span>
            <span className="font-mono text-xs text-gray-800">{it.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const inferDimensions = () => {
    const dims = data?.results?.structure?.dimensions;
    // If backend provided dimensions, use them directly
    if (dims && (Array.isArray(dims) || typeof dims === 'object' || typeof dims === 'string' || typeof dims === 'number')) {
      return dims;
    }
    // Fallback inference from inputs
    const inputs = data?.inputs || {};
    const area = Number(inputs.rooftop_area_m2) || Number(inputs.open_space_area_m2) || 0;
    let L: number | undefined;
    let B: number | undefined;
    let D: number | undefined;
    if (area > 0) {
      const side = Math.sqrt(area);
      L = Number(side.toFixed(2));
      B = Number(side.toFixed(2));
    }
    // Depth: prefer structure storage-> approximate depth from storage and area if both present
    const storage = Number(data?.results?.structure?.storage_volume_liters) || 0;
    if (area > 0 && storage > 0) {
      // crude: assume 1m^2 = 1000 liters per meter depth
      const depthMeters = storage / (area * 1000);
      D = Number(Math.max(1, Math.min(depthMeters, 6)).toFixed(2));
    }
    // Fallback depth from aquifer or default
    if (!D) {
      const gw = Number(data?.results?.aquifer?.gw_depth_m) || 0;
      D = Number((gw > 0 ? Math.min(gw, 6) : 3).toFixed(2));
    }
    return { length: L ?? '-', breadth: B ?? '-', depth: D ?? '-' };
  };

  return (
    <div className={`min-h-screen pt-24 pb-10 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'
    }`}>
      <div className="p-6 max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              {t('results.title')}
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {id === 'sample' ? 'Sample Assessment Results' : `Assessment ID: ${id}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition-colors">
              Back to Dashboard
            </Link>
            <Link to="/assess" className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium transition-colors">
              {t('results.new_assessment_button')}
            </Link>
            {/* Language switcher available in navbar */}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-blue-600">{t('results.annual_rainfall')}</div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{data.results.runoff.annual_rainfall_mm} mm</div>
              <div className="text-xs text-gray-500 mt-1">Annual precipitation</div>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-cyan-600">{t('results.runoff_volume')}</div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{Math.round(data.results.runoff.annual_runoff_volume_liters)} L</div>
              <div className="text-xs text-gray-500 mt-1">Collectable rainwater</div>
            </div>
            <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-green-600">{t('results.storage_capacity')}</div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{Math.round(data.results.structure.storage_volume_liters)} L</div>
              <div className="text-xs text-gray-500 mt-1">Recommended storage</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 shadow relative overflow-hidden border bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-cyan-200/40" />
            <div className="absolute -bottom-8 -left-10 w-36 h-36 rounded-full bg-blue-200/30" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2zM7 7h10M7 7a2 2 0 110-4h10a2 2 0 110 4M7 7v4"/></svg>
                  {t('results.recommendations_title')}
                </h2>
                <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-white/70 border border-white text-slate-600">Best fit for you</span>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{t('results.recommended_structure')}</span>
                  <div className="rounded-md bg-white/70 border border-white px-2 py-1 text-sm font-semibold text-gray-800 capitalize">
                    {String(data.results.structure.structure_type).replace(/_/g,' ')}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-700 whitespace-nowrap">{t('results.suggested_dimensions')}</span>
                  <div className="flex-1 min-w-0">
                    {String(data.results.structure.structure_type).toLowerCase().includes('shaft') ? (
                      <DimensionsShaftInline dims={data.results.structure.dimensions} />
                    ) : (
                      <DimensionsInline dims={data.results.structure.dimensions} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/70 border border-white p-3 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">Runoff Coeff.</div>
                    <div className="text-sm font-semibold text-gray-800">{data.results.runoff.runoff_coefficient}</div>
                  </div>
                  <div className="rounded-lg bg-white/70 border border-white p-3 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">Recharge Pot.</div>
                    <div className="text-sm font-semibold text-gray-800">{Math.round(data.results.recharge_potential_liters)} L/yr</div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/70 border border-white p-3">
                  <div className="text-[11px] text-slate-500 mb-1">Notes</div>
                  <div className="text-sm text-gray-800">
                    {data.results.structure.notes || (
                      (() => {
                        const type = data.results.structure.structure_type;
                        const coeff = data.results.runoff.runoff_coefficient;
                        const area = Number(data.inputs.rooftop_area_m2) || Number(data.inputs.open_space_area_m2) || 0;
                        const storage = Math.round(data.results.structure.storage_volume_liters);
                        return `Recommended ${type?.replace('_',' ')} designed for ~${storage} L capacity with a runoff coefficient of ${coeff}. Estimated footprint based on ~${area} m² catchment.`;
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-6 shadow relative overflow-hidden border bg-gradient-to-br from-white to-blue-50">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-200/40" />
            <div className="absolute -bottom-10 -left-12 w-36 h-36 rounded-full bg-cyan-200/30" />
            <div className="relative">
              <h2 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18"/></svg>
                Runoff vs Storage (Liters)
              </h2>
              <div className="h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} barCategoryGap={30}>
                    <defs>
                      <linearGradient id="runoffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.08)' }} />
                    <Bar dataKey="runoff" name={t('results.chart_runoff')} fill="url(#runoffGrad)" radius={[8,8,0,0]} />
                    <Bar dataKey="storage" name={t('results.chart_storage')} fill="url(#storageGrad)" radius={[8,8,0,0]} />
                    <Line type="monotone" dataKey="runoff" stroke="#1d4ed8" dot={{ r: 3 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="storage" stroke="#0891b2" dot={{ r: 3 }} strokeWidth={2} />
                  </ComposedChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Visual aquifer depth display panel removed as requested */}

        <div className="mt-8 p-6 rounded-xl border bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Reports
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => downloadPdf('ai')} 
              disabled={downloadingAI} 
              className="p-4 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('aria.download_ai_pdf')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800">AI Analysis Report</div>
                  <div className="text-sm text-gray-500">Detailed AI insights</div>
                </div>
              </div>
              {downloadingAI && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('results.preparing_pdf')}
                </div>
              )}
            </button>
            
            <button 
              onClick={() => downloadPdf('guide')} 
              disabled={downloadingGuide} 
              className="p-4 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('aria.download_guide_pdf')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800">Implementation Guide</div>
                  <div className="text-sm text-gray-500">Step-by-step instructions</div>
                </div>
              </div>
              {downloadingGuide && (
                <div className="mt-2 flex items-center gap-2 text-sm text-cyan-600">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('results.preparing_guide')}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Voice assistant UI available globally in navbar */}
    </div>
  );
}

export default Results;