import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import groundwaterApi, { GroundwaterData } from '../services/groundwaterApi';

interface SimpleAutoPlayGroundwaterProps {
  lat?: number;
  lon?: number;
  className?: string;
  waterLevel?: number;
}

interface AnimationState {
  currentTime: number;
  waterLevel: number;
  baseWaterLevel: number;
  animationPhase: number;
}

const SimpleAutoPlayGroundwater: React.FC<SimpleAutoPlayGroundwaterProps> = ({
  lat = 22.5,
  lon = 77.0,
  className = '',
  waterLevel: propWaterLevel
}) => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [groundwaterData, setGroundwaterData] = useState<GroundwaterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentTime: 0,
    waterLevel: propWaterLevel || 12.5,
    baseWaterLevel: propWaterLevel || 12.5,
    animationPhase: 0
  });

  // Fetch groundwater data
  const fetchGroundwaterData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await groundwaterApi.fetchGroundwaterData(lat, lon);
      
      if (response.success && response.data) {
        setGroundwaterData(response.data);
        setAnimationState(prev => ({
          ...prev,
          baseWaterLevel: response.data!.groundwater.level_m,
          waterLevel: response.data!.groundwater.level_m
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch groundwater data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon]);

  // Initial data fetch
  useEffect(() => {
    fetchGroundwaterData();
  }, [fetchGroundwaterData]);

  // Update water level when prop changes
  useEffect(() => {
    if (propWaterLevel !== undefined) {
      setAnimationState(prev => ({
        ...prev,
        baseWaterLevel: propWaterLevel,
        waterLevel: propWaterLevel
      }));
    }
  }, [propWaterLevel]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setAnimationState(prev => {
        const newTime = prev.currentTime + 0.016; // ~60fps
        const cycleProgress = (newTime % 20) / 20; // 20 second cycle
        
        // Calculate water level variations
        const seasonalVariation = Math.sin(cycleProgress * Math.PI * 2) * 1; // ±1m
        const dailyVariation = Math.sin(cycleProgress * Math.PI * 2 * 3) * 0.3; // ±0.3m
        const randomVariation = (Math.random() - 0.5) * 0.2; // ±0.1m
        
        const newWaterLevel = Math.max(0, Math.min(50, 
          prev.baseWaterLevel + seasonalVariation + dailyVariation + randomVariation
        ));
        
        // Determine animation phase (0-3)
        const phase = Math.floor(cycleProgress * 4);
        
        return {
          ...prev,
          currentTime: newTime,
          waterLevel: newWaterLevel,
          animationPhase: phase
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.25);
      skyGradient.addColorStop(0, isDark ? '#1e3a8a' : '#87CEEB');
      skyGradient.addColorStop(1, isDark ? '#1e40af' : '#B0E0E6');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.25);
      
      // Draw ground surface
      ctx.fillStyle = isDark ? '#92400e' : '#8B7355';
      ctx.fillRect(0, height * 0.25, width, height * 0.05);
      
      // Draw soil layers with varying colors based on animation phase
      const soilColors = [
        [isDark ? '#7c2d12' : '#8B4513', isDark ? '#a16207' : '#A0522D', isDark ? '#451a03' : '#654321'],
        [isDark ? '#9a3412' : '#9B5A2B', isDark ? '#ca8a04' : '#B0623D', isDark ? '#78350f' : '#754321'],
        [isDark ? '#a16207' : '#A0522D', isDark ? '#d97706' : '#B8723D', isDark ? '#92400e' : '#854321'],
        [isDark ? '#7c2d12' : '#8B4513', isDark ? '#a16207' : '#A0522D', isDark ? '#451a03' : '#654321']
      ];
      
      const currentSoilColors = soilColors[animationState.animationPhase];
      const soilLayerHeight = height * 0.35;
      
      // Top soil layer
      ctx.fillStyle = currentSoilColors[0];
      ctx.fillRect(0, height * 0.3, width, soilLayerHeight * 0.3);
      
      // Middle soil layer
      ctx.fillStyle = currentSoilColors[1];
      ctx.fillRect(0, height * 0.3 + soilLayerHeight * 0.3, width, soilLayerHeight * 0.4);
      
      // Bottom soil layer
      ctx.fillStyle = currentSoilColors[2];
      ctx.fillRect(0, height * 0.3 + soilLayerHeight * 0.7, width, soilLayerHeight * 0.3);
      
      // Calculate water table position
      const waterTableY = height * 0.65 - (animationState.waterLevel / 50) * height * 0.3;
      
      // Draw groundwater with animated waves
      const waveOffset = Math.sin(animationState.currentTime * 2) * 2;
      const waveAmplitude = 3 + Math.sin(animationState.currentTime * 1.5) * 1.5;
      
      ctx.fillStyle = isDark ? '#1e40af' : '#4A90E2';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, waterTableY + waveOffset);
      
      for (let x = 0; x < width; x += 5) {
        const wave = Math.sin((x + animationState.currentTime * 50) * 0.02) * waveAmplitude;
        ctx.lineTo(x, waterTableY + waveOffset + wave);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Draw water level indicator line
      ctx.strokeStyle = isDark ? '#3b82f6' : '#1D4ED8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, waterTableY + waveOffset);
      ctx.lineTo(width, waterTableY + waveOffset);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw borewell shaft
      const shaftX = width * 0.75;
      const shaftWidth = 16;
      ctx.fillStyle = isDark ? '#4b5563' : '#6B7280';
      ctx.fillRect(shaftX - shaftWidth/2, height * 0.25, shaftWidth, waterTableY - height * 0.25);
      
      // Draw water level in borewell
      const borewellWaterY = waterTableY + waveOffset;
      ctx.fillStyle = isDark ? '#3b82f6' : '#87CEEB';
      ctx.fillRect(shaftX - shaftWidth/2, borewellWaterY, shaftWidth, height - borewellWaterY);
      
      // Draw animated water droplets in borewell
      ctx.fillStyle = isDark ? '#60a5fa' : '#87CEEB';
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 4; i++) {
        const dropletY = borewellWaterY + (animationState.currentTime * 40 + i * 15) % (height - borewellWaterY);
        ctx.beginPath();
        ctx.arc(shaftX, dropletY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      
      // Draw water level text
      ctx.fillStyle = isDark ? '#f1f5f9' : '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${animationState.waterLevel.toFixed(1)}m`, width - 8, waterTableY + waveOffset - 5);
    };

    render();
  }, [animationState, isDark]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full rounded-lg ${
          isDark 
            ? 'bg-gradient-to-b from-slate-800 to-slate-900' 
            : 'bg-gradient-to-b from-blue-100 to-green-100'
        }`}
        style={{ minHeight: '200px' }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-slate-700">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAutoPlayGroundwater;
