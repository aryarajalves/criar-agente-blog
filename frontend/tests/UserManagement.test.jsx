import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import UserManagement from '../src/pages/UserManagement';
import { api } from '../src/utils/api';

// Mocks
vi.mock('../src/utils/api', () => ({
  api: {
    getUsers: vi.fn(),
    getInvites: vi.fn(),
    createInvite: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('UserManagement Component', () => {
  const mockUsers = [
    {
      id: 1,
      username: 'aryaraj',
      email: 'superadmin@teste.com',
      role: 'super_admin',
      created_at: '2026-05-23T10:00:00Z',
    },
    {
      id: 2,
      username: 'co_admin',
      email: 'coadmin@teste.com',
      role: 'admin',
      created_at: '2026-05-24T12:00:00Z',
    },
  ];

  const mockInvites = [
    {
      id: 10,
      token: 'test_token_abc_123',
      role: 'admin',
      created_at: '2026-05-24T10:00:00Z',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      used: false,
    },
  ];

  beforeEach(() => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('email', 'superadmin@teste.com');
    vi.clearAllMocks();
    api.getUsers.mockResolvedValue(mockUsers);
    api.getInvites.mockResolvedValue(mockInvites);
  });

  test('renderiza título, usuários com badges de Super Admin e Admin', async () => {
    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    // Aguarda carregar dados
    await waitFor(() => {
      expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument();
    });

    // Deve exibir ambos os usuários
    expect(screen.getByText('aryaraj')).toBeInTheDocument();
    expect(screen.getByText('co_admin')).toBeInTheDocument();

    // Deve exibir os badges de Super Admin e Admin
    expect(screen.getByText(/SUPER ADMIN/i)).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    // Super Admin deve ter indicação "Fixo do Sistema" e não botão de excluir
    expect(screen.getByText('Fixo do Sistema')).toBeInTheDocument();

    // Valida que a data de cadastro está formatada no Horário Oficial de Brasília (UTC-3: 10h UTC -> 07h, 12h UTC -> 09h)
    expect(screen.getByText(/07:00/)).toBeInTheDocument();
    expect(screen.getByText(/09:00/)).toBeInTheDocument();

    // O outro admin deve ter botão de excluir
    expect(screen.getByTestId('btn-delete-user-2')).toBeInTheDocument();
  });

  test('permite alternar para a aba de histórico de convites', async () => {
    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-invites')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-invites'));

    await waitFor(() => {
      expect(screen.getByTestId('invites-table-container')).toBeInTheDocument();
      expect(screen.getByTestId('invite-row-10')).toBeInTheDocument();
      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });
  });

  test('abre modal de Gerar Convite, exibe opções 24h, 48h, 72h e 96h e gera convite com sucesso', async () => {
    api.createInvite.mockResolvedValue({
      id: 99,
      token: 'novo_token_gerado_xyz',
      role: 'admin',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      used: false,
    });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-open-invite-modal')).toBeInTheDocument();
    });

    // Abrir modal
    fireEvent.click(screen.getByTestId('btn-open-invite-modal'));

    // Verifica que as opções 24h, 48h, 72h e 96h estão presentes
    expect(screen.getByTestId('invite-expiry-24')).toBeInTheDocument();
    expect(screen.getByTestId('invite-expiry-48')).toBeInTheDocument();
    expect(screen.getByTestId('invite-expiry-72')).toBeInTheDocument();
    expect(screen.getByTestId('invite-expiry-96')).toBeInTheDocument();

    // Selecionar 48h
    fireEvent.click(screen.getByTestId('invite-expiry-48'));

    // Clicar em Gerar Convite
    fireEvent.click(screen.getByTestId('btn-generate-invite'));

    await waitFor(() => {
      expect(api.createInvite).toHaveBeenCalledWith({
        role: 'admin',
        expires_in_hours: 48,
      });
      expect(screen.getByTestId('invite-generated-result')).toBeInTheDocument();
      expect(screen.getByTestId('btn-copy-invite-link')).toBeInTheDocument();
    });
  });
});
