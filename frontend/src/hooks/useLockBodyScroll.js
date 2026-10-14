import { useEffect } from 'react';

/**
 * Hook para travar o scroll da página (body) enquanto um modal ou popup estiver aberto.
 * Ao fechar ou desmontar o componente, o scroll original é restaurado imediatamente.
 */
export function useLockBodyScroll(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = originalOverflow || '';
      document.body.classList.remove('modal-open');
    };
  }, [isLocked]);
}

export default useLockBodyScroll;
