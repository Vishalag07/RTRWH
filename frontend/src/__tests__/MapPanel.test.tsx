import React from 'react';
import { render, screen } from '@testing-library/react';
import MapPanel from '../components/MapPanel';

describe('MapPanel', () => {
  it('renders map and location button', () => {
    render(<MapPanel lat={12.9} lon={77.5} onPickLocation={() => {}} />);
    expect(screen.getByText('Map & Location')).toBeInTheDocument();
    expect(screen.getByText('Use my location')).toBeInTheDocument();
  });
});
