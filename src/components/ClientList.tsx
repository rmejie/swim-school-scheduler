import React, { useState, useEffect } from 'react';
import { getClients } from '../lib/firestore';
import type { Client } from '../types';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchClients() {
      try {
        setLoading(true);
        setError(null);
        const data = await getClients();
        if (!isCancelled) setClients(data);
      } catch (err) {
        if (!isCancelled) setError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchClients();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Clients</h3>
        <p className="text-gray-500">Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Clients</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Clients</h3>
        <p className="text-gray-500">No clients added yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md" data-testid="client-list">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Clients</h3>
        <ul className="space-y-3" role="list">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div>
                <span className="font-medium text-gray-900">{client.name}</span>
                <span className="ml-3 text-sm text-gray-500">{client.email}</span>
                {client.phone && (
                  <span className="ml-3 text-sm text-gray-400">{client.phone}</span>
                )}
              </div>
              <span className="text-sm text-gray-500">ID: {client.id}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClientList;
