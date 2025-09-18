import React from 'react';
import { render, screen } from '@testing-library/react';
import BoreWellDiagram from '../components/BoreWellDiagram';
import { BoreWell } from '../components/types';

describe('BoreWellDiagram', () => {
  const mockBoreWells: BoreWell[] = [
    {
      id: 'BW-1',
      lat: 12.9,
      lon: 77.5,
      waterLevel: 20,
      connectedShafts: [
        { id: 'S-1-1', depth: 5 },
        { id: 'S-1-2', depth: 7 },
      ],
    },
  ];

  it('renders bore well and shafts', () => {
    render(<BoreWellDiagram boreWells={mockBoreWells} />);
    expect(screen.getByText('BW-1')).toBeInTheDocument();
    expect(screen.getByText(/S-1-1/)).toBeInTheDocument();
    expect(screen.getByText(/S-1-2/)).toBeInTheDocument();
  });
});
