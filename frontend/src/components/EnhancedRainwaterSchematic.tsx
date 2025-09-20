import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiRefreshCw, FiSettings, FiInfo } from 'react-icons/fi';
import groundwaterApi, { GroundwaterData } from '../services/groundwaterApi';

interface EnhancedRainwaterSchematicProps {
  lat?: number;
  lon?: number;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  loopDuration?: number;
  dataUpdateInterval?: number;
}

interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  waterLevel: number;
  baseWaterLevel: number;
  animationPhase: number;
  cycleCount: number;
  phaseProgress: number;
}

const EnhancedRainwaterSchematic: React.FC<EnhancedRainwaterSchematicProps> = ({
  lat = 22.5,
  lon = 77.0,
  className = '',
  showControls = true,
  autoPlay = true,
  // loopDuration will be calculated dynamically based on phase duration
  dataUpdateInterval = 30000
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastDataUpdateRef = useRef<number>(0);
  
  const [groundwaterData, setGroundwaterData] = useState<GroundwaterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('Loading...');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Animation settings state
  const [animationSettings, setAnimationSettings] = useState({
    speed: 2.0, // Animation speed multiplier
    phaseDuration: 8, // Duration of each phase in seconds
    waterFlowIntensity: 1.0, // Water flow intensity multiplier
    showWaterDroplets: true, // Show/hide water droplets
    showPhaseIndicators: true, // Show/hide phase indicators
    autoLoop: true // Auto loop animation
  });

  // Calculate total loop duration based on phase duration (4 phases)
  const loopDuration = animationSettings.phaseDuration * 4;
  
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: autoPlay,
    currentTime: 0,
    waterLevel: 12.5,
    baseWaterLevel: 12.5,
    animationPhase: 0,
    cycleCount: 0,
    phaseProgress: 0
  });

  // Component positions (same as original)
  const componentPositions = {
    rooftop: { x: 50, y: 80, width: 80, height: 40 },
    desiltingPit: { x: 250, y: 100, width: 80, height: 60 },
    rechargeWell: { x: 380, y: 100, width: 100, height: 80 },
    borewell: { x: 520, y: 100, width: 90, height: 160 },
    serviceBorewell: { x: 680, y: 100, width: 40, height: 200 },
    aquifer: { x: 0, y: 320, width: 800, height: 60 }
  };

  // Fetch groundwater data
  const fetchGroundwaterData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await groundwaterApi.fetchGroundwaterData(lat, lon);
      
      if (response.success && response.data) {
        setGroundwaterData(response.data);
        setDataSource(`${response.source} - ${response.data.metadata.data_source}`);
        
        setAnimationState(prev => ({
          ...prev,
          baseWaterLevel: response.data!.groundwater.level_m,
          waterLevel: response.data!.groundwater.level_m
        }));
        
        console.log('Enhanced groundwater data updated:', {
          source: response.source,
          level: response.data.groundwater.level_m,
          location: response.data.location.name
        });
      } else {
        throw new Error(response.error || 'Failed to fetch groundwater data');
      }
    } catch (err) {
      console.warn('Failed to fetch enhanced groundwater data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setDataSource('Real-time Data (API Unavailable)');
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon]);

  // Initial data fetch
  useEffect(() => {
    fetchGroundwaterData();
  }, [fetchGroundwaterData]);

  // Auto-update data at intervals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastDataUpdateRef.current >= dataUpdateInterval) {
        fetchGroundwaterData();
        lastDataUpdateRef.current = now;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGroundwaterData, dataUpdateInterval]);

  // Enhanced animation loop with realistic water flow phases
  useEffect(() => {
    if (!animationState.isPlaying) return;

    const animate = () => {
      setAnimationState(prev => {
        try {
          const newTime = prev.currentTime + 0.016; // ~60fps
          const cycleProgress = ((newTime * animationSettings.speed) % loopDuration) / loopDuration;
        
        // Calculate water level variations
        const seasonalVariation = Math.sin(cycleProgress * Math.PI * 2) * 1.5;
        const dailyVariation = Math.sin(cycleProgress * Math.PI * 2 * 3) * 0.3;
        const randomVariation = (Math.random() - 0.5) * 0.2;
        
        const newWaterLevel = Math.max(0, Math.min(30, 
          prev.baseWaterLevel + seasonalVariation + dailyVariation + randomVariation
        ));
        
        // Determine animation phase (0-3 for different flow phases)
        const phase = Math.floor(cycleProgress * 4);
        const phaseProgress = (cycleProgress * 4) % 1;
        
        const newCycleCount = Math.floor((newTime * animationSettings.speed) / loopDuration);
        
        // Check if we should stop after one cycle (when autoLoop is false)
        if (!animationSettings.autoLoop && newCycleCount >= 1) {
          return {
            ...prev,
            isPlaying: false,
            currentTime: newTime,
            waterLevel: newWaterLevel,
            animationPhase: phase,
            phaseProgress: phaseProgress,
            cycleCount: newCycleCount
          };
        }
        
          return {
            ...prev,
            currentTime: newTime,
            waterLevel: newWaterLevel,
            animationPhase: phase,
            phaseProgress: phaseProgress,
            cycleCount: newCycleCount
          };
        } catch (error) {
          console.error('Animation error:', error);
          return prev; // Return previous state on error
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationState.isPlaying, loopDuration, animationSettings.speed, animationSettings.phaseDuration, animationSettings.autoLoop]);

  // Enhanced canvas rendering with realistic water flow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      try {
        const width = canvas.width;
        const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw sky background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 120);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, 120);
      
      // Draw soil layers with dynamic colors and rounded corners
      const soilGradient = ctx.createLinearGradient(0, 120, 0, 320);
      const moistureLevel = Math.sin(animationState.currentTime * 0.5) * 0.3 + 0.7;
      soilGradient.addColorStop(0, `rgba(139, 69, 19, ${moistureLevel})`);
      soilGradient.addColorStop(0.5, `rgba(160, 82, 45, ${moistureLevel})`);
      soilGradient.addColorStop(1, `rgba(101, 67, 33, ${moistureLevel})`);
      ctx.fillStyle = soilGradient;
      
      // Round the top corners of soil layer
      ctx.beginPath();
      ctx.roundRect(0, 120, width, 200, 10);
      ctx.fill();
      
      // Draw aquifer at bottom with rounded corners
      const aquiferGradient = ctx.createLinearGradient(0, 320, 0, 380);
      aquiferGradient.addColorStop(0, '#4A90E2');
      aquiferGradient.addColorStop(1, '#0066CC');
      ctx.fillStyle = aquiferGradient;
      
      // Round the bottom corners of aquifer
      ctx.beginPath();
      ctx.roundRect(0, 320, width, 60, 10);
      ctx.fill();
      
      // Draw groundwater level with enhanced animation
      const groundwaterLevelY = 320 - (animationState.waterLevel * 2);
      const groundwaterWaveOffset = Math.sin(animationState.currentTime * 1.5) * 3;
      
      // Define flow variables for use throughout the component
      const flowIntensity = Math.max(0.4, Math.min(1.0, animationState.waterLevel / 4)); // Scale flow based on water level
      const flowY = groundwaterLevelY + groundwaterWaveOffset;
      
      // Enhanced groundwater visualization
      ctx.strokeStyle = '#87CEEB';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(0, groundwaterLevelY + groundwaterWaveOffset);
      for (let x = 0; x < width; x += 5) {
        const wave = Math.sin((x + animationState.currentTime * 90) * 0.02) * 4;
        ctx.lineTo(x, groundwaterLevelY + groundwaterWaveOffset + wave);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Add real water flow matching groundwater level (like previous diagram)
      
      // Draw realistic water flow across the aquifer width
      ctx.fillStyle = '#87CEEB';
      ctx.globalAlpha = 0.8 * flowIntensity;
      
      // Create flowing water droplets across the aquifer width
      for (let i = 0; i < 25; i++) {
        const flowX = (animationState.currentTime * 0.8 + i * 35) % (width + 35);
        const flowYPos = flowY + Math.sin(animationState.currentTime * 2.5 + i) * 4;
        const dropletSize = 2.5 + Math.sin(animationState.currentTime * 3.5 + i) * 1.2;
        
        ctx.beginPath();
        ctx.arc(flowX, flowYPos, dropletSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add secondary flow layer for more realistic effect
      ctx.fillStyle = '#B0E0E6';
      ctx.globalAlpha = 0.6 * flowIntensity;
      
      for (let i = 0; i < 18; i++) {
        const flowX = (animationState.currentTime * 0.5 + i * 45) % (width + 45);
        const flowYPos = flowY + Math.sin(animationState.currentTime * 2 + i) * 3;
        const dropletSize = 2 + Math.sin(animationState.currentTime * 3 + i) * 1;
        
        ctx.beginPath();
        ctx.arc(flowX, flowYPos, dropletSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add tertiary flow layer for depth
      ctx.fillStyle = '#E0F6FF';
      ctx.globalAlpha = 0.4 * flowIntensity;
      
      for (let i = 0; i < 12; i++) {
        const flowX = (animationState.currentTime * 0.3 + i * 60) % (width + 60);
        const flowYPos = flowY + Math.sin(animationState.currentTime * 1.5 + i) * 2;
        const dropletSize = 1.5 + Math.sin(animationState.currentTime * 2.5 + i) * 0.8;
        
        ctx.beginPath();
        ctx.arc(flowX, flowYPos, dropletSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add water surface ripples at groundwater level
      ctx.strokeStyle = '#E0F6FF';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7 * flowIntensity;
      
      for (let i = 0; i < 10; i++) {
        const rippleX = (animationState.currentTime * 0.25 + i * 80) % (width + 80);
        const rippleY = flowY + Math.sin(animationState.currentTime * 1.2 + i) * 1.5;
        
        ctx.beginPath();
        ctx.arc(rippleX, rippleY, 10 + Math.sin(animationState.currentTime * 2.5 + i) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      
      // Draw rooftop building
      const rooftop = componentPositions.rooftop;
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(rooftop.x, rooftop.y, rooftop.width, rooftop.height);
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(rooftop.x - 5, rooftop.y - 10, rooftop.width + 10, 10);
      
      // Draw desilting pit
      const pit = componentPositions.desiltingPit;
      ctx.fillStyle = '#A9A9A9';
      ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
      
      // Draw gravel at bottom of desilting pit
      ctx.fillStyle = '#D2B48C';
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(pit.x + 15 + i * 8, pit.y + pit.height - 15 + j * 5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw screen on right side of desilting pit
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(pit.x + pit.width - 5, pit.y + 10 + i * 6);
        ctx.lineTo(pit.x + pit.width - 5, pit.y + 15 + i * 6);
        ctx.stroke();
      }
      
      // Draw recharge well
      const rechargeWell = componentPositions.rechargeWell;
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(rechargeWell.x, rechargeWell.y, rechargeWell.width, rechargeWell.height);
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 2;
      ctx.strokeRect(rechargeWell.x, rechargeWell.y, rechargeWell.width, rechargeWell.height);
      
      // Draw borewell
      const borewell = componentPositions.borewell;
      const borewellRadius = borewell.width / 2;
      const borewellCenterX = borewell.x + borewellRadius;
      
      // Draw outer bore
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(borewell.x - 5, borewell.y, borewell.width + 10, borewell.height);
      
      // Draw PVC casing pipe
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(borewell.x, borewell.y, borewell.width, borewell.height);
      
      // Draw slotted pipe / V-wire screen
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(borewellCenterX - 8, borewell.y + 50 + i * 40);
        ctx.lineTo(borewellCenterX + 8, borewell.y + 50 + i * 40);
        ctx.stroke();
      }
      
      // Draw pea gravel around borewell on both sides of the internal pipe
      ctx.save();
      ctx.beginPath();
      ctx.rect(borewell.x + 1, borewell.y + 1, borewell.width - 2, borewell.height - 2);
      ctx.clip();
      ctx.fillStyle = '#D2B48C';
      const gravelBaseY = borewell.y + 125; // vertical band for gravel rows
      const internalPipeWidthLocal = Math.max(12, Math.min(18, borewell.width * 0.22));
      const leftStartX = (borewellCenterX - internalPipeWidthLocal / 2) - 14; // left cluster start (near pipe)
      const rightStartX = (borewellCenterX + internalPipeWidthLocal / 2) + 14; // right cluster start (near pipe)

      // Left cluster (extend to the left)
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.arc(leftStartX - i * 5, gravelBaseY + j * 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Right cluster (extend to the right)
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.arc(rightStartX + i * 5, gravelBaseY + j * 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      
      // Draw internal pipe for borewell
      const internalPipeStartY = borewell.y + 50 + 40; // second level
      const internalPipeEndY = 320 - 28; // shortened above aquifer
      const internalPipeWidth = Math.max(12, Math.min(18, borewell.width * 0.22));
      const internalPipeX = borewellCenterX - internalPipeWidth / 2;
      const internalPipeHeight = Math.max(0, internalPipeEndY - internalPipeStartY);
      ctx.fillStyle = '#6B7280';
      ctx.globalAlpha = 0.6; // Make internal pipe semi-transparent to show water droplets
      ctx.fillRect(internalPipeX, internalPipeStartY, internalPipeWidth, internalPipeHeight);
      ctx.globalAlpha = 1.0; // Reset alpha for other drawings
      
      // Add water flow from borewell stream to groundwater
      if (animationState.currentTime > 0) {
        const streamToGroundwaterY = flowY;
        const streamToGroundwaterX = borewell.x + borewell.width + 20; // Start from borewell area
        
        // Draw water droplets flowing from borewell stream to groundwater
        ctx.fillStyle = '#87CEEB';
        ctx.globalAlpha = 0.9 * flowIntensity;
        
        for (let i = 0; i < 8; i++) {
          const flowX = streamToGroundwaterX + (animationState.currentTime * 0.4 + i * 25) % (width - streamToGroundwaterX + 25);
          const flowYPos = streamToGroundwaterY + Math.sin(animationState.currentTime * 2 + i) * 2;
          const dropletSize = 3 + Math.sin(animationState.currentTime * 4 + i) * 1.5;
          
          ctx.beginPath();
          ctx.arc(flowX, flowYPos, dropletSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw service borewell
      const serviceBorewell = componentPositions.serviceBorewell;
      const serviceRadius = serviceBorewell.width / 2;
      const serviceCenterX = serviceBorewell.x + serviceRadius;
      
      // Draw outer bore
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(serviceBorewell.x - 5, serviceBorewell.y, serviceBorewell.width + 10, serviceBorewell.height);
      
      // Draw PVC casing pipe
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(serviceBorewell.x, serviceBorewell.y, serviceBorewell.width, serviceBorewell.height);
      
      // Draw internal pipe for service borewell
      const servicePipeStartY = serviceBorewell.y + 20; // Start from near the top
      const servicePipeEndY = 320 - 20; // End near the aquifer
      const servicePipeWidth = Math.max(10, Math.min(16, serviceBorewell.width * 0.25));
      const servicePipeX = serviceCenterX - servicePipeWidth / 2;
      const servicePipeHeight = Math.max(0, servicePipeEndY - servicePipeStartY);
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(servicePipeX, servicePipeStartY, servicePipeWidth, servicePipeHeight);
      
      // Draw submersible pump
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(serviceCenterX - 8, 320 - 20, 16, 20);
      
      // Enhanced water flow animation based on phases
      if (animationState.isPlaying) {
        const totalCycleTime = loopDuration;
        const cycleTime = (animationState.currentTime * animationSettings.speed) % totalCycleTime;
        
        // Debug: Log cycle completion and settings
        if (Math.floor(cycleTime) === 0 && animationState.currentTime > 1) {
          console.log('Animation cycle completed, restarting at cycleTime:', cycleTime, {
            speed: animationSettings.speed,
            phaseDuration: animationSettings.phaseDuration,
            loopDuration: loopDuration,
            autoLoop: animationSettings.autoLoop
          });
        }
        
        // Phase 1: Rooftop to desilting pit
        if (cycleTime <= animationSettings.phaseDuration) {
          const flowProgress = cycleTime / animationSettings.phaseDuration;
          const startX = rooftop.x + rooftop.width;
          const startY = rooftop.y + 2;
          const endX = pit.x;
          const groundY = 120;
          
          // Draw water droplets flowing through the pipe
          if (animationSettings.showWaterDroplets) {
            ctx.fillStyle = '#87CEEB';
            ctx.globalAlpha = 0.8 * animationSettings.waterFlowIntensity;
          const pipeLength = endX - startX;
          const verticalDrop = groundY - startY;
          
          // Vertical drop animation
          if (flowProgress < 0.3) {
            const verticalProgress = flowProgress / 0.3;
            for (let i = 0; i < 4; i++) {
              const dropletY = startY + (verticalProgress * verticalDrop - i * 8) % verticalDrop;
              if (dropletY >= startY && dropletY <= groundY) {
                ctx.beginPath();
                ctx.arc(startX, dropletY, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          
          // Horizontal flow animation
          if (flowProgress >= 0.3) {
            const horizontalProgress = (flowProgress - 0.3) / 0.7;
            for (let i = 0; i < 6; i++) {
              const dropletX = startX + (horizontalProgress * pipeLength - i * 15) % pipeLength;
              if (dropletX >= startX && dropletX <= endX) {
                ctx.beginPath();
                ctx.arc(dropletX, groundY, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          }
          
          // Fill desilting pit progressively
          const pitFillProgress = Math.max(0, (cycleTime - 1) / 4);
          const pitWaterLevel = Math.min(pit.height - 10, pitFillProgress * (pit.height - 10));
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + pit.height - pitWaterLevel, pit.width - 10, pitWaterLevel);
        }
        
        // Phase 2: Desilting pit to recharge well
        if (cycleTime > animationSettings.phaseDuration && cycleTime <= animationSettings.phaseDuration * 2) {
          // Keep desilting pit full
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
          
          // Animate water flow from desilting pit to recharge well
          const flowProgress = (cycleTime - animationSettings.phaseDuration) / animationSettings.phaseDuration;
          const startX = pit.x + pit.width;
          const endX = rechargeWell.x;
          const groundY = 120;
          
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          const pipeLength = endX - startX;
          
          for (let i = 0; i < 6; i++) {
            const dropletX = startX + (flowProgress * pipeLength - i * 15) % pipeLength;
            if (dropletX >= startX && dropletX <= endX) {
              ctx.beginPath();
              ctx.arc(dropletX, groundY, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // Fill recharge well progressively up to pipe level (not completely full in Phase 3)
          const wellFillProgress = Math.max(0, (cycleTime - 10) / 6);
          const pipeLevel = rechargeWell.height * 0.6; // Fill only up to 60% (pipe level)
          const wellWaterLevel = Math.min(pipeLevel, wellFillProgress * pipeLevel);
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(rechargeWell.x + 5, rechargeWell.y + rechargeWell.height - wellWaterLevel, rechargeWell.width - 10, wellWaterLevel);
        }
        
        // Phase 3: Recharge well to borewell
        if (cycleTime > animationSettings.phaseDuration * 2 && cycleTime <= animationSettings.phaseDuration * 3) {
          // Debug: Log phase 3 activation
          if (Math.floor(cycleTime) === 17) {
            console.log('Phase 3 started at cycleTime:', cycleTime);
          }
          // Keep previous components full
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
          ctx.fillRect(rechargeWell.x + 5, rechargeWell.y + 5, rechargeWell.width - 10, rechargeWell.height - 10);
          
          // Animate water flow from recharge well to borewell
          const flowProgress = (cycleTime - animationSettings.phaseDuration * 2) / animationSettings.phaseDuration;
          const startX = rechargeWell.x + rechargeWell.width;
          const endX = borewell.x;
          const groundY = 120;
          
          if (animationSettings.showWaterDroplets) {
            ctx.fillStyle = '#87CEEB';
            ctx.globalAlpha = 0.8 * animationSettings.waterFlowIntensity;
            const pipeLength = endX - startX;
            
            for (let i = 0; i < 8; i++) {
              const dropletX = startX + (flowProgress * pipeLength - i * 12) % pipeLength;
              if (dropletX >= startX && dropletX <= endX) {
                const dropletSize = 2.5 + Math.sin(animationState.currentTime * 4 + i) * 0.5;
                ctx.beginPath();
                ctx.arc(dropletX, groundY, dropletSize, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          
          // Fill borewell progressively until it reaches second screen level
          const borewellFillProgress = Math.max(0, (cycleTime - animationSettings.phaseDuration * 2) / (animationSettings.phaseDuration * 0.75)); // Start filling immediately when phase 3 starts
          const secondScreenLevel = borewell.y + 50 + 40; // second level
          const maxFillToSecondLevel = borewell.y + borewell.height - secondScreenLevel;
          const borewellWaterLevel = Math.min(maxFillToSecondLevel, borewellFillProgress * maxFillToSecondLevel);
          ctx.fillStyle = '#4A90E2';
          ctx.globalAlpha = 0.7;
          ctx.fillRect(borewell.x + 5, borewell.y + borewell.height - borewellWaterLevel, borewell.width - 10, borewellWaterLevel);
          
          // When water reaches second screen level, start flowing through internal pipe
          const waterTop = borewell.y + borewell.height - borewellWaterLevel;
          const hasReachedSecondLevel = waterTop <= secondScreenLevel;
          
          if (hasReachedSecondLevel) {
            const internalPipeStartY = secondScreenLevel;
            const internalPipeEndY = 320 - 28;
            const internalPipeWidth = Math.max(12, Math.min(18, borewell.width * 0.22));
            const internalPipeX = borewellCenterX - internalPipeWidth / 2;
            
            // Calculate flow progress through internal pipe
            const internalFlowProgress = Math.min(1, (cycleTime - (animationSettings.phaseDuration * 2 + animationSettings.phaseDuration * 0.4)) / (animationSettings.phaseDuration * 0.6)); // Start flowing 40% into phase 3
            const pipeHeight = internalPipeEndY - internalPipeStartY;
            const flowDistance = internalFlowProgress * pipeHeight;
            
            // Draw water droplets flowing through internal pipe
            if (animationSettings.showWaterDroplets) {
              for (let layer = 0; layer < 3; layer++) {
                const colors = ['#0066FF', '#1E90FF', '#4A90E2'];
                ctx.fillStyle = colors[layer];
                ctx.globalAlpha = (1.0 - layer * 0.2) * animationSettings.waterFlowIntensity;
                
                for (let i = 0; i < 15; i++) {
                  const dropletY = internalPipeStartY + (flowDistance - i * 3 - layer * 1.2) % pipeHeight;
                  if (dropletY >= internalPipeStartY && dropletY <= internalPipeEndY) {
                    const dropletSize = 2.5 + Math.sin(animationState.currentTime * 4 + i + layer) * 1.0;
                    ctx.beginPath();
                    ctx.arc(internalPipeX + internalPipeWidth / 2, dropletY, dropletSize, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }
              }
            }
          }
        }
        
        // Phase 4: Borewell to service borewell to aquifer
        if (cycleTime > animationSettings.phaseDuration * 3) {
          // Debug: Log phase 4 activation
          if (Math.floor(cycleTime) === 25) {
            console.log('Phase 4 started at cycleTime:', cycleTime);
          }
          // Keep desilting pit full and fill recharge well completely
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
          
          // Fill recharge well completely in Phase 4 (simultaneously with pipe flow)
          const rechargeWellFillProgress = Math.min(1, (cycleTime - animationSettings.phaseDuration * 3) / animationSettings.phaseDuration); // Fill completely over the entire Phase 4 duration
          const fullRechargeWellLevel = rechargeWell.height - 10;
          const rechargeWellWaterLevel = Math.min(fullRechargeWellLevel, rechargeWellFillProgress * fullRechargeWellLevel);
          ctx.fillRect(rechargeWell.x + 5, rechargeWell.y + rechargeWell.height - rechargeWellWaterLevel, rechargeWell.width - 10, rechargeWellWaterLevel);
          
          // Fill borewell to full level with water flowing from internal pipe
          const phase4Progress = (cycleTime - animationSettings.phaseDuration * 3) / animationSettings.phaseDuration;
          const secondScreenLevel = borewell.y + 50 + 40; // second level
          const fullBorewellHeight = borewell.height - 20;
          const maxFillToSecondLevel = borewell.y + borewell.height - secondScreenLevel;
          // Ensure borewell is filled to at least the second screen level, then continue filling
          const borewellWaterLevel = Math.min(fullBorewellHeight, maxFillToSecondLevel + phase4Progress * (fullBorewellHeight - maxFillToSecondLevel));
          ctx.fillStyle = '#4A90E2';
          ctx.globalAlpha = 0.7;
          ctx.fillRect(borewell.x + 5, borewell.y + borewell.height - borewellWaterLevel, borewell.width - 10, borewellWaterLevel);
          
          // Continue water flow through internal pipe to fill borewell from above
          const internalPipeStartY = secondScreenLevel;
          const internalPipeEndY = 320 - 28;
          const internalPipeWidth = Math.max(12, Math.min(18, borewell.width * 0.22));
          const internalPipeX = borewellCenterX - internalPipeWidth / 2;

          // Continuous flow through internal pipe
          const pipeHeight = internalPipeEndY - internalPipeStartY;
          const flowDistance = (phase4Progress * 2) % pipeHeight; // Continuous flow

          // Draw water droplets flowing through internal pipe
          if (animationSettings.showWaterDroplets) {
            for (let layer = 0; layer < 3; layer++) {
              const colors = ['#0066FF', '#1E90FF', '#4A90E2'];
              ctx.fillStyle = colors[layer];
              ctx.globalAlpha = (1.0 - layer * 0.2) * animationSettings.waterFlowIntensity;

              for (let i = 0; i < 15; i++) {
                const dropletY = internalPipeStartY + (flowDistance - i * 3 - layer * 1.2) % pipeHeight;
                if (dropletY >= internalPipeStartY && dropletY <= internalPipeEndY) {
                  const dropletSize = 2.5 + Math.sin(animationState.currentTime * 4 + i + layer) * 1.0;
                  ctx.beginPath();
                  ctx.arc(internalPipeX + internalPipeWidth / 2, dropletY, dropletSize, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }

          // Add enhanced water stream flowing from the internal pipe (starts immediately in Phase 4)
          if (phase4Progress > 0 && animationSettings.showWaterDroplets) { // Start pipe flow immediately when Phase 4 begins
            const streamStartY = internalPipeEndY; // Start from bottom of internal pipe
            const streamEndY = 320; // Flow to ground level
            const streamX = internalPipeX + internalPipeWidth / 2;
            const streamProgress = Math.min(1, phase4Progress); // Start immediately and progress over entire Phase 4
            
            // Draw multiple water streams for enhanced effect
            for (let stream = 0; stream < 3; stream++) {
              const streamOffset = (stream - 1) * 4; // Spread streams horizontally
              const streamXPos = streamX + streamOffset;
              
              // Draw water stream with more droplets
              ctx.fillStyle = stream === 1 ? '#87CEEB' : '#B0E0E6'; // Center stream brighter
              ctx.globalAlpha = (stream === 1 ? 0.95 : 0.8) * animationSettings.waterFlowIntensity; // Center stream more opaque
              
              for (let i = 0; i < 12; i++) { // Increased from 8 to 12 droplets
                const dropletY = streamStartY + (streamProgress * (streamEndY - streamStartY) - i * 6) % (streamEndY - streamStartY);
                if (dropletY >= streamStartY && dropletY <= streamEndY) {
                  const dropletSize = 4 + Math.sin(animationState.currentTime * 5 + i + stream) * 2; // Increased size
                  ctx.beginPath();
                  ctx.arc(streamXPos, dropletY, dropletSize, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
            
            // Add enhanced splashing effect at the bottom
            if (streamProgress > 0.6) { // Start splashing earlier
              ctx.fillStyle = '#B0E0E6';
              ctx.globalAlpha = 0.8 * animationSettings.waterFlowIntensity;
              for (let i = 0; i < 8; i++) { // Increased from 5 to 8 splash droplets
                const splashX = streamX + (Math.sin(animationState.currentTime * 6 + i) * 12); // Increased spread
                const splashY = streamEndY + Math.sin(animationState.currentTime * 8 + i) * 5; // Increased height
                const splashSize = 3 + Math.sin(animationState.currentTime * 7 + i) * 1.5; // Increased size
                ctx.beginPath();
                ctx.arc(splashX, splashY, splashSize, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            
            // Add water spray effect around the stream
            if (streamProgress > 0.4) {
              ctx.fillStyle = '#E0F6FF';
              ctx.globalAlpha = 0.6 * animationSettings.waterFlowIntensity;
              for (let i = 0; i < 6; i++) {
                const sprayX = streamX + (Math.sin(animationState.currentTime * 4 + i) * 15);
                const sprayY = streamStartY + (streamProgress * (streamEndY - streamStartY) * 0.7) + Math.sin(animationState.currentTime * 6 + i) * 8;
                const spraySize = 2 + Math.sin(animationState.currentTime * 5 + i) * 1;
                ctx.beginPath();
                ctx.arc(sprayX, sprayY, spraySize, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          
          
        }
        
        ctx.globalAlpha = 1;
      }
      
      // Draw pipes
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.6;
      
      // Pipe from rooftop to pit
      ctx.beginPath();
      ctx.moveTo(rooftop.x + rooftop.width, rooftop.y + 2);
      ctx.lineTo(rooftop.x + rooftop.width, 120);
      ctx.lineTo(pit.x, 120);
      ctx.stroke();
      
      // Pipe from pit to recharge well
      ctx.beginPath();
      ctx.moveTo(pit.x + pit.width, 120);
      ctx.lineTo(rechargeWell.x, 120);
      ctx.stroke();
      
      // Pipe from recharge well to borewell
      ctx.beginPath();
      ctx.moveTo(rechargeWell.x + rechargeWell.width, 120);
      ctx.lineTo(borewell.x, 120);
      ctx.stroke();
      
      
      
      ctx.globalAlpha = 1;
      
      // Draw labels with arrows
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px Arial';
      
      // Rooftop label with arrow
      ctx.fillText('ROOFTOP', 70, 60);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 80);
      ctx.lineTo(100, 95);
      ctx.lineTo(98, 93);
      ctx.moveTo(100, 95);
      ctx.lineTo(102, 93);
      ctx.stroke();
      
      // Desilting Pit label
      ctx.fillText('DESILTING PIT', 250, 90);
      
      // Add right arrow for desilting pit
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(310, 120);
      ctx.lineTo(320, 120);
      ctx.lineTo(318, 118);
      ctx.moveTo(320, 120);
      ctx.lineTo(318, 122);
      ctx.stroke();
      
      // Recharge Well label
      ctx.fillText('RECHARGE PIT/TRENCH/SHAFT', 370, 65);
      
      // Add right arrow for recharge well
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(460, 120);
      ctx.lineTo(470, 120);
      ctx.lineTo(468, 118);
      ctx.moveTo(470, 120);
      ctx.lineTo(468, 122);
      ctx.stroke();
      
      // Borewell label with arrow
      ctx.fillText('RECHARGE WELL', 520, 90);
      ctx.beginPath();
      ctx.moveTo(565, 130);
      ctx.lineTo(565, 145);
      ctx.lineTo(563, 143);
      ctx.moveTo(565, 145);
      ctx.lineTo(567, 143);
      ctx.stroke();
      
      // Service Well label with arrow
      ctx.fillText('SERVICE BOREWELL', 680, 70);
      ctx.beginPath();
      ctx.moveTo(700, 180);
      ctx.lineTo(700, 195);
      ctx.lineTo(698, 193);
      ctx.moveTo(700, 195);
      ctx.lineTo(702, 193);
      ctx.stroke();
      
      // Draw phase indicator
      if (animationState.isPlaying && animationSettings.showPhaseIndicators) {
        const totalCycleTime = loopDuration;
        const cycleTime = (animationState.currentTime * animationSettings.speed) % totalCycleTime;
        let phaseText = '';
        let phaseColor = '#4A90E2';
        
        if (cycleTime <= animationSettings.phaseDuration) {
          phaseText = 'Phase 1: Rooftop → Desilting Pit';
          phaseColor = '#87CEEB';
        } else if (cycleTime <= animationSettings.phaseDuration * 2) {
          phaseText = 'Phase 2: Desilting Pit → Recharge Pit/Trench/Shaft';
          phaseColor = '#87CEEB';
        } else if (cycleTime <= animationSettings.phaseDuration * 3) {
          phaseText = 'Phase 3: Recharge Pit/Trench/Shaft → Recharge Well (Up to Pipe Level)';
          phaseColor = '#4A90E2';
        } else {
          phaseText = 'Phase 4: Recharge Well Fills + Pipe Water Flows';
          phaseColor = '#4A90E2';
        }
        
        // Enhanced phase indicator background (smaller size)
        const gradient = ctx.createLinearGradient(10, 10, 10, 30);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(10, 10, 300, 20);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 300, 20);
        
        ctx.fillStyle = phaseColor;
        ctx.font = 'bold 12px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(phaseText, 15, 24);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Draw groundwater level info
      ctx.fillStyle = '#87CEEB';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`Groundwater Level: ${animationState.waterLevel.toFixed(1)}m`, 10, groundwaterLevelY + groundwaterWaveOffset - 10);
      
      // Draw cycle and data info
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText(`Cycle: ${animationState.cycleCount} | Phase: ${animationState.animationPhase + 1}/4`, 10, height - 40);
      
      if (groundwaterData) {
        ctx.fillText(`Location: ${groundwaterData.location.name}`, 10, height - 20);
      }
      } catch (error) {
        console.error('Canvas rendering error:', error);
      }
    };

    render();
  }, [animationState, groundwaterData, componentPositions, loopDuration, animationSettings]);

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

  const togglePlayPause = () => {
    setAnimationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const resetAnimation = () => {
    setAnimationState(prev => ({ 
      ...prev, 
      currentTime: 0, 
      cycleCount: 0,
      animationPhase: 0,
      phaseProgress: 0
    }));
  };

  const refreshData = () => {
    fetchGroundwaterData();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check which component was clicked
    const components = Object.entries(componentPositions);
    for (const [name, pos] of components) {
      if (x >= pos.x && x <= pos.x + pos.width && y >= pos.y && y <= pos.y + pos.height) {
        setSelectedComponent(name);
        return;
      }
    }
    
    setSelectedComponent(null);
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg"
        onClick={handleCanvasClick}
        style={{ minHeight: '400px' }}
      />
      
      {showControls && (
        <div className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded backdrop-blur-sm min-w-[100px]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlayPause}
                className="px-1 py-0.5 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-xs"
                title={animationState.isPlaying ? 'Pause' : 'Play'}
              >
                {animationState.isPlaying ? <FiPause /> : <FiPlay />}
              </button>
              <button
                onClick={resetAnimation}
                className="px-1 py-0.5 bg-gray-600 rounded hover:bg-gray-700 transition-colors text-xs"
                title="Reset Animation"
              >
                <FiRefreshCw />
              </button>
              <button
                onClick={refreshData}
                className="px-1 py-0.5 bg-green-600 rounded hover:bg-green-700 transition-colors text-xs"
                title="Refresh Data"
                disabled={isLoading}
              >
                <FiSettings className={isLoading ? 'animate-spin' : ''} />
              </button>
              <span className="text-xs font-medium">Auto-Play Controls</span>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <label className="text-xs block mb-1 font-medium">
                Groundwater Level: {animationState.waterLevel.toFixed(1)}m
                {isLoading && <span className="text-blue-400 ml-2">🔄</span>}
              </label>
              <div className="text-xs text-gray-400">
                Real-time data from groundwater APIs
              </div>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={animationState.isPlaying ? 'text-green-400' : 'text-yellow-400'}>
                    {animationState.isPlaying ? 'Auto-Playing' : 'Paused'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cycle:</span>
                  <span className="text-purple-400">{animationState.cycleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase:</span>
                  <span className="text-blue-400">{animationState.animationPhase + 1}/4</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className={isLoading ? 'text-yellow-400' : error ? 'text-red-400' : 'text-green-400'}>
                    {isLoading ? 'Loading...' : error ? 'Error' : 'Live'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <label className="text-sm block mb-1 font-medium">System Components</label>
              <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Desilting Pit:</span>
                <span className="text-green-300">80×60cm + Gravel</span>
              </div>
                <div className="flex justify-between">
                  <span>Recharge Pit/Trench/Shaft:</span>
                  <span className="text-orange-300">100×80cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Recharge Well Depth:</span>
                  <span className="text-purple-300">200cm + Gravel</span>
                </div>
                {groundwaterData && (
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-blue-300">{groundwaterData.location.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <label className="text-sm block mb-1 font-medium">Data Source</label>
              <div className="text-xs text-gray-300">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <span className="text-green-400">{dataSource}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Component Info */}
      {selectedComponent && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm max-w-xs">
          <h3 className="font-bold mb-1 text-xs">Selected: {selectedComponent}</h3>
          <div className="text-xs">
            {selectedComponent === 'desiltingPit' && (
              <div>
                <div>Size: 80×60cm</div>
                <div>Components: Gravel bed, Screen filter</div>
                <div>Function: Sediment removal & filtration</div>
                <div>Gravel: 3cm layer at bottom</div>
              </div>
            )}
            {selectedComponent === 'rechargeWell' && (
              <div>
                <div>Size: 100×80cm</div>
                <div>Components: Filter material, PVC mesh</div>
                <div>Function: Water filtration</div>
              </div>
            )}
            {selectedComponent === 'borewell' && (
              <div>
                <div>Depth: 200cm</div>
                <div>Diameter: 140-200mm PVC casing</div>
                <div>Components: Slotted pipe, Pea gravel pack</div>
                <div>Gravel: 2cm pea gravel around pipe</div>
              </div>
            )}
            {selectedComponent === 'serviceBorewell' && (
              <div>
                <div>Depth: 200cm</div>
                <div>Function: Water extraction (standalone)</div>
                <div>Components: Submersible pump, Internal pipe</div>
                <div>Status: Not connected to rainwater system</div>
              </div>
            )}
            {selectedComponent === 'aquifer' && (
              <div>
                <div>Water Level: {animationState.waterLevel.toFixed(1)}m</div>
                <div>Type: Groundwater aquifer</div>
                <div>Status: Recharging</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Data source info */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-400'}`}></div>
          <span>{dataSource}</span>
        </div>
        {error && (
          <div className="text-red-300 mt-1">
            {error}
          </div>
        )}
      </div>

      {/* Animation Settings Panel */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Animation Settings</h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            {showSettings ? '▼' : '▶'}
          </button>
        </div>
        
        {showSettings && (
          <div className="space-y-3 text-xs">
            {/* Animation Speed */}
            <div>
              <label className="block text-gray-300 mb-1">Animation Speed</label>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={animationSettings.speed}
                onChange={(e) => setAnimationSettings(prev => ({
                  ...prev,
                  speed: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <div className="text-gray-400 text-xs mt-1">{animationSettings.speed}x</div>
            </div>

            {/* Phase Duration */}
            <div>
              <label className="block text-gray-300 mb-1">Phase Duration (seconds)</label>
              <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={animationSettings.phaseDuration}
                onChange={(e) => setAnimationSettings(prev => ({
                  ...prev,
                  phaseDuration: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <div className="text-gray-400 text-xs mt-1">{animationSettings.phaseDuration}s per phase</div>
            </div>

            {/* Water Flow Intensity */}
            <div>
              <label className="block text-gray-300 mb-1">Water Flow Intensity</label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={animationSettings.waterFlowIntensity}
                onChange={(e) => setAnimationSettings(prev => ({
                  ...prev,
                  waterFlowIntensity: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <div className="text-gray-400 text-xs mt-1">{animationSettings.waterFlowIntensity}x</div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={animationSettings.showWaterDroplets}
                  onChange={(e) => setAnimationSettings(prev => ({
                    ...prev,
                    showWaterDroplets: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-300">Show Water Droplets</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={animationSettings.showPhaseIndicators}
                  onChange={(e) => setAnimationSettings(prev => ({
                    ...prev,
                    showPhaseIndicators: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-300">Show Phase Indicators</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={animationSettings.autoLoop}
                  onChange={(e) => setAnimationSettings(prev => ({
                    ...prev,
                    autoLoop: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-300">Auto Loop</span>
              </label>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setAnimationSettings({
                speed: 2.0,
                phaseDuration: 8,
                waterFlowIntensity: 1.0,
                showWaterDroplets: true,
                showPhaseIndicators: true,
                autoLoop: true
              })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs transition-colors"
            >
              Reset to Default
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRainwaterSchematic;
