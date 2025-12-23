
import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, MapPin, Gauge, Calendar,
  DollarSign, Hash, Edit3, Trash2, ChevronLeft, ChevronRight, Upload, Loader2, X,
  Check, UserCheck, Users, Tag, Car, Zap
} from 'lucide-react';
import { Vehicle, VehicleType, TransmissionType, EngineType, Lead, LeadPhase, SaleDetails } from '../types';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';

interface InventoryProps {
  vehicles: Vehicle[];
  onAddVehicle: (v: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onSellVehicle: (id: string, details: SaleDetails) => void;
  leads: Lead[];
}

const VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van'];
const TRANSMISSION_TYPES: TransmissionType[] = ['Manual', 'Automático'];
const ENGINE_TYPES: EngineType[] = ['1.0', '1.4', '1.6', '2.0+', 'Elétrico', 'Híbrido'];

const Inventory: React.FC<InventoryProps> = ({
  vehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onSellVehicle, leads
}) => {
  /* 
    State Logic:
    selectedVehicle can be:
    - null: List View
    - Vehicle object: Detail View
    - 'new': Create View
  */
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | 'new' | null>(null);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form is now shown differenty, removing isFormOpen state
  // const [isFormOpen, setIsFormOpen] = useState(false);


  // Estado para alternar entre estoque disponível e vendidos
  const [inventoryView, setInventoryView] = useState<'available' | 'sold'>('available');

  // Vehicle Form State
  // Vehicle Form State
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'status'>>({
    brand: '', model: '', year: new Date().getFullYear(), modelYear: new Date().getFullYear(), plate: '', price: 0, type: 'Sedan',
    transmission: 'Automático', engine: '1.6', mileage: 0, color: '',
    isSingleOwner: false, isServiceHistoryComplete: false, isIpvaPaid: true, hasWarranty: false,
    optionals: [], imageUrl: ''
  });

  // Sell Form State
  const [sellData, setSellData] = useState<SaleDetails>({
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    buyerLeadId: '',
    isFollowUpSale: true
  });

  // Filtra os veículos baseado na aba selecionada
  const displayedVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === inventoryView);
  }, [vehicles, inventoryView]);

  const matchingLeads = useMemo(() => {
    if (!selectedVehicle || selectedVehicle === 'new') return [];
    const v = selectedVehicle as Vehicle;
    return leads.filter(l =>
      // Mostra leads que NÃO estão perdidos nem concluídos (já compraram)
      l.phase !== LeadPhase.LOST && l.phase !== LeadPhase.COMPLETED &&
      (l.preferences.types.includes(v.type) ||
        l.preferences.brands.some(b => v.brand.toLowerCase().includes(b.toLowerCase()))) &&
      (!l.preferences.maxPrice || v.price <= l.preferences.maxPrice)
    );
  }, [selectedVehicle, leads]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle && selectedVehicle !== 'new') {
      onUpdateVehicle({ ...(selectedVehicle as Vehicle), ...formData });
      setSelectedVehicle({ ...(selectedVehicle as Vehicle), ...formData });
    } else {
      onAddVehicle({ ...formData, status: 'available', imageUrl: '' });
      setSelectedVehicle(null); // Return to list after create
    }
    // setIsFormOpen(false); // No longer needed
    resetForm();
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle && selectedVehicle !== 'new') {
      // Encontra o Lead correspondente ao nome selecionado (se houver)
      const selectedLead = leads.find(l => l.name === sellData.buyerName);

      onSellVehicle(selectedVehicle.id, {
        ...sellData,
        buyerLeadId: selectedLead?.id || undefined
      });

      setIsSellModalOpen(false);
      setSelectedVehicle(null);
      // Opcional: mudar a view para 'sold' para ver o carro vendido
      // setInventoryView('sold'); 
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '', model: '', year: new Date().getFullYear(), modelYear: new Date().getFullYear(), plate: '', price: 0, type: 'Sedan',
      transmission: 'Automático', engine: '1.6', mileage: 0, color: '',
      isSingleOwner: false, isServiceHistoryComplete: false, isIpvaPaid: true, hasWarranty: false,
      optionals: [], imageUrl: ''
    });
  };

  const handleEdit = (v: Vehicle) => {
    setFormData({
      brand: v.brand, model: v.model, year: v.year, modelYear: v.modelYear || v.year, plate: v.plate || '', price: v.price, type: v.type,
      transmission: v.transmission, engine: v.engine, mileage: v.mileage, color: v.color,
      isSingleOwner: v.isSingleOwner, isServiceHistoryComplete: v.isServiceHistoryComplete,
      isIpvaPaid: v.isIpvaPaid, hasWarranty: v.hasWarranty,
      optionals: v.optionals, imageUrl: v.imageUrl
    });
    // Set view to 'new' but populate data (effectively edit mode, though we might need to distinguish if we want "Create" vs "Update" text)
    // Actually, let's keep selectedVehicle as the vehicle for edit, but we need a way to show the form.
    // Let's use a separate state or just re-use the form view for "Editing".
    // For simplicity, let's say if selectedVehicle is set AND we are in "edit mode" -> show form.
    // BUT user asked for "New Vehicle" to be a screen.
    // Let's make "Create" a distinct state 'new'.
    // Editing can still be a modal OR a screen. Given consistency, screen is better.
    // Let's allow selectedVehicle to be the vehicle, and we need a flag isEditing.
    // OR we change selectedVehicle to be `Vehicle | 'new' | 'editing'`. 
    // Complexity grows.

    // Simplest approach: reuse the "new" screen for editing?
    // Let's refactor: 
    // If selectedVehicle === 'new' -> Show Create Form
    // If selectedVehicle is Object -> Show Details
    // If we want to edit -> We need an edit state. 
    // Let's add `isEditing` state.
    setIsEditing(true);
    // Reuse the same form view.
  };


  const handleOpenSellModal = () => {
    if (selectedVehicle) {
      setSellData({
        salePrice: selectedVehicle.price,
        saleDate: new Date().toISOString().split('T')[0],
        buyerName: '',
        buyerLeadId: '',
        isFollowUpSale: true
      });
      setIsSellModalOpen(true);
    }
  }

  const handleDelete = (id: string) => {
    onDeleteVehicle(id);
    setSelectedVehicle(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      setUploading(true);

      // Resize image to 500x300 covers
      const resizedBlob = await resizeImage(file, 500, 300);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, resizedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (error) {
      alert('Erro ao fazer upload da imagem.' + (error as any).message);
    } finally {
      setUploading(false);
    }
  };

  // New Screen for Create/Edit
  const [isEditing, setIsEditing] = useState(false);

  // If creating new OR editing existing
  if (selectedVehicle === 'new' || isEditing) {
    return (
      <div className="animate-fadeUp max-w-4xl mx-auto w-full pb-20">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { setSelectedVehicle(null); setIsEditing(false); resetForm(); }} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="font-extrabold text-xs uppercase tracking-widest">Voltar para Estoque</span>
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {isEditing ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
                </h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Preencha as informações do veículo abaixo</p>
              </div>
            </div>
            <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto hide-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marca</label>
                  <input required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelo</label>
                  <input required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Placa</label>
                  <input value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })} placeholder="ABC-1234" maxLength={8} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motor</label>
                  <input value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value as EngineType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ano Fab.</label>
                  <input type="number" required value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ano Mod.</label>
                  <input type="number" required value={formData.modelYear || formData.year} onChange={e => setFormData({ ...formData, modelYear: parseInt(e.target.value) })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-sm">R$</span>
                    <input
                      type="text"
                      required
                      value={formData.price ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, price: val ? parseInt(val) / 100 : 0 })
                      }}
                      className="w-full p-4 pl-12 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl outline-none font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as VehicleType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Câmbio</label>
                  <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value as TransmissionType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm">
                    {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Imagem do Veículo</label>
                <div className="flex items-center gap-4">
                  {formData.imageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shrink-0 relative group">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <label className="flex-1 cursor-pointer">
                    <div className={`w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 transition-colors ${uploading ? 'bg-slate-50 opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-emerald-200'}`}>
                      {uploading ? (
                        <><Loader2 size={20} className="animate-spin text-emerald-500" /> <span className="text-xs font-bold text-slate-400 uppercase">Processando...</span></>
                      ) : (
                        <><Upload size={20} className="text-slate-300" /> <span className="text-xs font-bold text-slate-400 uppercase">Clique para enviar imagem</span></>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opcionais (Separar por vírgula, barra ou hífen)</label>
                <input
                  placeholder="Ex: Teto Solar, Couro / Multimídia | Rodas"
                  value={formData.optionals.join(', ')}
                  onChange={e => setFormData({ ...formData, optionals: e.target.value.split(/[,/\\-|]/).map(s => s.trim()).filter(s => s) })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.optionals.map((opt, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button type="button" onClick={() => { setSelectedVehicle(null); setIsEditing(false); resetForm(); }} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
              <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                {isEditing ? 'Salvar Alterações' : 'Criar Veículo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (selectedVehicle && selectedVehicle !== 'new' && !isEditing) {
    return (
      <div className="animate-fadeUp max-w-6xl mx-auto w-full pb-20">
        {/* Detail View Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setSelectedVehicle(null)} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="font-extrabold text-xs uppercase tracking-widest">Voltar para Estoque</span>
          </button>

          <div className="flex gap-3">
            {selectedVehicle.status === 'available' && (
              <button
                onClick={handleOpenSellModal}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
              >
                <DollarSign size={16} /> Registrar Venda
              </button>
            )}
            <button onClick={() => handleEdit(selectedVehicle)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all">
              <Edit3 size={16} /> Editar
            </button>
            <button onClick={() => handleDelete(selectedVehicle.id)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className={`bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden ${selectedVehicle.status === 'sold' ? 'opacity-90' : ''}`}>
              {selectedVehicle.imageUrl ? (
                <div className="w-full h-96 mb-8 rounded-[2rem] overflow-hidden">
                  <img src={selectedVehicle.imageUrl} alt={selectedVehicle.model} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Car size={300} />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100/50">
                      {selectedVehicle.type}
                    </span>
                    {selectedVehicle.isSingleOwner && (
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200/50">
                        Único Dono
                      </span>
                    )}
                  </div>
                  {selectedVehicle.status === 'sold' && (
                    <span className="text-xs font-black text-white bg-red-500 px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg shadow-red-500/20">
                      Vendido
                    </span>
                  )}
                </div>

                <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase mb-4">
                  {selectedVehicle.brand} <br /> {selectedVehicle.model}
                </h1>

                <p className="text-4xl font-black text-emerald-500 tracking-tighter">
                  R$ {selectedVehicle.price.toLocaleString()
                  }</p>

                <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-slate-50">
                  {[
                    { label: 'Quilometragem', value: `${selectedVehicle.mileage.toLocaleString()} km`, icon: Gauge },
                    { label: 'Ano Modelo', value: `${selectedVehicle.year}${selectedVehicle.modelYear && selectedVehicle.modelYear !== selectedVehicle.year ? ' / ' + selectedVehicle.modelYear : ''}`, icon: Calendar },
                    { label: 'Transmissão', value: selectedVehicle.transmission, icon: Car },
                    { label: 'Motorização', value: selectedVehicle.engine, icon: Zap },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Opcionais movidos para dentro do card principal com borda tracejada */}
                <div className="mt-10 pt-8 border-t border-slate-50">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Tag size={14} /> Opcionais & Detalhes
                  </h3>
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="flex flex-wrap gap-3">
                      {selectedVehicle.optionals && selectedVehicle.optionals.length > 0 ? (
                        selectedVehicle.optionals.flatMap(opt => opt.split('|')).map(s => s.trim()).filter(s => s).map((opt, i) => (
                          <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wide shadow-sm">
                            {opt}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm font-medium italic">Nenhum opcional cadastrado.</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {selectedVehicle.status === 'sold' && selectedVehicle.saleDetails && (
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-extrabold tracking-tight mb-6 flex items-center gap-3">
                    <Check size={24} className="text-emerald-400" /> Detalhes da Venda
                  </h3>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Valor da Venda</p>
                      <p className="text-3xl font-black text-emerald-400">R$ {selectedVehicle.saleDetails.salePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Data</p>
                      <p className="text-xl font-bold">{new Date(selectedVehicle.saleDetails.saleDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Comprador</p>
                      <p className="text-xl font-bold">{selectedVehicle.saleDetails.buyerName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matches Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <UserCheck size={24} className="text-emerald-500" />
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Leads Compatíveis</h3>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Encontramos <strong className="text-slate-900">{matchingLeads.length} leads</strong> que buscam um veículo com estas características.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {matchingLeads.map(lead => (
                <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 uppercase leading-none">{lead.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Orçamento: R$ {lead.preferences.maxPrice?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => alert("Detalhes do lead em breve")} className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    Ver Detalhes
                  </button>
                </div>
              ))}

              {matchingLeads.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <Users size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum lead compatível</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sell Vehicle Modal */}
        {isSellModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[90] flex items-center justify-center p-6" onClick={() => setIsSellModalOpen(false)}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSellSubmit}>
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Registrar Venda</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                  </div>
                  <button type="button" onClick={() => setIsSellModalOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
                </div>
                <div className="p-10 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Final de Venda</label>
                    <input type="number" required value={sellData.salePrice} onChange={e => setSellData({ ...sellData, salePrice: parseFloat(e.target.value) })} className="w-full p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg" />
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data da Venda</label>
                      <input type="date" required value={sellData.saleDate} onChange={e => setSellData({ ...sellData, saleDate: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprador (Selecione o Lead)</label>
                    <select
                      value={sellData.buyerName}
                      onChange={e => setSellData({ ...sellData, buyerName: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm"
                    >
                      <option value="">Selecione um comprador...</option>
                      <option value="Venda Avulsa">-- Venda Avulsa (Sem Lead) --</option>
                      {leads.map(lead => <option key={lead.id} value={lead.name}>{lead.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button type="button" onClick={() => setIsSellModalOpen(false)} className="flex-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">Confirmar Venda</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Existing Create/Edit Vehicle Modal */}

      </div>
    );
  }

  // List View
  return (
    <div className="animate-fadeUp max-w-6xl mx-auto w-full pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Inventory Status Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setInventoryView('available')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${inventoryView === 'available' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Em Estoque
            </button>
            <button
              onClick={() => setInventoryView('sold')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${inventoryView === 'sold' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Vendidos
            </button>
          </div>

          <button onClick={() => alert("Filtros de estoque em breve")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={14} className="text-slate-400" /> Filtrar
          </button>
        </div>
        <button onClick={() => { setSelectedVehicle('new'); resetForm(); }} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-extrabold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all uppercase tracking-wider text-xs">
          <Plus size={16} /> Novo Veículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedVehicles.map(vehicle => (
          <div key={vehicle.id} onClick={() => setSelectedVehicle(vehicle)} className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col relative overflow-hidden ${vehicle.status === 'sold' ? 'opacity-90 grayscale-[0.5] hover:grayscale-0' : 'hover:shadow-emerald-500/5 hover:border-emerald-200'}`}>
            {vehicle.imageUrl && (
              <div className="w-full aspect-[5/3] rounded-2xl mb-4 overflow-hidden">
                <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
            )}

            {vehicle.status === 'sold' && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg z-10 shadow-lg shadow-red-500/20">Vendido</div>
            )}

            <div className={`flex items-start ${vehicle.imageUrl ? 'justify-end' : 'justify-between'} mb-6`}>
              {!vehicle.imageUrl && (
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Car size={28} />
                </div>
              )}
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{vehicle.type}</span>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{vehicle.brand} {vehicle.model}</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>{vehicle.year} {vehicle.modelYear ? `/ ${vehicle.modelYear}`.substring(2) : ''}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{vehicle.mileage.toLocaleString()} km</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
              <p className={`text-lg font-black ${vehicle.status === 'sold' ? 'text-slate-400 line-through' : 'text-emerald-500'}`}>R$ {vehicle.price.toLocaleString()}</p>
              {vehicle.status === 'sold' && vehicle.saleDetails && (
                <p className="text-sm font-bold text-emerald-600 absolute bottom-6 right-16 bg-emerald-50 px-2 py-1 rounded">R$ {vehicle.saleDetails.salePrice.toLocaleString()}</p>
              )}
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:translate-x-1 transition-transform">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        ))}
        {displayedVehicles.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <Car size={40} />
            </div>
            <h3 className="text-slate-900 font-bold">Nenhum veículo encontrado</h3>
            <p className="text-slate-400 text-sm">
              {inventoryView === 'available' ? 'Adicione novos veículos ao estoque.' : 'Nenhuma venda registrada ainda.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
