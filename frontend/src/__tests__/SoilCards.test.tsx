import React from 'react';
import { render, screen } from '@testing-library/react';
import SoilCards from '../components/SoilCards';
import { SoilLayer } from '../components/types';

describe('SoilCards', () => {
  const mockSoil: SoilLayer[] = [
    { type: 'Sand', color: '#f6c26b', thickness: 2.5 },
    { type: 'Clay', color: '#9aa3b2', thickness: 3.1 },
  ];

  it('renders soil type cards', () => {
    render(<SoilCards soilLayers={mockSoil} />);
    expect(screen.getByText('Sand')).toBeInTheDocument();
    expect(screen.getByText('Clay')).toBeInTheDocument();
    expect(screen.getByText(/Thickness: 2.5 m/)).toBeInTheDocument();
    expect(screen.getByText(/Thickness: 3.1 m/)).toBeInTheDocument();
  });
});
