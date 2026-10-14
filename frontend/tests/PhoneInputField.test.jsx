import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import PhoneInputField, { COUNTRIES } from '../src/components/PhoneInputField';

describe('PhoneInputField Component', () => {
  test('renderiza com a bandeira do Brasil e DDI +55 por padrão', () => {
    render(<PhoneInputField onChange={() => {}} />);

    expect(screen.getByTestId('selected-flag')).toHaveTextContent('🇧🇷');
    expect(screen.getByTestId('selected-ddi')).toHaveTextContent('+55');
    const input = screen.getByTestId('input-whatsapp-number');
    expect(input).toHaveAttribute('placeholder', '(11) 99999-9999');
  });

  test('abre o dropdown de países ao clicar no gatilho DDI e permite escolher outro país', () => {
    const handleChange = vi.fn();
    render(<PhoneInputField onChange={handleChange} />);

    const trigger = screen.getByTestId('ddi-dropdown-trigger');
    fireEvent.click(trigger);

    // Dropdown deve estar aberto
    expect(screen.getByTestId('ddi-dropdown-menu')).toBeInTheDocument();

    // Seleciona Estados Unidos (+1)
    const usOption = screen.getByTestId('country-option-us');
    fireEvent.click(usOption);

    // DDI e bandeira devem ter sido atualizados
    expect(screen.getByTestId('selected-flag')).toHaveTextContent('🇺🇸');
    expect(screen.getByTestId('selected-ddi')).toHaveTextContent('+1');
  });

  test('permite buscar país pelo nome ou código no campo de busca do dropdown', () => {
    render(<PhoneInputField onChange={() => {}} />);

    fireEvent.click(screen.getByTestId('ddi-dropdown-trigger'));
    const searchInput = screen.getByTestId('ddi-search-input');

    // Filtra por "Portugal"
    fireEvent.change(searchInput, { target: { value: 'Portugal' } });

    expect(screen.getByTestId('country-option-pt')).toBeInTheDocument();
    expect(screen.queryByTestId('country-option-us')).not.toBeInTheDocument();
  });

  test('formata e propaga o valor do telefone com DDI ao digitar', () => {
    const handleChange = vi.fn();
    render(<PhoneInputField onChange={handleChange} />);

    const input = screen.getByTestId('input-whatsapp-number');
    fireEvent.change(input, { target: { value: '11988887777' } });

    expect(input.value).toBe('(11) 98888-7777');
    expect(handleChange).toHaveBeenCalledWith('+55 (11) 98888-7777');
  });
});
