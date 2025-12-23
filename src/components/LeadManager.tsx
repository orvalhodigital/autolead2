import React, { useState, useMemo } from 'react';
import {
  Plus, MessageCircle, Filter, LayoutGrid, Rows, ChevronLeft, ChevronRight,
  Edit2, Check, X, Car, Trash2, Phone, Mail, ArrowRight,
  Target, Zap, Clock, User, CalendarCheck, DollarSign
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Lead, LeadPhase, LeadTemperature, Vehicle, VehicleType, TransmissionType, EngineType } from '../types';

interface LeadManagerProps {
  leads: Lead[];
  vehicles: Vehicle[];
  phases: LeadPhase[];
  type?: 'leads' | 'sales'; // New prop to distinguish view type
  onUpdateLead: (lead: Lead) => void;
  onAddLead: (l: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>) => void;
  onDeleteLead: (id: string) => void;
}

const VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van', 'Em aberto'];
const TRANSMISSION_TYPES: TransmissionType[] = ['Manual', 'Automático', 'Em aberto'];
const SOURCES = ['Meta Ads', 'Google Ads', 'WhatsApp', 'Indicação', 'Site'];

const LeadManager: React.FC<LeadManagerProps> = ({
  leads, vehicles, phases, type = 'leads', onUpdateLead, onAddLead, onDeleteLead
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDisqualifiedExpanded, setIsDisqualifiedExpanded] = useState(false);

  // Edit Preferences State
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [preferencesForm, setPreferencesForm] = useState({
    types: [] as VehicleType[],
    maxPrice: 0,
    minPrice: 0,
    brands: [] as string[],
    transmission: 'Em aberto' as TransmissionType,
    engine: 'Em aberto' as EngineType,
    additionalNotes: ''
  });

  const handleEditPreferences = (lead: Lead) => {
    setPreferencesForm({
      types: lead.preferences.types,
      maxPrice: lead.preferences.maxPrice || 0,
      minPrice: lead.preferences.minPrice || 0,
      brands: lead.preferences.brands,
      transmission: lead.preferences.transmission,
      engine: lead.preferences.engine || 'Em aberto',
      additionalNotes: lead.preferences.additionalNotes || ''
    });
    setIsEditingPreferences(true);
  };

  const handleSavePreferences = () => {
    if (!selectedLead) return;

    onUpdateLead({
      ...selectedLead,
      preferences: {
        ...selectedLead.preferences,
        types: preferencesForm.types,
        maxPrice: preferencesForm.maxPrice || undefined,
        minPrice: preferencesForm.minPrice || undefined,
        brands: preferencesForm.brands,
        transmission: preferencesForm.transmission,
        engine: preferencesForm.engine,
        additionalNotes: preferencesForm.additionalNotes
      }
    });
    setIsEditingPreferences(false);
  };

  // Edit Personal Info State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name: '', phone: '', email: '', temperature: LeadTemperature.COLD, source: '', phase: LeadPhase.NEW
  });

  const handleEditInfo = (lead: Lead) => {
    setInfoForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      temperature: lead.temperature,
      source: lead.source,
      phase: lead.phase
    });
    setIsEditingInfo(true);
  };

  const handleSaveInfo = () => {
    if (!selectedLead) return;
    onUpdateLead({
      ...selectedLead,
      name: infoForm.name,
      phone: infoForm.phone,
      email: infoForm.email,
      temperature: infoForm.temperature,
      source: infoForm.source,
      phase: infoForm.phase
    });
    setIsEditingInfo(false);
  };

  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', email: '', phase: LeadPhase.NEW,
    temperature: LeadTemperature.COLD, source: 'Site'
  });

  const getTempStyle = (temp: LeadTemperature) => {
    switch (temp) {
      case LeadTemperature.HOT: return 'text-red-500 bg-red-50 border-red-100';
      case LeadTemperature.WARM: return 'text-orange-500 bg-orange-50 border-orange-100';
      case LeadTemperature.COLD: return 'text-blue-500 bg-blue-50 border-blue-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({
      ...leadForm,
      preferences: {
        types: ['Em aberto'], brands: [], models: [],
        transmission: 'Em aberto', engine: 'Em aberto', additionalNotes: ''
      },
      presentedVehicles: [], notes: ''
    });
    setIsFormOpen(false);
    setLeadForm({ name: '', phone: '', email: '', phase: LeadPhase.NEW, temperature: LeadTemperature.COLD, source: 'Site' });
  };

  const handleDelete = (id: string) => {
    onDeleteLead(id);
    setSelectedLead(null);
  };

  const matchingVehicles = useMemo(() => {
    if (!selectedLead) return [];
    const p = selectedLead.preferences;
    return vehicles.filter(v =>
      v.status === 'available' &&
      (p.types.includes('Em aberto') || p.types.length === 0 || p.types.includes(v.type)) &&
      (!p.maxPrice || v.price <= p.maxPrice)
    );
  }, [selectedLead, vehicles]);

  const purchasedVehicles = useMemo(() => {
    if (!selectedLead) return [];
    return vehicles.filter(v => v.saleDetails?.buyerLeadId === selectedLead.id);
  }, [selectedLead, vehicles]);

  // Filtra leads que pertencem às fases atuais, incluindo sempre desqualificados
  const visibleLeads = useMemo(() => {
    return leads.filter(l => phases.includes(l.phase) || l.phase === LeadPhase.DISQUALIFIED);
  }, [leads, phases]);

  // Combined phases for rendering: props.phases + Disqualified
  const displayPhases = useMemo(() => {
    return [...phases, LeadPhase.DISQUALIFIED];
  }, [phases]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedLead = leads.find(l => l.id === draggableId);
    if (draggedLead) {
      // Calculate new phase (destination.droppableId should be the phase string)
      // Note: destination.droppableId is type string, Phase is enum. Enum values are strings.
      // We accept it matches.
      const newPhase = destination.droppableId as LeadPhase;

      // If phase really changed
      if (newPhase !== draggedLead.phase) {
        onUpdateLead({ ...draggedLead, phase: newPhase });
      }
    }
  };

  // Sync selectedLead when global leads state changes to ensure UI up-to-date
  React.useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id);
      if (updated && updated !== selectedLead) {
        setSelectedLead(updated);
      }
    }
  }, [leads]);

  if (selectedLead) {
    return (
      <div className="animate-fadeUp max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setSelectedLead(null)} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="font-extrabold text-xs uppercase tracking-widest">Voltar</span>
          </button>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(selectedLead.id)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all">
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Profile */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center relative group-card">
              {!isEditingInfo && (
                <button
                  onClick={() => handleEditInfo(selectedLead)}
                  className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              )}

              <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-5xl text-white font-black shadow-2xl mb-6">
                {selectedLead.name.charAt(0)}
              </div>

              {isEditingInfo ? (
                <div className="w-full space-y-4 mb-6">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 block text-left">Nome</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors text-center"
                      value={infoForm.name}
                      onChange={e => setInfoForm({ ...infoForm, name: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <select
                      className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1.5 rounded-lg border outline-none appearance-none cursor-pointer ${getTempStyle(infoForm.temperature)}`}
                      value={infoForm.temperature}
                      onChange={e => setInfoForm({ ...infoForm, temperature: e.target.value as LeadTemperature })}
                    >
                      {Object.values(LeadTemperature).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 outline-none appearance-none cursor-pointer"
                      value={infoForm.source}
                      onChange={e => setInfoForm({ ...infoForm, source: e.target.value })}
                    >
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mb-4">{selectedLead.name}</h2>
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getTempStyle(selectedLead.temperature)} `}>
                      {selectedLead.temperature}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
                      {selectedLead.source}
                    </span>
                  </div>
                </>
              )}

              <div className="w-full bg-slate-50 rounded-xl p-4 text-center mb-4">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Status Atual</p>
                {isEditingInfo ? (
                  <select
                    className="w-full bg-transparent text-center text-sm font-bold text-emerald-600 uppercase outline-none cursor-pointer"
                    value={infoForm.phase}
                    onChange={e => setInfoForm({ ...infoForm, phase: e.target.value as LeadPhase })}
                  >
                    {Object.values(LeadPhase).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-emerald-600 uppercase">{selectedLead.phase}</p>
                )}
              </div>

              <div className="w-full space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4 text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</p>
                    {isEditingInfo ? (
                      <input
                        className="w-full bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors"
                        value={infoForm.phone}
                        onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 truncate">{selectedLead.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                    {isEditingInfo ? (
                      <input
                        className="w-full bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors"
                        value={infoForm.email}
                        onChange={e => setInfoForm({ ...infoForm, email: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 truncate">{selectedLead.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditingInfo ? (
                <div className="flex w-full gap-3 mt-8">
                  <button onClick={() => setIsEditingInfo(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button onClick={handleSaveInfo} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Salvar</button>
                </div>
              ) : (
                <button onClick={() => window.open(`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`, '_blank')} className="w-full mt-8 py-4 bg-emerald-500 text-white rounded-2xl font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                  <MessageCircle size={18} /> WhatsApp
                </button>
              )}
            </div>
          </div >

          {/* Right Col: Details & Matches */}
          < div className="lg:col-span-2 space-y-8" >
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Target size={24} className="text-slate-300" />
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Perfil de Interesse</h3>
                </div>
                {isEditingPreferences ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingPreferences(false)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-900 transition-colors">
                      <X size={16} />
                    </button>
                    <button onClick={handleSavePreferences} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleEditPreferences(selectedLead)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
                    <Edit2 size={16} />
                  </button>
                )}
              </div>

              {isEditingPreferences ? (
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Veículo</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                      value={preferencesForm.types[0] || 'Em aberto'}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, types: [e.target.value as VehicleType] })}
                    >
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Orçamento Mínimo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        value={preferencesForm.minPrice || ''}
                        placeholder="0"
                        onChange={(e) => setPreferencesForm({ ...preferencesForm, minPrice: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Orçamento Máximo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        value={preferencesForm.maxPrice || ''}
                        placeholder="Indefinido"
                        onChange={(e) => setPreferencesForm({ ...preferencesForm, maxPrice: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Marcas Preferidas (separadas por vírgula)</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                      value={preferencesForm.brands.join(', ')}
                      placeholder="Ex: Honda, Toyota"
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, brands: e.target.value.split(',').map(s => s.trim()) })}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Transmissão</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                      value={preferencesForm.transmission}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, transmission: e.target.value as TransmissionType })}
                    >
                      {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Motorização</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                      value={preferencesForm.engine}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, engine: e.target.value as EngineType })}
                    >
                      {['1.0', '1.4', '1.6', '2.0+', 'Elétrico', 'Híbrido', 'Em aberto'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Observações Adicionais</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors resize-none"
                      rows={3}
                      value={preferencesForm.additionalNotes}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, additionalNotes: e.target.value })}
                      placeholder="Detalhes específicos..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Tipo de Veículo</p>
                    <p className="text-xl font-black text-slate-900 uppercase">{selectedLead.preferences.types[0] || 'Qualquer'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Orçamento Mínimo</p>
                    <p className="text-xl font-black text-slate-900 uppercase">R$ {selectedLead.preferences.minPrice?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Orçamento Máximo</p>
                    <p className="text-xl font-black text-emerald-500 uppercase">R$ {selectedLead.preferences.maxPrice?.toLocaleString() || 'Indefinido'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Marcas Preferidas</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.preferences.brands.length > 0 ? selectedLead.preferences.brands.map((b, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 uppercase">{b}</span>
                      )) : <span className="text-slate-400 font-medium italic">Indiferente</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Transmissão</p>
                    <p className="text-base font-bold text-slate-700 uppercase">{selectedLead.preferences.transmission}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Motorização</p>
                    <p className="text-base font-bold text-slate-700 uppercase">{selectedLead.preferences.engine || 'Em aberto'}</p>
                  </div>
                  {selectedLead.preferences.additionalNotes && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Observações</p>
                      <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {selectedLead.preferences.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              {purchasedVehicles.length > 0 ? (
                <>
                  <h3 className="text-sm font-extrabold text-emerald-600 uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
                    <CalendarCheck size={18} /> Veículos Comprados ({purchasedVehicles.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {purchasedVehicles.map(v => (
                      <div key={v.id} className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                            <Car size={24} />
                          </div>
                          <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-1 rounded-md">COMPRADO</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">{v.brand} {v.model}</h4>
                          <p className="text-xs font-bold text-slate-500 mt-1">{v.year} • {v.mileage.toLocaleString()} km</p>
                          <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Pago</p>
                            <p className="text-lg font-black text-emerald-600">R$ {v.saleDetails?.salePrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-6 px-2">Sugestões de Estoque ({matchingVehicles.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchingVehicles.map(v => (
                      <div key={v.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                            <Car size={24} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{v.year}</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">{v.brand} {v.model}</h4>
                          <p className="text-sm font-bold text-emerald-500 mt-1">R$ {v.price.toLocaleString()}</p>
                        </div>
                        <button onClick={() => alert("Funcionalidade de sugestão em breve")} className="w-full py-2.5 mt-auto bg-slate-50 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          Sugerir
                        </button>
                      </div>
                    ))}
                    {matchingVehicles.length === 0 && (
                      <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum veículo compatível no momento</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div >
        </div >
      </div >
    );
  }

  // View for Sales Closed (List only, specific layout)
  if (type === 'sales') {
    return (
      <div className="flex flex-col space-y-6 h-full animate-fadeUp">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Histórico de Vendas</h3>
          <button onClick={() => alert("Filtros de vendas em breve")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={14} className="text-slate-400" /> Filtrar
          </button>
        </div>

        <div className="space-y-4">
          {visibleLeads.map(lead => {
            const boughtVehicles = vehicles.filter(v => v.saleDetails?.buyerLeadId === lead.id);
            return (
              <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Left: Customer */}
                  <div className="flex items-center gap-6 p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-slate-900/20">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                      <h4 className="font-black text-slate-900 text-lg uppercase leading-none">{lead.name}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">{lead.email}</p>
                    </div>
                  </div>

                  {/* Right: Vehicle Info */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Veículos Comprados</p>
                    {boughtVehicles.length > 0 ? (
                      boughtVehicles.map(v => (
                        <div key={v.id} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                              <Car size={20} />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 uppercase text-sm">{v.brand} {v.model}</p>
                              <p className="text-[10px] font-bold text-emerald-600">{new Date(v.saleDetails?.saleDate!).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-600">R$ {v.saleDetails?.salePrice.toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-100 text-center">
                        <p className="text-xs font-bold text-slate-300 uppercase">Processando venda...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {visibleLeads.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                <Check size={40} />
              </div>
              <h3 className="text-slate-900 font-bold">Nenhuma venda registrada ainda</h3>
              <p className="text-slate-400 text-sm">As vendas concluídas aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard Kanban / List View for Active Leads
  return (
    <div className="flex flex-col space-y-6 h-full animate-fadeUp">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={16} strokeWidth={2.5} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <Rows size={16} strokeWidth={2.5} />
            </button>
          </div>
          <button onClick={() => alert("Filtros de leads em breve")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={14} className="text-slate-400" /> Filtrar
          </button>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-extrabold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all uppercase tracking-wider text-xs">
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 pb-4">
            <div className="flex gap-6 h-full w-full">
              {displayPhases.map((phase) => {
                // Special render for Disqualified
                if (phase === LeadPhase.DISQUALIFIED) {
                  const disqLeads = visibleLeads.filter(l => l.phase === phase);
                  if (!isDisqualifiedExpanded) {
                    return (
                      <Droppable droppableId={phase} key={phase}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            onClick={() => setIsDisqualifiedExpanded(true)}
                            className={`w-12 flex flex-col items-center justify-center py-4 bg-red-50/50 border-l border-red-100 cursor-pointer hover:bg-red-100 transition-colors rounded-l-2xl ml-4 h-full gap-2 ${snapshot.isDraggingOver ? 'bg-red-200 ring-2 ring-red-300' : ''}`}
                          >
                            <span className="text-xl" role="img" aria-label="Desqualificado">🚫</span>
                            <span className="text-[10px] font-bold text-red-300">{disqLeads.length}</span>
                            {/* Hidden placeholder to satisfy dnd */}
                            <div className="hidden">{provided.placeholder}</div>
                          </div>
                        )}
                      </Droppable>
                    );
                  }
                }

                return (
                  <div key={phase} className={`flex flex-col gap-6 flex-1 min-w-[200px] transition-all p-4 rounded-3xl border ${phase === LeadPhase.DISQUALIFIED ? 'bg-red-50/30 border-red-100' : (phase === LeadPhase.FOLLOW_UP ? 'bg-emerald-50/30 border-emerald-100' : 'border-transparent')}`}>
                    <div className="flex items-center justify-between px-2">
                      <h3 className={`font-extrabold text-[10px] uppercase tracking-[0.25em] ${phase === LeadPhase.DISQUALIFIED ? 'text-red-400' : (phase === LeadPhase.FOLLOW_UP ? 'text-emerald-600' : 'text-slate-400')}`}>
                        {phase}
                        {phase === LeadPhase.DISQUALIFIED && (
                          <button onClick={(e) => { e.stopPropagation(); setIsDisqualifiedExpanded(false); }} className="ml-2 p-1 hover:bg-red-100 rounded-full text-red-400"><X size={12} /></button>
                        )}
                      </h3>
                      <span className={`text-[10px] font-bold ${phase === LeadPhase.DISQUALIFIED ? 'text-red-400' : (phase === LeadPhase.FOLLOW_UP ? 'text-emerald-600' : 'text-slate-400')}`}>
                        {visibleLeads.filter(l => l.phase === phase).length}
                      </span>
                    </div>

                    <Droppable droppableId={phase}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-4 overflow-y-auto hide-scrollbar min-h-[150px] ${snapshot.isDraggingOver ? 'bg-slate-50/50 rounded-2xl' : ''}`}
                        >
                          {visibleLeads.filter(l => l.phase === phase).map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}
                                  onClick={() => setSelectedLead(lead)}
                                  className={`bg-white p-5 rounded-3xl border border-slate-100 cursor-pointer transition-all duration-300 group relative ${phase === LeadPhase.DISQUALIFIED ? 'hover:border-red-200 hover:shadow-red-500/5' : 'hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5'} ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-lg border ${getTempStyle(lead.temperature)}`}>
                                      {lead.temperature}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-bold text-[10px] text-slate-400">{lead.name.charAt(0)}</div>
                                  </div>
                                  <h4 className="font-extrabold text-slate-900 text-sm mb-1 tracking-tight leading-none uppercase">{lead.name}</h4>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">{lead.source}</p>

                                  <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-50">
                                    <MessageCircle size={14} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Lead</th>
                <th className="px-10 py-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Fase</th>
                <th className="px-10 py-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Origem</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/50 cursor-pointer transition-all" onClick={() => setSelectedLead(lead)}>
                  <td className="px-10 py-5">
                    <p className="font-extrabold text-slate-900 text-sm tracking-tight uppercase leading-none">{lead.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{lead.email}</p>
                  </td>
                  <td className="px-10 py-5">
                    <span className="text-[9px] font-extrabold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg uppercase tracking-widest">{lead.phase}</span>
                  </td>
                  <td className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.source}</td>
                  <td className="px-10 py-5 text-right"><ChevronRight size={16} className="text-slate-200 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple Create Lead Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-fadeUp overflow-hidden" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateLead}>
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Novo Lead</h2>
                <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Cliente</label>
                  <input required value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp</label>
                    <input required value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origem</label>
                    <select value={leadForm.source} onChange={e => setLeadForm({ ...leadForm, source: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm">
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funil</label>
                    <select value={leadForm.phase} onChange={e => setLeadForm({ ...leadForm, phase: e.target.value as LeadPhase })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm">
                      {phases.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temperatura</label>
                    <select value={leadForm.temperature} onChange={e => setLeadForm({ ...leadForm, temperature: e.target.value as LeadTemperature })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm">
                      {Object.values(LeadTemperature).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 font-bold text-[11px] text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">Criar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManager;
