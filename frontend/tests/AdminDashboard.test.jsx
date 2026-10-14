import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from '../src/pages/AdminDashboard';
import { api } from '../src/utils/api';

// Mock do ToastContext
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }) => <div>{children}</div>,
}));

// Mock do módulo de API
vi.mock('../src/utils/api', () => ({
  api: {
    getAdminPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    uploadImage: vi.fn(),
  },
  default: {
    getAdminPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    uploadImage: vi.fn(),
  }
}));

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token-123');
  });

  test('renders list of posts and navigation to create view works', async () => {
    api.getAdminPosts.mockResolvedValue([
      {
        id: 1,
        title: 'Post Existente 1',
        slug: 'post-existente-1',
        summary: 'Resumo 1',
        content: 'Conteúdo 1',
        cover_image_url: 'http://example.com/image.png',
        published: true,
        updated_at: '2026-05-23T10:00:00Z',
      }
    ]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Deve buscar posts na montagem
    expect(api.getAdminPosts).toHaveBeenCalled();

    // Aguarda o post ser exibido na tabela
    await waitFor(() => {
      expect(screen.getByText('Post Existente 1')).toBeInTheDocument();
    });

    // Clicar em "Novo Post"
    const newPostBtn = screen.getByRole('button', { name: /novo post/i });
    expect(newPostBtn).toBeInTheDocument();
    fireEvent.click(newPostBtn);

    // Deve exibir o formulário de criação com título "Novo Post"
    expect(screen.getByRole('heading', { name: 'Novo Post' })).toBeInTheDocument();
  });

  test('image cover input active tabs toggle works', async () => {
    api.getAdminPosts.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Ir para a tela de Novo Post
    await waitFor(() => {
      const newPostBtn = screen.getByRole('button', { name: /novo post/i });
      fireEvent.click(newPostBtn);
    });

    // Por padrão a aba selecionada deve ser "Upload"
    // Deve haver o botão de selecionar imagem de capa
    expect(screen.getByText('Selecionar imagem de capa')).toBeInTheDocument();

    // Achar botão "Link URL" e clicar
    const linkUrlTabBtn = screen.getByRole('button', { name: 'Link URL' });
    fireEvent.click(linkUrlTabBtn);

    // Agora deve exibir o input de texto
    const coverUrlInput = screen.getByPlaceholderText('Ex: http://host.com/imagem.png');
    expect(coverUrlInput).toBeInTheDocument();

    // Achar botão "Upload" e clicar de volta
    const uploadTabBtn = screen.getByRole('button', { name: 'Upload' });
    fireEvent.click(uploadTabBtn);

    // Deve voltar a exibir a interface de upload
    expect(screen.getByText('Selecionar imagem de capa')).toBeInTheDocument();
  });

  test('image file upload updates form state and previews successfully', async () => {
    api.getAdminPosts.mockResolvedValue([]);
    api.uploadImage.mockResolvedValue({ url: 'http://localhost:8000/static/uploads/uploaded-image.png' });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Ir para a tela de Novo Post
    await waitFor(() => {
      const newPostBtn = screen.getByRole('button', { name: /novo post/i });
      fireEvent.click(newPostBtn);
    });

    // Selecionar arquivo
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('file-upload-input');

    // Simular evento de alteração no input file
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Deve chamar o método de upload da API
    expect(api.uploadImage).toHaveBeenCalledWith(file);

    // Deve atualizar a tela mostrando a miniatura/imagem carregada com sucesso
    await waitFor(() => {
      expect(screen.getByText('Imagem carregada com sucesso')).toBeInTheDocument();
      expect(screen.getByAltText('Preview da capa')).toHaveAttribute('src', 'http://localhost:8000/static/uploads/uploaded-image.png');
    });

    // Clicar no botão X para remover a imagem
    const removeBtn = screen.getByTestId('remove-cover-image');
    fireEvent.click(removeBtn);

    // Deve limpar o preview e voltar ao estado de seleção
    expect(screen.getByText('Selecionar imagem de capa')).toBeInTheDocument();
  });

  test('paginates posts showing 20 per page in admin table', async () => {
    // Gerar 25 posts simulados
    const manyPosts = Array.from({ length: 25 }, (_, idx) => ({
      id: idx + 1,
      title: `Admin Post ${idx + 1}`,
      slug: `admin-post-${idx + 1}`,
      summary: `Resumo ${idx + 1}`,
      content: `Conteúdo ${idx + 1}`,
      published: true,
      updated_at: '2026-05-23T10:00:00Z',
    }));

    api.getAdminPosts.mockResolvedValue(manyPosts);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Post 1 deve estar visível
      expect(screen.getByText('Admin Post 1')).toBeInTheDocument();
      // Post 20 deve estar visível
      expect(screen.getByText('Admin Post 20')).toBeInTheDocument();
      // Post 21 não deve estar na página 1
      expect(screen.queryByText('Admin Post 21')).not.toBeInTheDocument();
    });

    // Deve exibir o componente de paginação
    expect(screen.getByTestId('pagination-container')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('Mostrando 1-20 de 25 posts (20 por página)');

    // Navegar para a página 2
    fireEvent.click(screen.getByTestId('pagination-next'));

    // Agora o post 21 e 25 devem estar visíveis, e o post 1 não deve estar
    expect(screen.getByText('Admin Post 21')).toBeInTheDocument();
    expect(screen.getByText('Admin Post 25')).toBeInTheDocument();
    expect(screen.queryByText('Admin Post 1')).not.toBeInTheDocument();
  });
});

