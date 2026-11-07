import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import PackageLab from '../components/PackageLab';

expect.extend(toHaveNoViolations);

vi.mock('pdfjs-embed-viewer', () => ({
  default: () => <div aria-label="Mock PDF document">PDF mock</div>,
}));

vi.mock('form_recaptcha', () => ({
  default: () => <div aria-label="Mock visual challenge">CAPTCHA mock</div>,
}));

vi.mock('pagination-dropdown-select', () => ({
  default: () => <nav aria-label="Sample records pagination"><button type="button">Next page</button></nav>,
}));

describe('automated accessibility checks', () => {
  it('finds no axe violations in the PDF demo wrapper', async () => {
    const { container } = render(<PackageLab />);
    await screen.findByText('PDF mock');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('finds no axe violations in the CAPTCHA demo wrapper', async () => {
    const user = userEvent.setup();
    const { container } = render(<PackageLab />);
    await user.click(screen.getByRole('button', { name: 'Canvas CAPTCHA' }));
    await screen.findByText('CAPTCHA mock');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('finds no axe violations in the pagination demo wrapper', async () => {
    const user = userEvent.setup();
    const { container } = render(<PackageLab />);
    await user.click(screen.getByRole('button', { name: 'Pagination & dropdown' }));
    expect(await axe(container)).toHaveNoViolations();
  });

});
