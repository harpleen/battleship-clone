import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';

describe('Navbar Component', () => {
  it('should render the navbar', () => {
    render(<Navbar />);
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
  });

  it('should display the logo image', () => {
    render(<Navbar />);
    const logoImage = screen.getByAltText('WarHeads_Logo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src');
  });

  it('should have the logo with correct styling', () => {
    render(<Navbar />);
    const logoImage = screen.getByAltText('WarHeads_Logo');
    expect(logoImage).toHaveStyle({ height: '100px', width: 'auto' });
  });
});
