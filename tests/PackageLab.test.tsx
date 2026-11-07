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

vi.mock('pagination-dropdown-select', () => ({
  default: ({ pageSizeArray, totalResultsNumber, pageSize, setPageSize, currentPage, setCurrentPage, ariaLabel }: {
    pageSizeArray: number[];
    totalResultsNumber: number;
    pageSize: number;
    setPageSize: (value: number) => void;
    currentPage: number;
    setCurrentPage: (value: number) => void;
    ariaLabel: string;
  }) => {
    const totalPages = Math.max(1, Math.ceil(totalResultsNumber / pageSize));
    return (
      <nav aria-label={ariaLabel}>
        <label>Per page
          <select aria-label="Results per page" value={pageSize} onChange={(event) => {
            setPageSize(Number(event.target.value));
            setCurrentPage(1);
          }}>
            {pageSizeArray.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
        <label>Page
          <select aria-label="Current page" value={currentPage} onChange={(event) => setCurrentPage(Number(event.target.value))}>
            {Array.from({ length: totalPages }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
          </select>
        </label>
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
      </nav>
    );
  },
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

  it('paginates 87 records, changes page size and resets page on search', async () => {
    const user = userEvent.setup();
    render(<PackageLab />);
    await user.click(screen.getByRole('button', { name: 'Pagination & dropdown' }));
    expect(screen.getByRole('heading', { name: 'Pagination Dropdown Select' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Sample records pagination' })).toBeInTheDocument();
    expect(screen.getByText('Showing 1–10 of 87 matching records')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Showing 11–20 of 87 matching records')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Results per page' }), '20');
    expect(screen.getByText('Showing 1–20 of 87 matching records')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search sample records' }), 'record 025');
    expect(screen.getByText('Showing 1–1 of 1 matching records')).toBeInTheDocument();
    expect(screen.getByText('Sample record 025')).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox', { name: 'Search sample records' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search sample records' }), 'not-a-record');
    expect(screen.getByText('Showing 0–0 of 0 matching records')).toBeInTheDocument();
    expect(screen.getByText('No matching records. Try a different search.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset example' }));
    expect(screen.getByText('Showing 1–10 of 87 matching records')).toBeInTheDocument();
  });

});
