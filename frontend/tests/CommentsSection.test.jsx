import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CommentsSection from '../src/components/CommentsSection';
import { api } from '../src/utils/api';

// Mock do ToastContext
const mockShowToast = vi.fn();
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
  ToastProvider: ({ children }) => <div>{children}</div>,
}));

// Mock do módulo api
vi.mock('../src/utils/api', () => ({
  api: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
    uploadAvatar: vi.fn(),
  },
  default: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
    uploadAvatar: vi.fn(),
  }
}));

describe('CommentsSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders spinner and then placeholder when comments list is empty', async () => {
    api.getComments.mockResolvedValue([]);

    render(<CommentsSection postId={1} />);

    // Deve exibir título da seção
    expect(screen.getByText(/comentários/i)).toBeInTheDocument();

    // Aguarda o término da busca
    await waitFor(() => {
      expect(screen.getByText('Nenhum comentário ainda. Seja o primeiro a enriquecer este post!')).toBeInTheDocument();
    });
    expect(screen.getByText('Comentários (0)')).toBeInTheDocument();
  });

  test('renders comments correctly when list is populated', async () => {
    const mockComments = [
      {
        id: 10,
        post_id: 1,
        author_name: 'Arthur Pendragon',
        content: 'Excelente design! Exatamente o que eu buscava.',
        created_at: '2026-05-23T10:00:00',
        approved: true,
        client_id: 'default_client',
        author_avatar_url: 'http://localhost:8000/static/avatars/arthur.png'
      },
      {
        id: 11,
        post_id: 1,
        author_name: 'Guinevere',
        content: 'Estética impecável.',
        created_at: '2026-05-23T11:00:00Z',
        approved: true,
        client_id: 'default_client',
        author_avatar_url: null
      }
    ];

    api.getComments.mockResolvedValue(mockComments);

    render(<CommentsSection postId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comentários (2)')).toBeInTheDocument();
      expect(screen.getByText('Arthur Pendragon')).toBeInTheDocument();
      expect(screen.getByText('Excelente design! Exatamente o que eu buscava.')).toBeInTheDocument();
      expect(screen.getByText('Guinevere')).toBeInTheDocument();
      expect(screen.getByText('Estética impecável.')).toBeInTheDocument();
      
      // Deve renderizar a imagem do Arthur
      const arthurImg = screen.getByAltText('Arthur Pendragon');
      expect(arthurImg).toBeInTheDocument();
      expect(arthurImg).toHaveAttribute('src', 'http://localhost:8000/static/avatars/arthur.png');
      
      // Guinevere não tem imagem, deve mostrar a padrão em formato SVG Data URI
      const guinevereImg = screen.getByAltText('Guinevere');
      expect(guinevereImg).toBeInTheDocument();
      expect(guinevereImg.getAttribute('src')).toContain('data:image/svg+xml');
    });

    // Não deve renderizar botão de exclusão para visitante anônimo
    expect(screen.queryByTitle('Excluir Comentário')).not.toBeInTheDocument();
  });

  test('submits comment form successfully without avatar', async () => {
    api.getComments.mockResolvedValue([]);
    const mockNewComment = {
      id: 12,
      post_id: 1,
      author_name: 'Lancelot',
      author_email: 'lancelot@camelot.com',
      content: 'Belo post.',
      created_at: '2026-05-23T12:00:00Z',
      approved: true,
      client_id: 'default_client',
      author_avatar_url: null
    };
    api.createComment.mockResolvedValue(mockNewComment);

    render(<CommentsSection postId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comentários (0)')).toBeInTheDocument();
    });

    // Preencher campos
    const nameInput = screen.getByLabelText(/nome \*/i);
    const emailInput = screen.getByLabelText(/e-mail/i);
    const contentInput = screen.getByLabelText(/comentário \*/i);
    const submitButton = screen.getByRole('button', { name: /enviar comentário/i });

    fireEvent.change(nameInput, { target: { value: 'Lancelot' } });
    fireEvent.change(emailInput, { target: { value: 'lancelot@camelot.com' } });
    fireEvent.change(contentInput, { target: { value: 'Belo post.' } });

    // Submeter
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.createComment).toHaveBeenCalledWith({
        post_id: 1,
        author_name: 'Lancelot',
        author_email: 'lancelot@camelot.com',
        content: 'Belo post.',
        author_avatar_url: null
      });
      expect(mockShowToast).toHaveBeenCalledWith('Comentário enviado com sucesso!');
      expect(screen.getByText('Comentários (1)')).toBeInTheDocument();
    });
  });

  test('uploads avatar successfully and shows preview', async () => {
    api.getComments.mockResolvedValue([]);
    api.uploadAvatar.mockResolvedValue({ url: 'http://localhost:8000/static/avatars/test-avatar.png' });

    const { container } = render(<CommentsSection postId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comentários (0)')).toBeInTheDocument();
    });

    // Inicialmente deve mostrar o preview padrão (SVG inline)
    const initialPreview = screen.getByAltText('Preview');
    expect(initialPreview).toBeInTheDocument();
    expect(initialPreview.getAttribute('src')).toContain('data:image/svg+xml');

    // Encontrar o input de file
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const file = new File(['(binary)'], 'avatar.png', { type: 'image/png' });
    
    // Simular seleção de arquivo
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.uploadAvatar).toHaveBeenCalledWith(file);
      expect(mockShowToast).toHaveBeenCalledWith('Foto de perfil carregada com sucesso!');
      
      const previewImg = screen.getByAltText('Preview');
      expect(previewImg).toBeInTheDocument();
      expect(previewImg).toHaveAttribute('src', 'http://localhost:8000/static/avatars/test-avatar.png');
    });
  });

  test('renders delete button for admin and opens confirmation modal on click', async () => {
    localStorage.setItem('token', 'fake-admin-jwt-token');

    const mockComments = [
      {
        id: 20,
        post_id: 1,
        author_name: 'Merlin',
        content: 'Magia pura!',
        created_at: '2026-05-23T10:00:00Z',
        approved: true,
        client_id: 'default_client',
        author_avatar_url: null
      }
    ];
    api.getComments.mockResolvedValue(mockComments);
    api.deleteComment.mockResolvedValue(true);

    render(<CommentsSection postId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Merlin')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Excluir Comentário');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(screen.getByText('Excluir Comentário?')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Excluir Comentário?')).not.toBeInTheDocument();

    fireEvent.click(deleteBtn);
    const confirmBtn = screen.getByRole('button', { name: /^excluir$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.deleteComment).toHaveBeenCalledWith(20);
      expect(mockShowToast).toHaveBeenCalledWith('Comentário excluído com sucesso!');
      expect(screen.getByText('Nenhum comentário ainda. Seja o primeiro a enriquecer este post!')).toBeInTheDocument();
    });
  });
});
