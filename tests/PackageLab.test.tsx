import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PackageLab from '../components/PackageLab';

vi.mock('pdfjs-embed-viewer', () => ({
  default: ({ url }: { url: string }) => <div data-testid="pdf-mock">PDF loaded: {url}</div>,
}));

vi.mock('form_recaptcha', () => ({
  default: ({ setCodeValue }: { setCodeValue: (value: string) => void }) => (
    <button type="button" onClick={() => setCodeValue('ABC12')}>
      Generate mock challenge
    </button>
  ),
}));

describe('npm package integration lab', () => {
  it('defaults to the PDF viewer and loads the bundled PDF', async () => {
    render(<PackageLab />);
    expect(screen.getByRole('heading', { name: /pdf.js embed viewer/i })).toBeInTheDocument();
    expect(await screen.findByTestId('pdf-mock')).toHaveTextContent('/sample.pdf');
    expect(screen.getByRole('region', { name: /embedded pdf viewer/i })).toHaveAttribute('tabindex', '0');
  });

  it('allows updating the PDF URL and reloading', async () => {
    const user = userEvent.setup();
    render(<PackageLab />);
    await screen.findByTestId('pdf-mock');
    const input = screen.getByRole('textbox', { name: 'PDF URL' });
    await user.clear(input);
    await user.type(input, '/another.pdf');
    await user.click(screen.getByRole('button', { name: 'Reload PDF' }));
    expect(screen.getByTestId('pdf-mock')).toHaveTextContent('/another.pdf');
  });

  it('switches to CAPTCHA and lets users compare the challenge', async () => {
    const user = userEvent.setup();
    render(<PackageLab />);
    await user.click(screen.getByRole('button', { name: 'Canvas CAPTCHA' }));
    await user.click(await screen.findByRole('button', { name: 'Generate mock challenge' }));
    const compare = screen.getByRole('button', { name: 'Compare answer' });
    expect(compare).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: /enter the characters/i }), 'ABC12');
    await user.click(compare);
    expect(screen.getByRole('status')).toHaveTextContent('Match:');
    expect(screen.getByRole('region', { name: 'Diagnostic event log' })).toHaveAttribute('tabindex', '0');
  });

  it('reports incorrect CAPTCHA answers and can reset', async () => {
    const user = userEvent.setup();
    render(<PackageLab />);
    await user.click(screen.getByRole('button', { name: 'Canvas CAPTCHA' }));
    await user.click(await screen.findByRole('button', { name: 'Generate mock challenge' }));
    await user.type(screen.getByRole('textbox', { name: /enter the characters/i }), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Compare answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Not a match');
    await user.click(screen.getByRole('button', { name: 'Reset challenge' }));
    expect(screen.getByRole('button', { name: 'Compare answer' })).toBeDisabled();
    expect(screen.queryByText(/Not a match/)).not.toBeInTheDocument();
  });

  it('changes sections using keyboard-accessible buttons', async () => {
    render(<PackageLab />);
    const captchaTab = screen.getByRole('button', { name: 'Canvas CAPTCHA' });
    expect(captchaTab).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(captchaTab);
    await waitFor(() => expect(captchaTab).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByRole('heading', { name: 'Canvas CAPTCHA' })).toBeInTheDocument();
  });
});
