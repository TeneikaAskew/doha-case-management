import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge.jsx';
import KPICard from '../components/KPICard.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import AIBadge from '../components/AIBadge.jsx';
import ConfidenceBar from '../components/ConfidenceBar.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import KVGrid from '../components/KVGrid.jsx';
import DataTable from '../components/DataTable.jsx';
import Toggle from '../components/Toggle.jsx';
import Count from '../components/Count.jsx';
import { EmptyState } from '../components/States.jsx';

describe('primitives', () => {
  it('Count renders both a full and a compact form of a large number', () => {
    const { container } = render(<Count value={3410000} />);
    expect(container.querySelector('.count-full').textContent).toBe('3,410,000');
    expect(container.querySelector('.count-compact').textContent).toBe('3.4M');
  });

  it('Toggle renders as a switch, fires onChange, and supports disabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Toggle checked={false} onChange={onChange} label="Use Gemini" />);
    const input = screen.getByRole('switch', { name: 'Use Gemini' });
    expect(input).not.toBeChecked();
    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<Toggle checked disabled onChange={onChange} label="Use Gemini" />);
    expect(screen.getByRole('switch', { name: 'Use Gemini' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Use Gemini' })).toBeDisabled();
  });

  it('StatusBadge applies variant class', () => {
    render(<StatusBadge variant="success">Clear</StatusBadge>);
    expect(screen.getByText('Clear').className).toContain('success');
  });

  it('KPICard renders label, value, subtitle', () => {
    render(<KPICard label="Open cases" value={12} subtitle="3 overdue" accent="var(--dcsa-gold)" />);
    expect(screen.getByText('Open cases')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 overdue')).toBeInTheDocument();
  });

  it('KPICard compacts a large numeric value for phones', () => {
    const { container } = render(<KPICard label="Records" value={3410000} />);
    expect(container.querySelector('.count-full').textContent).toBe('3,410,000');
    expect(container.querySelector('.count-compact').textContent).toBe('3.4M');
  });

  it('KPICard shows a trend arrow and a progress bar when asked', () => {
    render(<KPICard label="Records" value="1,000" subtitle="+0.6% this quarter"
      trend="up" progressPct={55} />);
    expect(screen.getByLabelText('increasing')).toBeInTheDocument();
    const bar = screen.getByRole('img', { name: '55% of 100' });
    expect(bar.querySelector('.kpi-progress-fill').style.width).toBe('55%');
  });

  it('KPICard with onClick renders as a button and fires', () => {
    const onClick = vi.fn();
    render(<KPICard label="Open alerts" value={5} onClick={onClick} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('kpi-clickable');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('KPICard applies the active class when active', () => {
    render(<KPICard label="New" value={2} onClick={() => {}} active />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('active');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('GuidelineChip shows letter with full name tooltip', () => {
    render(<GuidelineChip code="F" />);
    expect(screen.getByText('F')).toHaveAttribute('title', 'Financial Considerations');
  });

  it('SeverityBadge renders level letter', () => {
    render(<SeverityBadge level="C" />);
    expect(screen.getByText('C').className).toContain('level-c');
  });

  it('AIBadge carries the human-authority tooltip', () => {
    render(<AIBadge />);
    expect(screen.getByText('AI-assisted'))
      .toHaveAttribute('title', 'AI-assisted - human decision authority');
  });

  it('ConfidenceBar shows percent', () => {
    render(<ConfidenceBar value={0.96} />);
    expect(screen.getByText('96%')).toBeInTheDocument();
  });

  it('CollapsibleSection toggles content', () => {
    render(<CollapsibleSection title="Details"><p>Body text</p></CollapsibleSection>);
    expect(screen.queryByText('Body text')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('KVGrid renders pairs', () => {
    render(<KVGrid items={[{ label: 'Tier', value: 'T5' }]} />);
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
  });

  it('DataTable sorts on header click and handles row clicks', () => {
    const onRowClick = vi.fn();
    const rows = [{ id: 'b', n: 2 }, { id: 'a', n: 1 }];
    render(<DataTable
      columns={[{ key: 'id', label: 'ID', sortable: true }, { key: 'n', label: 'N' }]}
      rows={rows} rowKey="id" onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('ID'));
    const cells = screen.getAllByRole('row').slice(1).map((r) => r.cells[0].textContent);
    expect(cells).toEqual(['a', 'b']);
    fireEvent.click(screen.getAllByRole('row')[1]);
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('EmptyState renders title and message', () => {
    render(<EmptyState title="No alerts" message="Nothing needs review." />);
    expect(screen.getByText('No alerts')).toBeInTheDocument();
  });
});
