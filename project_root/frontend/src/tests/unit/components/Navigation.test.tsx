import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // Use MemoryRouter for testing components with Links/NavLinks
import Navigation from '@/shared/components/Navigation';

describe('Navigation Component', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
  };

  test('renders the brand name/logo', () => {
    renderComponent();
    // Use text matching (adjust if using an image/logo)
    expect(screen.getByText(/MyApp/i)).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderComponent();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /governance/i })).toBeInTheDocument();
  });

  test('links have correct href attributes', () => {
    renderComponent();
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /governance/i })).toHaveAttribute('href', '/governance');
  });

  // Add more tests for active link styling, mobile menu toggle, etc.
});
