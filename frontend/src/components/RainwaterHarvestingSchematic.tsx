import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RainwaterHarvestingSchematicProps {
  waterLevel: number;
  animationTime: number;
  isPlaying: boolean;
  onLevelChange: (level: number) => void;
  onTogglePlay?: () => void;
  dataSource?: string;
  isLoading?: boolean;
  groundwaterDepth?: number;
  lat?: number;
  lon?: number;
  aquiferName?: string;
  soilType?: string;
  soilColor?: string;
}

interface ComponentLabel {
  text: string;
  x: number;
  y: number;
  arrowX?: number;
  arrowY?: number;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
}

const RainwaterHarvestingSchematic: React.FC<RainwaterHarvestingSchematicProps> = ({
  waterLevel,
  animationTime,
  isPlaying,
  onLevelChange,
  onTogglePlay,
  dataSource = 'India WRIS (Primary)',
  isLoading = false,
  groundwaterDepth = 12,
  lat = 22.5,
  lon = 77.0,
  aquiferName,
  soilType,
  soilColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [realTimeWaterLevel, setRealTimeWaterLevel] = useState(waterLevel);
  const [apiLoading, setApiLoading] = useState(false);

  // Colors for key structures (tweak as desired)
  // Use the same palette as the rooftop: fill #9CA3AF (gray-400), border #4B5563 (gray-700)
  const COLORS = {
    rechargeWellFill: '#9CA3AF',
    rechargeWellBorder: '#4B5563',
    serviceBorewellFill: '#9CA3AF',
    serviceBorewellBorder: '#4B5563'
  } as const;

  // Fetch real-time aquifer depth data
  const fetchAquiferDepth = async (lat: number, lon: number): Promise<number> => {
    try {
      setApiLoading(true);
      const url = `/api/aquifer-depth?lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch aquifer depth');
      const data = await res.json();
      return data.depth_m || groundwaterDepth;
    } catch (error) {
      console.warn('Using fallback aquifer depth:', error);
      return groundwaterDepth;
    } finally {
      setApiLoading(false);
    }
  };

  // Real-time aquifer depth updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAquiferDepth(lat, lon).then((depth) => {
        setRealTimeWaterLevel(depth);
        onLevelChange(depth);
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lat, lon, groundwaterDepth, onLevelChange]);

  // Update real-time water level when prop changes
  useEffect(() => {
    setRealTimeWaterLevel(waterLevel);
  }, [waterLevel]);

  // Component dimensions and positions
  const componentPositions = {
    // Surface components
    rooftop: { x: 50, y: 80, width: 80, height: 40 },
    desiltingPit: { x: 250, y: 100, width: 80, height: 60 },
    rechargeWell: { x: 380, y: 100, width: 100, height: 80 },
    
    // Underground components
    borewell: { x: 520, y: 100, width: 90, height: 160 },
    serviceBorewell: { x: 680, y: 100, width: 40, height: 200 },
    
    // Aquifer
    aquifer: { x: 0, y: 320, width: 800, height: 60 }
  };

  // Canvas setup effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      // Set canvas size with high DPI
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    setupCanvas();

    // Handle window resize
    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Basic components drawing function
  const drawBasicComponents = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    // Draw rooftop building
    const rooftop = componentPositions.rooftop;
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(rooftop.x, rooftop.y, rooftop.width, rooftop.height);
    
    // Draw roof
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(rooftop.x - 5, rooftop.y - 10, rooftop.width + 10, 10);
    
    // Draw desilting pit
    const pit = componentPositions.desiltingPit;
    ctx.fillStyle = '#A9A9A9';
    ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
    
    // Draw borewell
    const borewell = componentPositions.borewell;
    ctx.fillStyle = '#6B7280';
    ctx.fillRect(borewell.x, borewell.y, borewell.width, borewell.height);
    
    // Draw service borewell
    const serviceBorewell = componentPositions.serviceBorewell;
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(serviceBorewell.x, serviceBorewell.y, serviceBorewell.width, serviceBorewell.height);
    
    // Draw basic pipes
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    // Pipe from rooftop to pit
    ctx.beginPath();
    ctx.moveTo(rooftop.x + rooftop.width, rooftop.y + 2);
    ctx.lineTo(rooftop.x + rooftop.width, 120);
    ctx.lineTo(pit.x, 120);
    ctx.stroke();
    
    // Pipe from pit to borewell
    ctx.beginPath();
    ctx.moveTo(pit.x + pit.width, 120);
    ctx.lineTo(borewell.x, 120);
    ctx.stroke();
    
    // Pipe from borewell to service borewell
    ctx.beginPath();
    ctx.moveTo(borewell.x + borewell.width, 120);
    ctx.lineTo(serviceBorewell.x, 120);
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Rooftop', rooftop.x, rooftop.y - 5);
    ctx.fillText('Desilting Pit', pit.x, pit.y - 5);
    ctx.fillText('Recharge Well', borewell.x, borewell.y - 5);
    ctx.fillText('Service Well', serviceBorewell.x, serviceBorewell.y - 5);
  };

  // Static render function
  const renderStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    
    // Draw sky background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 120);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvasWidth, 120);
    
    // Draw soil layers (extend up to ground, remove green surface band)
    const soilGradient = ctx.createLinearGradient(0, 120, 0, 320);
    soilGradient.addColorStop(0, '#8B4513');
    soilGradient.addColorStop(0.5, '#A0522D');
    soilGradient.addColorStop(1, '#654321');
    ctx.fillStyle = soilGradient;
    ctx.fillRect(0, 120, canvasWidth, 200);
    
    // Draw aquifer at bottom
    const aquiferGradient = ctx.createLinearGradient(0, 320, 0, 380);
    aquiferGradient.addColorStop(0, '#4A90E2');
    aquiferGradient.addColorStop(1, '#2E5BBA');
    ctx.fillStyle = aquiferGradient;
    ctx.fillRect(0, 320, canvasWidth, 60);
    
    // Draw water level in aquifer
    const waterY = 320 + (60 * (1 - waterLevel / 20)); // Scale water level to aquifer height
    ctx.fillStyle = 'rgba(135, 206, 235, 0.8)';
    ctx.fillRect(0, waterY, canvasWidth, 380 - waterY);
    
    // Draw basic components (simplified for static render)
    drawBasicComponents(ctx, canvasWidth, canvasHeight);
  };

  // Static render effect
  useEffect(() => {
    renderStatic();
  }, [waterLevel, soilType, soilColor, aquiferName]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const canvasWidth = canvas.offsetWidth;
      const canvasHeight = canvas.offsetHeight;
      
      // Draw sky background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 120);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvasWidth, 120);
      
      // Draw soil layers (extend up to ground, remove green surface band)
      const soilGradient = ctx.createLinearGradient(0, 120, 0, 320);
      soilGradient.addColorStop(0, '#8B4513');
      soilGradient.addColorStop(0.5, '#A0522D');
      soilGradient.addColorStop(1, '#654321');
      ctx.fillStyle = soilGradient;
      ctx.fillRect(0, 120, canvasWidth, 200);
      
      // Draw aquifer at bottom
      const aquiferGradient = ctx.createLinearGradient(0, 320, 0, 380);
      aquiferGradient.addColorStop(0, '#4A90E2');
      aquiferGradient.addColorStop(1, '#0066CC');
      ctx.fillStyle = aquiferGradient;
      ctx.fillRect(0, 320, canvasWidth, 60);
      
      // Draw groundwater level indicator between soil and aquifer
      const groundwaterLevelY = 320 - (realTimeWaterLevel * 2); // Convert meters to pixels (1m = 2px)
      const groundwaterWaveOffset = Math.sin(animationTime * 1.5) * 3; // Wave animation
      
      // Draw groundwater level line
      ctx.strokeStyle = '#87CEEB';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(0, groundwaterLevelY + groundwaterWaveOffset);
      for (let x = 0; x < canvasWidth; x += 5) {
        const wave = Math.sin((x + animationTime * 90) * 0.02) * 4;
        ctx.lineTo(x, groundwaterLevelY + groundwaterWaveOffset + wave);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Add groundwater level label
      ctx.fillStyle = '#87CEEB';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`Groundwater Level: ${realTimeWaterLevel.toFixed(1)}m`, 10, groundwaterLevelY + groundwaterWaveOffset - 10);
      
      // Draw rooftop building (updated colors)
      const rooftop = componentPositions.rooftop;
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(rooftop.x, rooftop.y, rooftop.width, rooftop.height);
      
      // Draw roof
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(rooftop.x - 5, rooftop.y - 10, rooftop.width + 10, 10);
      
      // Draw desilting pit
      const pit = componentPositions.desiltingPit;
      ctx.fillStyle = '#A9A9A9';
      ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
      
      // L-shaped pipe from rooftop to desilting pit at ground level
      {
        const groundY = 120; // ground surface level
        const startX = rooftop.x + rooftop.width; // right edge of rooftop
        const startY = rooftop.y + 2; // reduce a bit more so it starts just below roof top
        const endX = pit.x; // left edge of desilting pit
        ctx.strokeStyle = '#6B7280';
        ctx.globalAlpha = 0.6; // Make pipe semi-transparent to show water droplets
        ctx.lineWidth = 10; // increased width to better show water flow
        ctx.lineCap = 'round';
        // Vertical drop to ground
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, groundY);
        ctx.stroke();
        // Horizontal run at ground level to the pit
        ctx.beginPath();
        ctx.moveTo(startX, groundY);
        ctx.lineTo(endX, groundY);
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset alpha for other drawings
      }
      
      // Baffle inside desilting pit removed as requested
      
      // Draw gravel at bottom of pit
      ctx.fillStyle = '#D2B48C';
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(pit.x + 15 + i * 8, pit.y + pit.height - 15 + j * 5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw screen on right side of pit
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(pit.x + pit.width - 5, pit.y + 10 + i * 6);
        ctx.lineTo(pit.x + pit.width - 5, pit.y + 15 + i * 6);
        ctx.stroke();
      }
      
      // Draw recharge well (pit/trench/shaft/filter pit)
      const rechargeWell = componentPositions.rechargeWell;
      ctx.fillStyle = COLORS.rechargeWellFill;
      ctx.fillRect(rechargeWell.x, rechargeWell.y, rechargeWell.width, rechargeWell.height);
      ctx.strokeStyle = COLORS.rechargeWellBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(rechargeWell.x, rechargeWell.y, rechargeWell.width, rechargeWell.height);
      
      // Ground-level pipe connecting desilting pit to recharge pit/trench/shaft
      {
        const groundY = 120;
        ctx.strokeStyle = '#6B7280';
        ctx.globalAlpha = 0.6; // Make pipe semi-transparent to show water droplets
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pit.x + pit.width, groundY);
        ctx.lineTo(rechargeWell.x, groundY);
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset alpha for other drawings
      }
      
      // Ground-level pipe connecting recharge pit/trench/shaft to borewell
      // (will be drawn after borewell is declared)
      
      // Removed yellow filter material box and mesh inside recharge well
      
      // Draw borewell (recharge well between shaft and service borewell)
      const borewell = componentPositions.borewell;
      const borewellRadius = borewell.width / 2;
      const borewellCenterX = borewell.x + borewellRadius;
      
      // Draw outer bore (250mm/350mm dia)
      ctx.fillStyle = COLORS.rechargeWellBorder;
      ctx.fillRect(borewell.x - 5, borewell.y, borewell.width + 10, borewell.height);
      
      // Draw PVC casing pipe (140mm/200mm dia)
      ctx.fillStyle = COLORS.rechargeWellFill;
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
      
      // Phase 3: Recharge shaft to borewell (10-15 seconds)
      if (isPlaying) {
        const totalCycleTime = 20;
        const cycleTime = (animationTime * 2) % totalCycleTime;
        
        // Keep desilting pit and recharge pit/trench/shaft full after their phases
        if (cycleTime > 5) {
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
        }
        if (cycleTime > 10) {
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(rechargeWell.x + 5, rechargeWell.y + 5, rechargeWell.width - 10, rechargeWell.height - 10);
        }
        
        if (cycleTime > 10 && cycleTime <= 15) {
          // Animate water flow from recharge pit/trench/shaft to borewell
          const flowProgress = (cycleTime - 10) / 5;
          const startX = rechargeWell.x + rechargeWell.width;
          const endX = borewell.x;
          const groundY = 120;
          
          // Pipe is now drawn in the main drawing section for constant visibility
          
          // Draw water droplets flowing through the pipe (same style as other pipes)
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          const pipeLength = endX - startX;
          
          for (let i = 0; i < 8; i++) {
            const dropletX = startX + (flowProgress * pipeLength - i * 12) % pipeLength;
            if (dropletX >= startX && dropletX <= endX) {
              const dropletSize = 2.5 + Math.sin(animationTime * 4 + i) * 0.5;
              ctx.beginPath();
              ctx.arc(dropletX, groundY, dropletSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // Water flow complete - consistent with other pipes
          
          // Fill borewell progressively
          const borewellFillProgress = Math.max(0, (cycleTime - 10.5) / 4.5); // Start filling after 10.5 seconds
          
          // Calculate second screen level (internal pipe start)
          const secondScreenLevel = borewell.y + 50 + 40; // second level
          const maxFillHeight = borewell.y + borewell.height - secondScreenLevel; // Only fill up to second level
          const borewellWaterLevel = Math.min(maxFillHeight, borewellFillProgress * maxFillHeight);
          ctx.fillStyle = '#4A90E2';
          ctx.globalAlpha = 0.7;
          ctx.fillRect(borewell.x + 5, borewell.y + borewell.height - borewellWaterLevel, borewell.width - 10, borewellWaterLevel);
        }
        
        ctx.globalAlpha = 1;
      }
      
      // Phase 4: Borewell to aquifer through internal pipe (15-20 seconds)
      if (isPlaying) {
        const totalCycleTime = 20;
        const cycleTime = (animationTime * 2) % totalCycleTime;
        
        // Keep all previous components full
        if (cycleTime > 5) {
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
        }
        if (cycleTime > 10) {
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(rechargeWell.x + 5, rechargeWell.y + 5, rechargeWell.width - 10, rechargeWell.height - 10);
        }
        
        if (cycleTime > 15 && cycleTime <= 20) {
          // Continue filling borewell during phase 4
          // Calculate second screen level (internal pipe start)
          const secondScreenLevelPhase4 = borewell.y + 50 + 40; // second level
          const maxFillHeightPhase4 = borewell.y + borewell.height - secondScreenLevelPhase4; // Only fill up to second level
          
          // In phase 4, continue filling from where phase 3 left off (at second level) to FULL level
          const phase3EndProgress = 1.0; // Phase 3 completed at second level
          const phase4Progress = Math.max(0, (cycleTime - 15) / 5); // Phase 4 progress (0-1)
          const totalProgress = Math.min(1.0, phase3EndProgress + phase4Progress * 0.8); // Continue filling to full level
          const borewellWaterLevel = Math.min(borewell.height - 20, totalProgress * (borewell.height - 20)); // Fill to full height
          
          // Draw the current borewell water level
          ctx.fillStyle = '#4A90E2';
          ctx.globalAlpha = 0.7;
          ctx.fillRect(borewell.x + 5, borewell.y + borewell.height - borewellWaterLevel, borewell.width - 10, borewellWaterLevel);
          
          // Check if water level has reached the second screen level (internal pipe start)
          const waterTop = borewell.y + borewell.height - borewellWaterLevel;
          const hasReachedSecondLevel = waterTop <= secondScreenLevelPhase4;
          
          // In phase 4, water should always be flowing through internal pipe since we start from second level
          const shouldFlowThroughPipe = true; // Always flow in phase 4
          
          // Calculate when water first reached the second screen level
          const secondLevelProgress = (secondScreenLevelPhase4 - borewell.y) / (borewell.height - 20);
          const timeWhenReachedSecondLevel = 10.5 + (secondLevelProgress * 4.5); // When water reaches second level
          
          // Animate water flow through internal pipe when water reaches second level
          if (shouldFlowThroughPipe) {
            const internalPipeStartY = secondScreenLevelPhase4;
            const internalPipeEndY = 320 - 28; // above aquifer
            const internalPipeWidth = Math.max(12, Math.min(18, borewell.width * 0.22));
            const internalPipeX = borewellCenterX - internalPipeWidth / 2;
            
            // Calculate flow progress based on phase 4 progress (simpler since we always flow in phase 4)
            const flowProgress = Math.min(1, phase4Progress); // Flow progresses with phase 4
            
            // Draw water droplets flowing through the internal pipe with enhanced visibility
            const pipeHeight = internalPipeEndY - internalPipeStartY;
            const flowDistance = flowProgress * pipeHeight;
            
            // Create multiple layers of water droplets for maximum visibility (ENHANCED)
            for (let layer = 0; layer < 8; layer++) {
              // More color variations for additional layers
              const colors = ['#0066FF', '#1E90FF', '#4A90E2', '#87CEEB', '#B0E0E6', '#E0F6FF', '#00BFFF', '#0080FF'];
              ctx.fillStyle = colors[layer];
              ctx.globalAlpha = 1.0 - layer * 0.08; // Reduced alpha reduction for more visibility
              
              for (let i = 0; i < 30; i++) { // Increased from 20 to 30 droplets
                const dropletY = internalPipeStartY + (flowDistance - i * 3 - layer * 1.2) % pipeHeight; // Closer spacing
                if (dropletY >= internalPipeStartY && dropletY <= internalPipeEndY) {
                  // Larger droplet size for more prominent stream
                  const dropletSize = 3.5 + Math.sin(animationTime * 4 + i + layer) * 1.8; // Increased size
                  ctx.beginPath();
                  ctx.arc(internalPipeX + internalPipeWidth / 2, dropletY, dropletSize, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
            
            // Add additional side layers for even more density (ENHANCED)
            for (let sideLayer = 0; sideLayer < 5; sideLayer++) { // Increased from 3 to 5 layers
              ctx.fillStyle = sideLayer === 0 ? '#0066FF' : sideLayer === 1 ? '#1E90FF' : sideLayer === 2 ? '#4A90E2' : sideLayer === 3 ? '#87CEEB' : '#00BFFF';
              ctx.globalAlpha = 0.8 - sideLayer * 0.15; // Higher opacity
              
              for (let i = 0; i < 25; i++) { // Increased from 15 to 25 droplets
                const offsetX = (sideLayer - 2) * 2.5; // Offset droplets to the sides
                const dropletY = internalPipeStartY + (flowDistance - i * 4 - sideLayer * 1.5) % pipeHeight; // Closer spacing
                if (dropletY >= internalPipeStartY && dropletY <= internalPipeEndY) {
                  const dropletSize = 2.8 + Math.sin(animationTime * 3.5 + i + sideLayer) * 1.2; // Larger size
                  ctx.beginPath();
                  ctx.arc(internalPipeX + internalPipeWidth / 2 + offsetX, dropletY, dropletSize, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
            
            // Add multiple flowing water stream effects for enhanced visibility (ENHANCED)
            for (let stream = 0; stream < 5; stream++) { // Increased from 3 to 5 streams
              const streamColors = ['#0066FF', '#1E90FF', '#4A90E2', '#87CEEB', '#00BFFF'];
              ctx.strokeStyle = streamColors[stream];
              ctx.lineWidth = 12 - stream * 2; // Increased line width
              ctx.globalAlpha = 0.95 - stream * 0.15; // Higher opacity
              ctx.setLineDash([8, 4]); // Slightly different dash pattern
              ctx.beginPath();
              ctx.moveTo(internalPipeX + internalPipeWidth / 2, internalPipeStartY);
              ctx.lineTo(internalPipeX + internalPipeWidth / 2, internalPipeStartY + flowDistance);
              ctx.stroke();
            }
            ctx.setLineDash([]);
            
            // Add enhanced pulsing glow effect around the internal pipe (ENHANCED)
            const glowIntensity = Math.sin(animationTime * 6) * 0.5 + 0.7; // Increased intensity
            for (let glow = 0; glow < 4; glow++) { // Increased from 2 to 4 glow layers
              ctx.strokeStyle = `rgba(0, 102, 255, ${glowIntensity * (0.9 - glow * 0.2)})`; // Higher opacity
              ctx.lineWidth = 20 - glow * 3; // Increased line width
              ctx.globalAlpha = 0.6 - glow * 0.1; // Higher alpha
              ctx.beginPath();
              ctx.moveTo(internalPipeX + internalPipeWidth / 2, internalPipeStartY);
              ctx.lineTo(internalPipeX + internalPipeWidth / 2, internalPipeEndY);
              ctx.stroke();
            }
            
            // Blue horizontal lines removed as requested
            
            // Show internal pipe connection immediately when water starts flowing
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            ctx.moveTo(borewellCenterX, internalPipeStartY);
            ctx.lineTo(borewellCenterX, internalPipeEndY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Add water accumulation above aquifer when flow reaches the end
            if (flowProgress > 0.2) {
              const aquiferY = 320;
              const accumulationHeight = Math.min(20, (flowProgress - 0.2) * 50);
              ctx.fillStyle = '#1E90FF';
              ctx.globalAlpha = 0.8;
              ctx.fillRect(borewell.x + 5, aquiferY - accumulationHeight, borewell.width - 10, accumulationHeight);
              
              // Add water droplets falling from the pipe end (ENHANCED)
              for (let i = 0; i < 15; i++) { // Increased from 8 to 15 droplets
                const dropY = internalPipeEndY + (flowProgress - 0.2) * 25 + i * 2.5; // Increased fall distance
                if (dropY < aquiferY) {
                  const dropSize = 2.5 + Math.sin(animationTime * 6 + i) * 0.8; // Larger size
                  ctx.fillStyle = '#1E90FF';
                  ctx.globalAlpha = 0.95; // Higher opacity
                  ctx.beginPath();
                  ctx.arc(borewellCenterX, dropY, dropSize, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              
              // Show connection line from borewell to aquifer when water flows
              ctx.strokeStyle = '#1E90FF';
              ctx.lineWidth = 3;
              ctx.globalAlpha = 0.8;
              ctx.setLineDash([8, 4]);
              ctx.beginPath();
              ctx.moveTo(borewellCenterX, internalPipeEndY);
              ctx.lineTo(borewellCenterX, aquiferY);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Add pulsing effect to the connection line
              const pulseIntensity = Math.sin(animationTime * 5) * 0.4 + 0.6;
              ctx.strokeStyle = `rgba(30, 144, 255, ${pulseIntensity})`;
              ctx.lineWidth = 5;
              ctx.globalAlpha = 0.5;
              ctx.beginPath();
              ctx.moveTo(borewellCenterX, internalPipeEndY);
              ctx.lineTo(borewellCenterX, aquiferY);
              ctx.stroke();
            }
          }
        }
        
        ctx.globalAlpha = 1;
      }
      
      // Thick internal pipe inside the borewell (same style as service borewell)
      // Starts from the second screen level and ends slightly above the aquifer
      const internalPipeStartY = borewell.y + 50 + 40; // second level
      const internalPipeEndY = 320 - 28; // shortened a bit more above aquifer
      const internalPipeWidth = Math.max(12, Math.min(18, borewell.width * 0.22));
      const internalPipeX = borewellCenterX - internalPipeWidth / 2;
      const internalPipeHeight = Math.max(0, internalPipeEndY - internalPipeStartY);
      ctx.fillStyle = '#6B7280';
      ctx.globalAlpha = 0.6; // Make internal pipe semi-transparent to show water droplets
      ctx.fillRect(internalPipeX, internalPipeStartY, internalPipeWidth, internalPipeHeight);
      ctx.globalAlpha = 1.0; // Reset alpha for other drawings
      // No border for the internal pipe as requested
      
      // Ground-level pipe connecting recharge pit/trench/shaft to borewell
      {
        const groundY = 120;
        ctx.strokeStyle = '#6B7280';
        ctx.globalAlpha = 0.6; // Make pipe semi-transparent to show water droplets
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rechargeWell.x + rechargeWell.width, groundY);
        ctx.lineTo(borewell.x, groundY);
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset alpha for other drawings
      }

      // Draw pea gravel around borewell on both right and left sides of the internal pipe
      // Clip to the inner PVC casing so gravel fits within the borewell borders
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

      // Skip re-stroking the borewell border so the pipe area has no visible border
      
      // Draw service borewell
      const serviceBorewell = componentPositions.serviceBorewell;
      const serviceRadius = serviceBorewell.width / 2;
      const serviceCenterX = serviceBorewell.x + serviceRadius;
      
      // Draw outer bore
      ctx.fillStyle = COLORS.serviceBorewellBorder;
      ctx.fillRect(serviceBorewell.x - 5, serviceBorewell.y, serviceBorewell.width + 10, serviceBorewell.height);
      
      // Draw PVC casing pipe
      ctx.fillStyle = COLORS.serviceBorewellFill;
      ctx.fillRect(serviceBorewell.x, serviceBorewell.y, serviceBorewell.width, serviceBorewell.height);
      
      // Draw internal pipe for service borewell
      const servicePipeStartY = serviceBorewell.y + 20; // Start from near the top
      const servicePipeEndY = 320 - 20; // End near the aquifer
      const servicePipeWidth = Math.max(10, Math.min(16, serviceBorewell.width * 0.25));
      const servicePipeX = serviceCenterX - servicePipeWidth / 2;
      const servicePipeHeight = Math.max(0, servicePipeEndY - servicePipeStartY);
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(servicePipeX, servicePipeStartY, servicePipeWidth, servicePipeHeight);
      
      // Draw horizontal pipe connecting service borewell to aquifer
      const aquiferConnectionY = 320 - 10; // Just above aquifer level
      const aquiferConnectionStartX = serviceBorewell.x + serviceBorewell.width;
      const aquiferConnectionEndX = 800; // Extend to right edge
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(aquiferConnectionStartX, aquiferConnectionY);
      ctx.lineTo(aquiferConnectionEndX, aquiferConnectionY);
      ctx.stroke();
      
      // Draw submersible pump
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(serviceCenterX - 8, 320 - 20, 16, 20);
      
      // Sequential water flow animation - rooftop to desilting pit
      if (isPlaying) {
        const totalCycleTime = 20; // Total cycle time for complete flow
        const cycleTime = (animationTime * 2) % totalCycleTime;
        
        // Phase 1: Rooftop to desilting pit (0-5 seconds)
        if (cycleTime <= 5) {
          // Animate water flow from rooftop to desilting pit
          const flowProgress = cycleTime / 5;
          const startX = rooftop.x + rooftop.width;
          const startY = rooftop.y + 2;
          const endX = pit.x;
          const groundY = 120;
          
          // Draw water droplets flowing through the pipe
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
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
          
          // Fill desilting pit progressively
          const pitFillProgress = Math.max(0, (cycleTime - 1) / 4); // Start filling after 1 second
          const pitWaterLevel = Math.min(pit.height - 10, pitFillProgress * (pit.height - 10));
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + pit.height - pitWaterLevel, pit.width - 10, pitWaterLevel);
        }
        
        ctx.globalAlpha = 1;
      }
      
      // Phase 2: Desilting pit to recharge pit/trench/shaft (5-10 seconds)
      if (isPlaying) {
        const totalCycleTime = 20;
        const cycleTime = (animationTime * 2) % totalCycleTime;
        
        // Keep desilting pit full after phase 1
        if (cycleTime > 5) {
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
        }
        
        if (cycleTime > 5 && cycleTime <= 10) {
          // Animate water flow from desilting pit to recharge pit/trench/shaft
          const flowProgress = (cycleTime - 5) / 5;
          const startX = pit.x + pit.width;
          const endX = rechargeWell.x;
          const groundY = 120;
          
          // Draw water droplets flowing through the pipe
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
          
          // Fill recharge pit/trench/shaft progressively
          const wellFillProgress = Math.max(0, (cycleTime - 6) / 4); // Start filling after 6 seconds
          const wellWaterLevel = Math.min(rechargeWell.height - 10, wellFillProgress * (rechargeWell.height - 10));
          ctx.fillStyle = '#87CEEB';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(rechargeWell.x + 5, rechargeWell.y + rechargeWell.height - wellWaterLevel, rechargeWell.width - 10, wellWaterLevel);
        }
        
        ctx.globalAlpha = 1;
      }
      
      // Percolation animation inside borewell removed
      
      // Animate groundwater level using real-time data - increased speed
      const groundwaterY = 320 - (realTimeWaterLevel * 2);
      const waveOffset = Math.sin(animationTime * 1.5) * 3; // 3x faster wave motion
      
      ctx.fillStyle = '#4A90E2';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, groundwaterY + waveOffset);
      for (let x = 0; x < canvasWidth; x += 5) {
        const wave = Math.sin((x + animationTime * 90) * 0.02) * 4; // 3x faster wave animation
        const y = groundwaterY + wave + waveOffset;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvasWidth, groundwaterY + waveOffset);
      ctx.lineTo(canvasWidth, 380);
      ctx.lineTo(0, 380);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Draw connecting pipes (none for recharge pit/trench/shaft as requested)
      
      // Removed pipe connection from recharge well to borewell
      
      // Draw labels
      drawLabels(ctx, canvasWidth, canvasHeight);
      
      // Draw animation phase indicator
      if (isPlaying) {
        const totalCycleTime = 20;
        const cycleTime = (animationTime * 2) % totalCycleTime;
        let phaseText = '';
        let phaseColor = '#4A90E2';
        
        if (cycleTime <= 5) {
          phaseText = 'Phase 1: Rooftop → Desilting Pit';
          phaseColor = '#87CEEB';
        } else if (cycleTime <= 10) {
          phaseText = 'Phase 2: Desilting Pit → Recharge pit/Trench/Shaft';
          phaseColor = '#87CEEB';
        } else if (cycleTime <= 15) {
          phaseText = 'Phase 3: Recharge pit/Trench/Shaft → Borewell';
          phaseColor = '#4A90E2';
        } else {
          phaseText = 'Phase 4: Borewell → Aquifer';
          phaseColor = '#4A90E2';
        }
        
        // Enhanced phase indicator background with gradient
        const gradient = ctx.createLinearGradient(10, 10, 10, 45);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(10, 10, 400, 35);
        
        // Add border for better visibility
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 400, 35);
        
        // Enhanced phase text with better styling
        ctx.fillStyle = phaseColor;
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(phaseText, 20, 32);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // On-canvas dynamic info for aquifer and soil
      if (aquiferName) {
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(20, 300, 10, 10);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Aquifer: ${aquiferName}`, 36, 310);
      }
      if (soilType) {
        ctx.fillStyle = soilColor || '#654321';
        ctx.fillRect(20, 140, 10, 10);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Soil: ${soilType}`, 36, 150);
      }
      
      if (isPlaying) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [isPlaying, animationTime, waterLevel]);

  const drawLabels = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const labels: ComponentLabel[] = [
      { text: 'ROOFTOP', x: 70, y: 60, arrowX: 100, arrowY: 80, arrowDirection: 'down' },
      // Note: Rainwater inlet removed
      { text: 'DESILTING PIT', x: 250, y: 90, arrowX: 290, arrowY: 110, arrowDirection: 'right' },
      { text: 'RECHARGE PIT/TRENCH/SHAFT', x: 370, y: 65, arrowX: 430, arrowY: 110, arrowDirection: 'right' },
      // Move the arrow to center-right within the recharge well
      { text: 'RECHARGE WELL', x: 520, y: 90, arrowX: 565, arrowY: 130, arrowDirection: 'down' },
      
      { text: 'SERVICE BOREWELL', x: 680, y: 70, arrowX: 700, arrowY: 180, arrowDirection: 'down' }
    ];

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px Arial';
    
    labels.forEach(label => {
      // Draw label text
      ctx.fillText(label.text, label.x, label.y);
      
      // Draw arrow if specified
      if (label.arrowX && label.arrowY && label.arrowDirection) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(label.arrowX, label.arrowY);
        
        switch (label.arrowDirection) {
          case 'down':
            ctx.lineTo(label.arrowX, label.arrowY + 10);
            ctx.lineTo(label.arrowX - 3, label.arrowY + 7);
            ctx.moveTo(label.arrowX, label.arrowY + 10);
            ctx.lineTo(label.arrowX + 3, label.arrowY + 7);
            break;
          case 'up':
            ctx.lineTo(label.arrowX, label.arrowY - 10);
            ctx.lineTo(label.arrowX - 3, label.arrowY - 7);
            ctx.moveTo(label.arrowX, label.arrowY - 10);
            ctx.lineTo(label.arrowX + 3, label.arrowY - 7);
            break;
          case 'right':
            ctx.lineTo(label.arrowX + 10, label.arrowY);
            ctx.lineTo(label.arrowX + 7, label.arrowY - 3);
            ctx.moveTo(label.arrowX + 10, label.arrowY);
            ctx.lineTo(label.arrowX + 7, label.arrowY + 3);
            break;
          case 'left':
            ctx.lineTo(label.arrowX - 10, label.arrowY);
            ctx.lineTo(label.arrowX - 7, label.arrowY - 3);
            ctx.moveTo(label.arrowX - 10, label.arrowY);
            ctx.lineTo(label.arrowX - 7, label.arrowY + 3);
            break;
        }
        ctx.stroke();
      }
    });
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
    <div className="w-full h-full relative bg-gradient-to-b from-blue-100 to-green-100">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        style={{ imageRendering: 'auto' }}
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm min-w-[200px]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-xs"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span className="text-xs font-medium">Animation Control</span>
          </div>
          
          <div className="border-t border-gray-600 pt-2">
            <label className="text-xs block mb-1 font-medium">
              Groundwater Level: {realTimeWaterLevel.toFixed(1)}m
              {apiLoading && <span className="text-blue-400 ml-2">🔄</span>}
            </label>
            <input
              type="range"
              min={groundwaterDepth - 5}
              max={groundwaterDepth + 5}
              value={realTimeWaterLevel}
              onChange={(e) => onLevelChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{(groundwaterDepth - 5).toFixed(1)}m</span>
              <span>{(groundwaterDepth + 5).toFixed(1)}m</span>
            </div>
            <div className="text-xs text-green-400 mt-1">
              Real-time data from /api/aquifer-depth
            </div>
          </div>
          
          <div className="border-t border-gray-600 pt-3">
            <label className="text-sm block mb-1 font-medium">System Components</label>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Desilting Pit:</span>
                <span className="text-green-300">80×60cm</span>
              </div>
              <div className="flex justify-between">
                <span>Recharge Well:</span>
                <span className="text-orange-300">100×80cm</span>
              </div>
              <div className="flex justify-between">
                <span>Borewell Depth:</span>
                <span className="text-purple-300">200cm</span>
              </div>
              {aquiferName && (
                <div className="flex justify-between">
                  <span>Aquifer:</span>
                  <span className="text-blue-300">{aquiferName}</span>
                </div>
              )}
              {soilType && (
                <div className="flex justify-between items-center">
                  <span>Soil Type:</span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: soilColor || '#8B4513' }}></span>
                    <span className="text-green-300">{soilType}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-600 pt-3">
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
      
      {/* Component Info */}
      {selectedComponent && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm max-w-xs">
          <h3 className="font-bold mb-1 text-xs">Selected: {selectedComponent}</h3>
          <div className="text-xs">
            {selectedComponent === 'desiltingPit' && (
              <div>
                <div>Size: 80×60cm</div>
                <div>Components: Baffle, Gravel, Screen</div>
                <div>Function: Sediment removal</div>
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
                <div>Components: Slotted pipe, Pea gravel</div>
              </div>
            )}
            {selectedComponent === 'serviceBorewell' && (
              <div>
                <div>Depth: 200cm</div>
                <div>Function: Water extraction</div>
                <div>Components: Submersible pump</div>
              </div>
            )}
            {selectedComponent === 'aquifer' && (
              <div>
                <div>Water Level: {waterLevel.toFixed(1)}m</div>
                <div>Type: Groundwater aquifer</div>
                <div>Status: Recharging</div>
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default RainwaterHarvestingSchematic;
