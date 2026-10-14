import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Login from '../src/pages/Login';

// Mock do ToastContext
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }) => <div>{children}</div>,
}));

// Mock do módulo api
vi.mock('../src/utils/api', () => ({
  api: {
    login: vi.fn(),
  },
  default: {
    login: vi.fn(),
  }
}));

describe('Login Page Component', () => {
  test('renders login fields and toggles password visibility', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Verificar se os campos existem
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    const passwordInput = screen.getByLabelText("Senha");
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');

    // Achar o botão de alternar senha
    const toggleButton = screen.getByRole('button', { name: /Mostrar senha/i });
    expect(toggleButton).toBeInTheDocument();

    // Clicar para mostrar a senha
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    expect(toggleButton.getAttribute('aria-label')).toBe('Ocultar senha');

    // Clicar novamente para ocultar a senha
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
    expect(toggleButton.getAttribute('aria-label')).toBe('Mostrar senha');
  });
});
