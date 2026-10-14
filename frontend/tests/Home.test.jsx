import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Home from '../src/pages/Home';
import { api } from '../src/utils/api';

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
    getPosts: vi.fn(),
  },
  default: {
    getPosts: vi.fn(),
  }
}));

describe('Home Page Component', () => {
  test('renders page title and calls api.getPosts', async () => {
    api.getPosts.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Deve exibir o título principal
    expect(screen.getByText('Artigos & Estudos de Caso')).toBeInTheDocument();

    // Deve chamar a API para carregar os posts
    expect(api.getPosts).toHaveBeenCalled();

    // Aguarda o término das atualizações assíncronas do useEffect
    await waitFor(() => {
      expect(screen.getByText('Nenhum artigo publicado ainda. Fique atento às próximas atualizações!')).toBeInTheDocument();
    });
  });

  test('renders horizontal list of published posts with conditional images', async () => {
    api.getPosts.mockResolvedValue([
      {
        id: 1,
        title: 'Post Premium de UX',
        slug: 'post-premium-ux',
        cover_image_url: 'http://localhost/ux-cover.png',
        published: true,
        created_at: '2026-05-23T10:00:00Z',
      },
      {
        id: 2,
        title: 'Estudo de Caso Conversão',
        slug: 'estudo-conversao',
        cover_image_url: null,
        published: true,
        created_at: '2026-05-22T10:00:00Z',
      },
      {
        id: 3,
        title: 'Rascunho não publicado',
        slug: 'rascunho',
        cover_image_url: null,
        published: false,
        created_at: '2026-05-21T10:00:00Z',
      }
    ]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Esperar carregar os dados
    await waitFor(() => {
      expect(screen.getByText('Post Premium de UX')).toBeInTheDocument();
      expect(screen.getByText('Estudo de Caso Conversão')).toBeInTheDocument();
    });

    // Não deve renderizar o post de rascunho
    expect(screen.queryByText('Rascunho não publicado')).not.toBeInTheDocument();

    // O link do post 1 deve apontar para /post/post-premium-ux
    const linkUx = screen.getByRole('link', { name: /post premium de ux/i });
    expect(linkUx).toBeInTheDocument();
    expect(linkUx).toHaveAttribute('href', '/post/post-premium-ux');

    // O link do post 2 deve apontar para /post/estudo-conversao
    const linkConversion = screen.getByRole('link', { name: /estudo de caso conversão/i });
    expect(linkConversion).toBeInTheDocument();
    expect(linkConversion).toHaveAttribute('href', '/post/estudo-conversao');

    // Deve renderizar a imagem do Post 1
    const imgElement = screen.getByAltText('Post Premium de UX');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', 'http://localhost/ux-cover.png');

    // Não deve renderizar imagem para o Post 2
    expect(screen.queryByAltText('Estudo de Caso Conversão')).not.toBeInTheDocument();
  });

  test('paginates public posts showing 20 per page and navigates to page 2', async () => {
    const manyPosts = Array.from({ length: 25 }, (_, idx) => ({
      id: idx + 1,
      title: `Artigo Público ${idx + 1}`,
      slug: `artigo-publico-${idx + 1}`,
      published: true,
      created_at: '2026-05-23T10:00:00Z',
    }));

    api.getPosts.mockResolvedValue(manyPosts);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Artigo Público 1')).toBeInTheDocument();
      expect(screen.getByText('Artigo Público 20')).toBeInTheDocument();
      expect(screen.queryByText('Artigo Público 21')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('pagination-container')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('Mostrando 1-20 de 25 posts (20 por página)');

    // Navegar para a página 2
    fireEvent.click(screen.getByTestId('pagination-next'));

    expect(screen.getByText('Artigo Público 21')).toBeInTheDocument();
    expect(screen.getByText('Artigo Público 25')).toBeInTheDocument();
    expect(screen.queryByText('Artigo Público 1')).not.toBeInTheDocument();
  });
});

