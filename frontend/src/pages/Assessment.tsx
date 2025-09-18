import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useTheme } from '../components/ThemeProvider';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useAuth } from '../contexts/AuthContext';

export function Assessment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    user_name: '',
    location_desc: '',
    latitude: '' as number | string,
    longitude: '' as number | string,
    num_dwellers: '' as number | string,
    rooftop_area_m2: '' as number | string,
    open_space_area_m2: '' as number | string,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [preview, setPreview] = useState({ estimated_collection_m3: 0, per_capita_m3: 0 });
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

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

  const validateField = (name: string, value: any) => {
    let error = '';

    switch (name) {
      case 'user_name':
        if (!value || value.trim() === '') {
          error = 'Name is required';
        }
        break;
      case 'location_desc':
        if (!value || value.trim() === '') {
          error = 'Location is required';
        }
        break;
      case 'latitude':
        if (!value || value === '') {
          error = 'Latitude is required';
        } else if (isNaN(Number(value))) {
          error = 'Latitude must be a valid number';
        } else if (Number(value) < -90 || Number(value) > 90) {
          error = 'Latitude must be between -90 and 90 degrees';
        }
        break;
      case 'longitude':
        if (!value || value === '') {
          error = 'Longitude is required';
        } else if (isNaN(Number(value))) {
          error = 'Longitude must be a valid number';
        } else if (Number(value) < -180 || Number(value) > 180) {
          error = 'Longitude must be between -180 and 180 degrees';
        }
        break;
      case 'num_dwellers':
        if (!value || value === '' || value === 0) {
          error = 'Number of dwellers is required';
        } else if (isNaN(Number(value))) {
          error = 'Number of dwellers must be a valid number';
        } else if (Number(value) < 1) {
          error = 'Number of dwellers must be at least 1';
        } else if (Number(value) > 100) {
          error = 'Number of dwellers cannot exceed 100';
        }
        break;
      case 'rooftop_area_m2':
        if (!value || value === '' || value === 0) {
          error = 'Rooftop area is required';
        } else if (isNaN(Number(value))) {
          error = 'Rooftop area must be a valid number';
        } else if (Number(value) < 0) {
          error = 'Rooftop area cannot be negative';
        } else if (Number(value) > 10000) {
          error = 'Rooftop area cannot exceed 10,000 m²';
        }
        break;
      case 'open_space_area_m2':
        if (!value || value === '' || value === 0) {
          error = 'Open space area is required';
        } else if (isNaN(Number(value))) {
          error = 'Open space area must be a valid number';
        } else if (Number(value) < 0) {
          error = 'Open space area cannot be negative';
        } else if (Number(value) > 50000) {
          error = 'Open space area cannot exceed 50,000 m²';
        }
        break;
    }

    return error;
  };

  const handleFormChange = (name: string, value: any) => {
    const parsedValue = 
      name.includes('area') || name.includes('num') || name.includes('lat') || name.includes('lon')
        ? value === '' ? '' : Number(value)
        : value;

    const newForm = { ...form, [name]: parsedValue };
    setForm(newForm);
    updatePreview(newForm);

    // Validate the field and update errors
    const error = validateField(name, parsedValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const updatePreview = (currentForm: any) => {
    const totalArea = (Number(currentForm.rooftop_area_m2) || 0) + (Number(currentForm.open_space_area_m2) || 0);
    const rainfallFactor = 0.7; // Average rainfall capture efficiency
    const estimate = Math.max(0, totalArea * rainfallFactor) / 100;
    const perCapita = currentForm.num_dwellers ? estimate / Number(currentForm.num_dwellers) : 0;
    setPreview({
      estimated_collection_m3: Number(estimate.toFixed(2)),
      per_capita_m3: Number(perCapita.toFixed(2)),
    });
  };

  const getCityName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      const city = data.city || data.locality || data.principalSubdivision;
      const country = data.countryCode;
      return city && country ? `${city}, ${country}` : 'Current Location';
    } catch (error) {
      console.error('Error fetching city name:', error);
      return 'Current Location';
    }
  };

  const fetchLocation = async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    // Set loading state to prevent form updates
    setLocationLoading(true);

    // Show loading state once
    const locationButton = document.querySelector('[aria-label*="location"]') as HTMLButtonElement;
    if (locationButton) {
      locationButton.disabled = true;
      locationButton.textContent = '📍 Getting...';
    }

    try {
      // Get current position with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        });
      });

      // Extract coordinates
      const latitude = Number(position.coords.latitude.toFixed(6));
      const longitude = Number(position.coords.longitude.toFixed(6));
      
      console.log('Location fetched:', { latitude, longitude });

      // Get city name first
      let cityName = `Location (${latitude}, ${longitude})`;
      try {
        cityName = await getCityName(latitude, longitude);
        console.log('Location updated:', cityName);
      } catch (error) {
        console.warn('Failed to get city name:', error);
      }

      // Update all form fields in a single batch to prevent blinking
      setForm(prevForm => ({
        ...prevForm,
        latitude: latitude,
        longitude: longitude,
        location_desc: cityName
      }));
      
    } catch (error) {
      console.error('Location fetch failed:', error);
      
      // Set fallback values in a single batch
      setForm(prevForm => ({
        ...prevForm,
        latitude: '',
        longitude: '',
        location_desc: 'Location not available'
      }));
      
    } finally {
      // Reset loading state and button
      setLocationLoading(false);
      if (locationButton) {
        locationButton.disabled = false;
        locationButton.textContent = '📍 Get Location';
      }
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Required field validations
    if (!form.user_name || form.user_name.trim() === '') {
      errors.push('Name is required');
    }

    if (!form.location_desc || form.location_desc.trim() === '') {
      errors.push('Location is required');
    }

    if (!form.latitude || form.latitude === '') {
      errors.push('Latitude is required');
    } else if (isNaN(Number(form.latitude))) {
      errors.push('Latitude must be a valid number');
    } else if (Number(form.latitude) < -90 || Number(form.latitude) > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }

    if (!form.longitude || form.longitude === '') {
      errors.push('Longitude is required');
    } else if (isNaN(Number(form.longitude))) {
      errors.push('Longitude must be a valid number');
    } else if (Number(form.longitude) < -180 || Number(form.longitude) > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }

    // Required field validations (all fields are now mandatory)
    if (!form.num_dwellers || form.num_dwellers === '' || form.num_dwellers === 0) {
      errors.push('Number of dwellers is required');
    } else if (isNaN(Number(form.num_dwellers))) {
      errors.push('Number of dwellers must be a valid number');
    } else if (Number(form.num_dwellers) < 1) {
      errors.push('Number of dwellers must be at least 1');
    } else if (Number(form.num_dwellers) > 100) {
      errors.push('Number of dwellers cannot exceed 100');
    }

    if (!form.rooftop_area_m2 || form.rooftop_area_m2 === '' || form.rooftop_area_m2 === 0) {
      errors.push('Rooftop area is required');
    } else if (isNaN(Number(form.rooftop_area_m2))) {
      errors.push('Rooftop area must be a valid number');
    } else if (Number(form.rooftop_area_m2) < 0) {
      errors.push('Rooftop area cannot be negative');
    } else if (Number(form.rooftop_area_m2) > 10000) {
      errors.push('Rooftop area cannot exceed 10,000 m²');
    }

    if (!form.open_space_area_m2 || form.open_space_area_m2 === '' || form.open_space_area_m2 === 0) {
      errors.push('Open space area is required');
    } else if (isNaN(Number(form.open_space_area_m2))) {
      errors.push('Open space area must be a valid number');
    } else if (Number(form.open_space_area_m2) < 0) {
      errors.push('Open space area cannot be negative');
    } else if (Number(form.open_space_area_m2) > 50000) {
      errors.push('Open space area cannot exceed 50,000 m²');
    }

    return errors;
  };

  const submit = async () => {
    setLoading(true);
    try {
      // Validate all fields (all fields are now mandatory)
      const validationErrors = validateForm();
      
      if (validationErrors.length > 0) {
        alert('Please fill in all required fields:\n\n' + validationErrors.join('\n'));
        setLoading(false);
        return;
      }

      // Prepare data for submission (all fields are now required)
      const submissionData = {
        user_name: form.user_name.trim(),
        location_desc: form.location_desc.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        num_dwellers: Number(form.num_dwellers),
        rooftop_area_m2: Number(form.rooftop_area_m2),
        open_space_area_m2: Number(form.open_space_area_m2),
      };

      console.log('Submitting assessment:', submissionData);
      
      const { data } = await api.post('/assessments', submissionData);
      console.log('Assessment created:', data);
      
      // Navigate to results page with the assessment ID
      navigate(`/results/${data.id}`);
    } catch (error: any) {
      console.error('Assessment submission failed:', error);
      alert(`Failed to create assessment: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const voiceCommands = {
    [t('voice_commands.set_name')]: (name: string) => handleFormChange('user_name', name),
    [t('voice_commands.set_location')]: (location: string) => handleFormChange('location_desc', location),
    [t('voice_commands.use_gps')]: fetchLocation,
    [t('voice_commands.set_dwellers')]: (num: string) => handleFormChange('num_dwellers', parseInt(num, 10)),
    [t('voice_commands.set_rooftop_area')]: (area: string) => handleFormChange('rooftop_area_m2', parseInt(area, 10)),
    [t('voice_commands.set_open_space_area')]: (area: string) => handleFormChange('open_space_area_m2', parseInt(area, 10)),
    [t('voice_commands.submit_form')]: submit,
    [t('voice_commands.go_home')]: () => navigate('/'),
  };

  // Voice assistant handled globally in navbar

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`min-h-screen pt-24 pb-10 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <div className="w-full max-w-2xl mx-auto px-4">
        <header className="flex justify-start items-center mb-8">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
        </header>
        <div className="relative rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">
                {t('assessment.title')}
              </h1>
              <p className="text-blue-100">{t('assessment.subtitle')}</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="user_name" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('user_name')} <span className="text-red-500">*</span>
                </label>
                <input 
                  id="user_name" 
                  name="user_name" 
                  value={form.user_name} 
                  onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                  placeholder={t('assessment.name_placeholder')} 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.user_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  aria-label={t('aria.user_name')} 
                  required
                />
                {fieldErrors.user_name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.user_name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="location_desc" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('location')} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input 
                    id="location_desc" 
                    name="location_desc" 
                    value={form.location_desc} 
                    onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                    placeholder={t('assessment.location_placeholder')} 
                    className={`flex-1 w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.location_desc ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                    aria-label={t('aria.location_desc')} 
                    disabled={locationLoading}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={fetchLocation} 
                    className="px-6 py-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 text-sm font-semibold transition-all duration-200 flex items-center gap-2" 
                    aria-label={t('aria.use_gps')}
                  >
                    📍 Get Location
                  </button>
                </div>
                {fieldErrors.location_desc && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.location_desc}</p>
                )}
              </div>

              <div>
                <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('assessment.latitude')} <span className="text-red-500">*</span>
                </label>
                <input 
                  id="latitude" 
                  name="latitude" 
                  type="number" 
                  step="any"
                  value={form.latitude} 
                  onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                  placeholder="e.g. 12.9716" 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.latitude ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  aria-label={t('aria.latitude')} 
                  disabled={locationLoading}
                  required
                />
                {fieldErrors.latitude && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.latitude}</p>
                )}
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('assessment.longitude')} <span className="text-red-500">*</span>
                </label>
                <input 
                  id="longitude" 
                  name="longitude" 
                  type="number" 
                  step="any"
                  value={form.longitude} 
                  onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                  placeholder="e.g. 77.5946" 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.longitude ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  aria-label={t('aria.longitude')} 
                  disabled={locationLoading}
                  required
                />
                {fieldErrors.longitude && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.longitude}</p>
                )}
              </div>

              <div>
                <label htmlFor="num_dwellers" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('dwellers')} <span className="text-red-500">*</span>
                </label>
                <input 
                  id="num_dwellers" 
                  name="num_dwellers" 
                  type="number" 
                  min="1"
                  max="100"
                  value={form.num_dwellers} 
                  onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                  placeholder="e.g. 4" 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.num_dwellers ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  aria-label={t('aria.num_dwellers')} 
                  required
                />
                {fieldErrors.num_dwellers && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.num_dwellers}</p>
                )}
              </div>

              <div>
                <label htmlFor="rooftop_area_m2" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('rooftop_area')} <span className="text-red-500">*</span>
                </label>
                <input 
                  id="rooftop_area_m2" 
                  name="rooftop_area_m2" 
                  type="number" 
                  min="0.1"
                  max="10000"
                  step="0.1"
                  value={form.rooftop_area_m2} 
                  onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                  placeholder="m²" 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.rooftop_area_m2 ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  aria-label={t('aria.rooftop_area')} 
                  required
                />
                {fieldErrors.rooftop_area_m2 && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.rooftop_area_m2}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="open_space_area_m2" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('open_space_area')} <span className="text-red-500">*</span>
                </label>
                <input 
                  id="open_space_area_m2" 
                  name="open_space_area_m2" 
                  type="number" 
                  min="0.1"
                  max="50000"
                  step="0.1"
                  value={form.open_space_area_m2} 
                  onChange={(e) => handleFormChange(e.target.name, e.target.value)} 
                  placeholder="m²" 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.open_space_area_m2 ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  aria-label={t('aria.open_space_area')} 
                  required
                />
                {fieldErrors.open_space_area_m2 && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.open_space_area_m2}</p>
                )}
              </div>
            </div>

            <div className="mt-6 p-6 rounded-xl border bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('assessment.live_preview')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 text-center rounded-lg bg-white border border-blue-200 shadow-sm">
                  <div className="text-sm font-medium text-blue-600 mb-1">{t('assessment.estimated_collection')}</div>
                  <div className="text-2xl font-bold text-gray-800">{preview.estimated_collection_m3} m³</div>
                  <div className="text-xs text-gray-500 mt-1">Annual rainwater collection</div>
                </div>
                <div className="p-4 text-center rounded-lg bg-white border border-cyan-200 shadow-sm">
                  <div className="text-sm font-medium text-cyan-600 mb-1">Per Capita Collection</div>
                  <div className="text-2xl font-bold text-gray-800">{preview.per_capita_m3.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-1">Cubic meters per person</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button 
                disabled={loading || locationLoading} 
                onClick={submit} 
                className={`px-8 py-4 rounded-xl text-white font-semibold shadow-lg transition-all transform hover:scale-105 ${(loading || locationLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl'}`} 
                aria-label={t('aria.submit_assessment')}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Assessment...
                  </div>
                ) : locationLoading ? (
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting Location...
                  </div>
                ) : (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Submit
                    </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Voice assistant UI available globally in navbar */}
    </motion.div>
  );
}

export default Assessment;