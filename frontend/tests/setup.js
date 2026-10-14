import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Configurações globais de mocks se necessário (ex: window.fetch, localStorage)
beforeAll(() => {
  // Mock do localStorage para testes
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
});

afterEach(() => {
  // Limpar mocks após cada teste
});
