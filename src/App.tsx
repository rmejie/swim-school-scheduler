import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import type { NavigationSection } from './components/Layout';
import InstructorForm from './components/InstructorForm';
import InstructorList from './components/InstructorList';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import { getInstructors as fetchInstructors, getClients as fetchClients } from './lib/firestore';

/**
 * Main App component showcasing the swim school scheduler components
 */
function App() {
  const [activeSection, setActiveSection] = useState<NavigationSection>('Dashboard');
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([
    { id: '1', name: 'Sarah Johnson' },
    { id: '2', name: 'Mike Chen' },
  ]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [instructorsError, setInstructorsError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const useRealFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true';

  useEffect(() => {
    if (!useRealFirestore) return;
    let isCancelled = false;
    async function load() {
      try {
        setLoadingInstructors(true);
        setInstructorsError(null);
        const data = await fetchInstructors();
        if (!isCancelled) setInstructors(data.map(d => ({ id: d.id, name: d.name })));
      } catch (err) {
        if (!isCancelled) setInstructorsError(err instanceof Error ? err.message : 'Failed to load instructors');
      } finally {
        if (!isCancelled) setLoadingInstructors(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [useRealFirestore]);

  useEffect(() => {
    if (!useRealFirestore) return;
    let isCancelled = false;
    async function load() {
      try {
        setLoadingClients(true);
        setClientsError(null);
        const data = await fetchClients();
        if (!isCancelled) setClients(data.map(d => ({ id: d.id, name: d.name, email: d.email })));
      } catch (err) {
        if (!isCancelled) setClientsError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        if (!isCancelled) setLoadingClients(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [useRealFirestore]);

  const handleSectionChange = (section: NavigationSection) => {
    setActiveSection(section);
    setShowInstructorForm(false);
    setShowClientForm(false);
  };

  const handleInstructorSuccess = (instructorId: string, name: string) => {
    const newInstructor = { id: instructorId, name };
    setInstructors(prev => [...prev, newInstructor]);
    setShowInstructorForm(false);
  };

  const handleClientSuccess = (clientId: string, name: string) => {
    const newClient = { id: clientId, name, email: '' };
    setClients(prev => [...prev, newClient]);
    setShowClientForm(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            {instructorsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{instructorsError}</p>
              </div>
            )}
            {clientsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{clientsError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Instructors</h3>
                {loadingInstructors ? (
                  <p className="text-gray-400">Loading...</p>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{instructors.length}</p>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Appointments</h3>
                <p className="text-3xl font-bold text-green-600">12</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Clients</h3>
                {loadingClients ? (
                  <p className="text-gray-400">Loading...</p>
                ) : (
                  <p className="text-3xl font-bold text-purple-600">{clients.length}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'Schedule':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Schedule</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Schedule management coming soon...</p>
            </div>
          </div>
        );
      case 'Instructors':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Instructors</h2>
              <button
                onClick={() => setShowInstructorForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Add Instructor
              </button>
            </div>
            {showInstructorForm ? (
              <InstructorForm
                onSuccess={handleInstructorSuccess}
                onCancel={() => setShowInstructorForm(false)}
              />
            ) : (
              <InstructorList />
            )}
          </div>
        );
      case 'Clients':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
              <button
                onClick={() => setShowClientForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Add Client
              </button>
            </div>
            {showClientForm ? (
              <ClientForm
                onSuccess={handleClientSuccess}
                onCancel={() => setShowClientForm(false)}
              />
            ) : (
              <ClientList />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeSection={activeSection} onSectionChange={handleSectionChange}>
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
