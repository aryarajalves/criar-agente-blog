import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import PostForm from '../src/components/PostForm';

// Mock do ToastContext
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock do módulo de API
vi.mock('../src/utils/api', () => ({
  api: {
    uploadImage: vi.fn(),
  },
}));

describe('PostForm Component', () => {
  test('renders all form fields including the new tags input', () => {
    render(<PostForm post={null} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/título do post \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug da url \(opcional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags de seo \(separadas por vírgula\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resumo meta description \(seo\) \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/conteúdo do post \(suporta markdown básico\) \*/i)).toBeInTheDocument();
  });

  test('populates fields when post is provided (edit mode)', () => {
    const mockPost = {
      title: 'Post Existente',
      slug: 'post-existente',
      summary: 'Resumo do post existente',
      content: 'Conteúdo do post existente',
      cover_image_url: 'http://example.com/image.png',
      tags: 'Design, UI/UX, SaaS',
      published: true
    };

    render(<PostForm post={mockPost} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/título do post \*/i).value).toBe('Post Existente');
    expect(screen.getByLabelText(/slug da url \(opcional\)/i).value).toBe('post-existente');
    expect(screen.getByLabelText(/tags de seo \(separadas por vírgula\)/i).value).toBe('Design, UI/UX, SaaS');
    expect(screen.getByLabelText(/resumo meta description \(seo\) \*/i).value).toBe('Resumo do post existente');
    expect(screen.getByLabelText(/conteúdo do post \(suporta markdown básico\) \*/i).value).toBe('Conteúdo do post existente');
    expect(screen.getByLabelText(/publicar imediatamente/i)).toBeChecked();
  });

  test('calls onSave with correct data when submitted', async () => {
    const handleSave = vi.fn().mockResolvedValue({});
    render(<PostForm post={null} onSave={handleSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/título do post \*/i), { target: { value: 'Novo Post de Teste' } });
    fireEvent.change(screen.getByLabelText(/tags de seo \(separadas por vírgula\)/i), { target: { value: 'UX, Desenvolvimento, FastAPI' } });
    fireEvent.change(screen.getByLabelText(/resumo meta description \(seo\) \*/i), { target: { value: 'Resumo legal do post de teste' } });
    fireEvent.change(screen.getByLabelText(/conteúdo do post \(suporta markdown básico\) \*/i), { target: { value: '# Conteúdo do teste' } });

    const submitBtn = screen.getByRole('button', { name: /salvar post/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith({
        title: 'Novo Post de Teste',
        slug: undefined,
        summary: 'Resumo legal do post de teste',
        content: '# Conteúdo do teste',
        cover_image_url: null,
        tags: 'UX, Desenvolvimento, FastAPI',
        published: false
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(<PostForm post={null} onSave={vi.fn()} onCancel={handleCancel} />);

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalled();
  });
});
