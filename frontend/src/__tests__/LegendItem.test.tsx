import React from 'react';
import { render, screen } from '@testing-library/react';
import LegendItem from '../components/LegendItem';

describe('LegendItem', () => {
  it('renders legend color and label', () => {
    render(<LegendItem color="#123456" label="Sand" />);
    expect(screen.getByText('Sand')).toBeInTheDocument();
  });
});
