import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Home from '../src/pages/Home';
import { api } from '../src/utils/api';

// Mock do módulo de API
vi.mock('../src/utils/api', () => ({
  api: {
    getPosts: vi.fn(),
  },
}));

describe('Home Page Tag Filtering', () => {
  const mockPosts = [
    {
      id: 1,
      title: 'Caso de SaaS 1',
      slug: 'caso-saas-1',
      summary: 'Resumo SaaS 1',
      tags: 'SaaS, UI/UX',
      published: true,
      created_at: '2026-05-23T10:00:00Z',
    },
    {
      id: 2,
      title: 'Design de Landing Page',
      slug: 'design-landing-page',
      summary: 'Resumo Landing Page',
      tags: 'Design, Landing Page',
      published: true,
      created_at: '2026-05-23T11:00:00Z',
    },
    {
      id: 3,
      title: 'Caso de SaaS 2',
      slug: 'caso-saas-2',
      summary: 'Resumo SaaS 2',
      tags: 'SaaS, Conversão',
      published: true,
      created_at: '2026-05-23T12:00:00Z',
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all posts and lists correct filter buttons', async () => {
    api.getPosts.mockResolvedValue(mockPosts);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Deve carregar os posts
    await waitFor(() => {
      expect(screen.getByText('Caso de SaaS 1')).toBeInTheDocument();
      expect(screen.getByText('Design de Landing Page')).toBeInTheDocument();
      expect(screen.getByText('Caso de SaaS 2')).toBeInTheDocument();
    });

    // Deve exibir botões de filtro para as tags únicas
    expect(screen.getByTestId('filter-tag-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-tag-SaaS')).toBeInTheDocument();
    expect(screen.getByTestId('filter-tag-UI/UX')).toBeInTheDocument();
    expect(screen.getByTestId('filter-tag-Design')).toBeInTheDocument();
    expect(screen.getByTestId('filter-tag-Landing Page')).toBeInTheDocument();
    expect(screen.getByTestId('filter-tag-Conversão')).toBeInTheDocument();
  });

  test('filters posts list when tag button is clicked', async () => {
    api.getPosts.mockResolvedValue(mockPosts);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Caso de SaaS 1')).toBeInTheDocument();
    });

    // Clicar no filtro 'SaaS'
    const saasFilterBtn = screen.getByTestId('filter-tag-SaaS');
    fireEvent.click(saasFilterBtn);

    // Deve exibir posts de SaaS e ocultar outros
    expect(screen.getByText('Caso de SaaS 1')).toBeInTheDocument();
    expect(screen.getByText('Caso de SaaS 2')).toBeInTheDocument();
    expect(screen.queryByText('Design de Landing Page')).not.toBeInTheDocument();

    // Clicar em 'Design'
    const designFilterBtn = screen.getByTestId('filter-tag-Design');
    fireEvent.click(designFilterBtn);

    expect(screen.queryByText('Caso de SaaS 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Caso de SaaS 2')).not.toBeInTheDocument();
    expect(screen.getByText('Design de Landing Page')).toBeInTheDocument();
  });

  test('filters list automatically from URL query parameters', async () => {
    api.getPosts.mockResolvedValue(mockPosts);

    render(
      <MemoryRouter initialEntries={['/?tag=SaaS']}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Caso de SaaS 1')).toBeInTheDocument();
      expect(screen.getByText('Caso de SaaS 2')).toBeInTheDocument();
      expect(screen.queryByText('Design de Landing Page')).not.toBeInTheDocument();
    });
  });
});
