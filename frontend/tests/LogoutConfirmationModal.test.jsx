import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import LogoutConfirmationModal from '../src/components/LogoutConfirmationModal';

describe('LogoutConfirmationModal Component', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <LogoutConfirmationModal isOpen={false} onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal, calls onCancel and onConfirm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <LogoutConfirmationModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />
    );

    // Verificar se os elementos do modal estão visíveis
    expect(screen.getByText('Confirmar Saída')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza que deseja sair do painel administrativo?')).toBeInTheDocument();

    // Clicar no botão de cancelar
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Clicar no botão de sair (confirmar)
    const confirmButton = screen.getByRole('button', { name: /sair/i });
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
