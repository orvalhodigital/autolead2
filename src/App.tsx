
import React, { useState } from 'react';
import { Lead, Vehicle, LeadPhase, LeadTemperature, SaleDetails, View } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import LeadManager from './components/LeadManager';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { supabase } from './lib/supabaseClient';
import { vehicleService } from './services/vehicleService';
import { leadService } from './services/leadService';
import Auth from './components/Auth';






// Definição das Fases para cada Menu
const ACTIVE_LEAD_PHASES = [
  LeadPhase.NEW,
  LeadPhase.SIMULATION,
  LeadPhase.VISIT,
  LeadPhase.FOLLOW_UP
];

const SALES_CLOSED_PHASES = [
  LeadPhase.WAITING_PAYMENT,
  LeadPhase.DOCUMENTATION,
  LeadPhase.DELIVERY,
  LeadPhase.COMPLETED
];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const loadData = async () => {
    try {
      const [vehiclesData, leadsData] = await Promise.all([
        vehicleService.getAll(),
        leadService.getAll()
      ]);
      setVehicles(vehiclesData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  React.useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
    try {
      const newVehicle = await vehicleService.create(v);
      setVehicles(prev => [newVehicle, ...prev]);
    } catch (error) {
      alert('Erro ao criar veículo');
      console.error(error);
    }
  };

  const updateVehicle = async (updated: Vehicle) => {
    try {
      const newVehicle = await vehicleService.update(updated);
      setVehicles(prev => prev.map(v => v.id === updated.id ? newVehicle : v));
    } catch (error) {
      alert('Erro ao atualizar veículo');
      console.error(error);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (window.confirm("Remover veículo permanentemente?")) {
      try {
        await vehicleService.delete(id);
        setVehicles(prev => prev.filter(v => v.id !== id));
      } catch (error) {
        alert('Erro ao excluir veículo');
        console.error(error);
      }
    }
  };

  const handleSellVehicle = async (vehicleId: string, saleDetails: SaleDetails) => {
    try {
      await vehicleService.sell(vehicleId, saleDetails);

      // 1. Atualizar status do veículo localmente
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            status: 'sold',
            saleDetails: saleDetails
          };
        }
        return v;
      }));

      // 2. Mover o Lead para o funil de Pós-Venda (se houver comprador vinculado)
      if (saleDetails.buyerLeadId) {
        const leadToUpdate = leads.find(l => l.id === saleDetails.buyerLeadId);
        if (leadToUpdate) {
          try {
            // Update history manually since we are bypassing the main updateLead wrapper
            const now = new Date().toISOString();
            const newPhase = LeadPhase.COMPLETED;

            const updatedHistory = {
              ...leadToUpdate.funnelHistory,
              [newPhase]: now
            };

            const updatedLead = await leadService.update({
              ...leadToUpdate,
              phase: newPhase,
              lastUpdate: now,
              funnelHistory: updatedHistory
            });
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
          } catch (err) {
            console.error('Erro ao atualizar lead na venda', err);
          }
        }
      }
    } catch (error) {
      alert('Erro ao registrar venda');
      console.error(error);
    }
  };

  const updateLead = async (updated: Lead) => {
    // 1. Calculate new history logic synchronously to allow optimistic update with correct history
    const oldLead = leads.find(l => l.id === updated.id);
    let newHistory = { ...updated.funnelHistory };
    const now = new Date().toISOString();

    if (oldLead && oldLead.phase !== updated.phase) {
      newHistory[updated.phase] = now;
      if (updated.phase === LeadPhase.DISQUALIFIED) {
        const createdTime = newHistory[LeadPhase.NEW];
        newHistory = {
          [LeadPhase.NEW]: createdTime || now,
          [LeadPhase.DISQUALIFIED]: now
        };
      }
    }

    const leadToSave = { ...updated, funnelHistory: newHistory };

    // 2. Optimistic Update
    setLeads(prev => prev.map(l => l.id === updated.id ? leadToSave : l));

    try {
      // 3. Server Persist
      const savedLead = await leadService.update(leadToSave);

      // 4. Confirm with server data (e.g. correct formatting)
      setLeads(prev => prev.map(l => l.id === updated.id ? savedLead : l));
    } catch (error) {
      // Revert if error (simple revert to oldLead if widely available, or just alert)
      console.error(error);
      alert('Erro ao atualizar lead. Recarregue a página.');
      if (oldLead) {
        setLeads(prev => prev.map(l => l.id === updated.id ? oldLead : l));
      }
    }
  };

  const addLead = async (l: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate' | 'funnelHistory'>) => {
    try {
      const leadWithHistory = {
        ...l,
        funnelHistory: {
          [LeadPhase.NEW]: new Date().toISOString()
        }
      };
      // @ts-ignore - LeadService handles the id/dates generation but type expects full object? No, create expects Omit
      // Actually my create in service expects Omit<Lead, 'id' | ...>. But I added funnelHistory to Lead.
      // So I need to cast or ensure types match. Service create arg type is derived from Lead.
      // Let's just pass it. The Omit in generic above might need adjustment or I cast.
      const newLead = await leadService.create(leadWithHistory as any);
      setLeads(prev => [newLead, ...prev]);
    } catch (error) {
      alert('Erro ao criar lead');
      console.error(error);
    }
  };

  const deleteLead = async (id: string) => {
    if (window.confirm("Remover lead permanentemente?")) {
      try {
        await leadService.delete(id);
        setLeads(prev => prev.filter(l => l.id !== id));
      } catch (error) {
        alert('Erro ao excluir lead');
        console.error(error);
      }
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA] text-emerald-500 font-bold">Carregando...</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-slate-800">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header currentView={currentView} />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col animate-fadeUp">
            {currentView === 'dashboard' && <Dashboard leads={leads} vehicles={vehicles} />}

            {currentView === 'inventory' && (
              <Inventory
                vehicles={vehicles}
                onAddVehicle={addVehicle}
                onUpdateVehicle={updateVehicle}
                onDeleteVehicle={deleteVehicle}
                onSellVehicle={handleSellVehicle}
                leads={leads}
              />
            )}

            {currentView === 'leads' && (
              <LeadManager
                leads={leads}
                phases={ACTIVE_LEAD_PHASES} // Mostra apenas fases ativas
                vehicles={vehicles}
                onUpdateLead={updateLead}
                onAddLead={addLead}
                onDeleteLead={deleteLead}
              />
            )}

            {currentView === 'sales-closed' && (
              <LeadManager
                leads={leads}
                phases={SALES_CLOSED_PHASES} // Mostra apenas fases de pós-venda
                type="sales"
                vehicles={vehicles}
                onUpdateLead={updateLead}
                onAddLead={addLead}
                onDeleteLead={deleteLead}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
