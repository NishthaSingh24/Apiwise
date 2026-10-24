import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('APIWise Frontend Authentication Components', () => {
  it('renders login form with email, password, and sign-in button', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/developer@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders registration form with full name, email, and password', () => {
    renderWithProviders(<Register />);
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Alex Morgan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/alex@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Started Free/i })).toBeInTheDocument();
  });
});
