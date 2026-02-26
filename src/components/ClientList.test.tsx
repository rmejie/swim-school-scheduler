import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ClientList from './ClientList';
import * as firestoreUtils from '../lib/firestore';
import type { Client } from '../types';

vi.mock('../lib/firestore', () => ({
  getClients: vi.fn(),
}));

const mockedGetClients = firestoreUtils.getClients as unknown as ReturnType<typeof vi.fn>;

describe('ClientList', () => {
  const mockClients: Client[] = [
    { id: 'c1', name: 'Jane Doe', email: 'jane@example.com', phone: '555-1234', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'c2', name: 'John Smith', email: 'john@example.com', phone: '', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'c3', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-5678', createdAt: '2024-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state while fetching clients', async () => {
    mockedGetClients.mockImplementation(() => new Promise(() => {}));

    render(<ClientList />);

    expect(screen.getByText(/loading clients/i)).toBeInTheDocument();
  });

  it('should fetch and display list of clients', async () => {
    mockedGetClients.mockResolvedValue(mockClients);

    render(<ClientList />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    expect(mockedGetClients).toHaveBeenCalledTimes(1);
  });

  it('should display client email addresses', async () => {
    mockedGetClients.mockResolvedValue(mockClients);

    render(<ClientList />);

    await waitFor(() => {
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should display client phone when available', async () => {
    mockedGetClients.mockResolvedValue(mockClients);

    render(<ClientList />);

    await waitFor(() => {
      expect(screen.getByText('555-1234')).toBeInTheDocument();
      expect(screen.getByText('555-5678')).toBeInTheDocument();
    });
  });

  it('should display empty state when no clients exist', async () => {
    mockedGetClients.mockResolvedValue([]);

    render(<ClientList />);

    await waitFor(() => {
      expect(screen.getByText(/no clients/i)).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    const errorMessage = 'Failed to load clients';
    mockedGetClients.mockRejectedValue(new Error(errorMessage));

    render(<ClientList />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });

  it('should call getClients on mount', async () => {
    mockedGetClients.mockResolvedValue([]);

    render(<ClientList />);

    await waitFor(() => {
      expect(mockedGetClients).toHaveBeenCalledTimes(1);
    });
  });

  it('should display clients with proper styling', async () => {
    mockedGetClients.mockResolvedValue(mockClients);

    render(<ClientList />);

    await waitFor(() => {
      const listContainer = screen.getByTestId('client-list');
      expect(listContainer).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
    });
  });
});
