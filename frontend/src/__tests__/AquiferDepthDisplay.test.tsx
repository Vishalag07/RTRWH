import React from 'react';
import { render, screen } from '@testing-library/react';
import AquiferDepthDisplay from '../components/AquiferDepthDisplay';
import { AquiferProfilePoint } from '../components/types';

describe('AquiferDepthDisplay', () => {
  const mockProfile: AquiferProfilePoint[] = [
    { time: '10:00', depth: 30 },
    { time: '11:00', depth: 32 },
    { time: '12:00', depth: 31 },
  ];

  it('renders aquifer depth and chart', () => {
    // Create a container with dimensions to avoid Recharts warnings
    const containerDiv = document.createElement('div');
    containerDiv.style.width = '800px';
    containerDiv.style.height = '400px';
    document.body.appendChild(containerDiv);

    render(<AquiferDepthDisplay aquiferDepth={42} aquiferProfile={mockProfile} />, {
      container: containerDiv
    });
    
    expect(screen.getByText(/Aquifer Depth/i)).toBeInTheDocument();
    expect(screen.getByText('42 m')).toBeInTheDocument();
    
    // Clean up
    document.body.removeChild(containerDiv);
  });
});
