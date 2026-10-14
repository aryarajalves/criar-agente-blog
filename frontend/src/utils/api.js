const API_BASE_URL = 'http://localhost:8000/api';

const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const api = {
  // Autenticação
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao realizar login.');
    }
    
    return response.json();
  },

  // Posts públicos
  getPosts: async (clientId = 'default_client') => {
    const response = await fetch(`${API_BASE_URL}/posts?client_id=${clientId}`, {
      method: 'GET',
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar posts.');
    }
    
    return response.json();
  },

  getPostBySlug: async (slug, clientId = 'default_client') => {
    const response = await fetch(`${API_BASE_URL}/posts/${slug}?client_id=${clientId}`, {
      method: 'GET',
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Post não encontrado.');
      }
      throw new Error('Erro ao buscar post.');
    }
    
    return response.json();
  },

  // Posts administrativos
  getAdminPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts/admin/all`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado. Faça login novamente.');
      }
      throw new Error('Erro ao buscar posts da administração.');
    }
    
    return response.json();
  },

  createPost: async (postData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao criar post.');
    }
    
    return response.json();
  },

  updatePost: async (id, postData) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao atualizar post.');
    }
    
    return response.json();
  },

  deletePost: async (id) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao deletar post.');
    }
    
    return true;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/posts/upload-image`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao fazer upload da imagem.');
    }
    
    return response.json();
  },

  // Geração de conteúdo com IA
  generateWithAI: async ({ description, tone, size, variations_count }) => {
    const response = await fetch(`${API_BASE_URL}/posts/ai/generate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ description, tone, size, variations_count }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao gerar conteúdo com IA.');
    }

    return response.json();
  },

  // Comentários
  getComments: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/comments/post/${postId}`, {
      method: 'GET',
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar comentários.');
    }
    
    return response.json();
  },

  createComment: async (commentData) => {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(commentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao enviar comentário.');
    }
    
    return response.json();
  },

  deleteComment: async (commentId) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao deletar comentário.');
    }
    
    return true;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/comments/upload-avatar`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao fazer upload do avatar.');
    }
    
    return response.json();
  },

  // Gestão de Usuários e Convites
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao buscar usuários.');
    }
    
    return response.json();
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao excluir usuário.');
    }
    
    return response.json();
  },

  createInvite: async ({ role = 'admin', expires_in_hours = 24 }) => {
    const response = await fetch(`${API_BASE_URL}/users/invites`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ role, expires_in_hours: Number(expires_in_hours) }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao gerar link de convite.');
    }
    
    return response.json();
  },

  getInvites: async () => {
    const response = await fetch(`${API_BASE_URL}/users/invites`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao listar convites.');
    }
    
    return response.json();
  },

  validateInvite: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/invites/${token}`, {
      method: 'GET',
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Convite inválido ou expirado.');
    }
    
    return response.json();
  },

  acceptInvite: async (token, { username, email, password }) => {
    const response = await fetch(`${API_BASE_URL}/users/invites/${token}/accept`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao aceitar convite.');
    }
    
    return response.json();
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao carregar dados do usuário.');
    }
    
    return response.json();
  }
};
export default api;


