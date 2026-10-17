import { render, screen } from '@testing-library/react';
import App from './App';

// Garante que o painel monta e a marca da campanha aparece
test('renderiza a marca da campanha', () => {
  render(<App />);
  const marca = screen.getByRole('img', { name: /dunesday/i });
  expect(marca).toBeInTheDocument();
});
