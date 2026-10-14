import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import PostCard from '../src/components/PostCard';

describe('PostCard Component', () => {
  const mockPost = {
    title: 'Test Post Title',
    slug: 'test-post-title',
    summary: 'This is a short test summary of the post.',
    cover_image_url: 'http://example.com/image.jpg',
    created_at: '2026-05-23T10:00:00Z',
    published: true,
  };

  test('renders post title, summary, and formatted date', () => {
    render(
      <MemoryRouter>
        <PostCard post={mockPost} />
      </MemoryRouter>
    );

    // Verificar título
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    
    // Verificar resumo
    expect(screen.getByText('This is a short test summary of the post.')).toBeInTheDocument();
    
    // Verificar link
    const link = screen.getByRole('link', { name: /ver estudo de caso/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/post/test-post-title');
  });

  test('renders emoji placeholder when cover image is null', () => {
    const postWithoutImage = { ...mockPost, cover_image_url: null };
    render(
      <MemoryRouter>
        <PostCard post={postWithoutImage} />
      </MemoryRouter>
    );

    expect(screen.getByText('🖥️')).toBeInTheDocument();
  });
});
