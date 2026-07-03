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
import { EmptyState } from '../components/States.jsx';

describe('primitives', () => {
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
      .toHaveAttribute('title', 'AI-assisted — human decision authority');
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
