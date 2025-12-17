import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CreatePlayer from '../../src/pages/Create_Player';

describe('CreatePlayer Component', () => {
  it('should render the create player page', () => {
    render(<CreatePlayer />);
    const container = screen.getByPlaceholderText('Enter player name');
    expect(container).toBeInTheDocument();
  });

  it('should display the navbar', () => {
    render(<CreatePlayer />);
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
  });

  it('should display the input field for player name', () => {
    render(<CreatePlayer />);
    const input = screen.getByPlaceholderText('Enter player name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should display the start button', () => {
    render(<CreatePlayer />);
    const button = screen.getByRole('button', { name: /start/i });
    expect(button).toBeInTheDocument();
  });

  it('should display the logo image', () => {
    render(<CreatePlayer />);
    const logoImage = screen.getByAltText('WarHeads_Logo');
    expect(logoImage).toBeInTheDocument();
  });
});
