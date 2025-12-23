
export enum LeadPhase {
  // Funil de Vendas (Leads Ativos)
  NEW = 'Novo Lead',
  CONTACTED = 'Em atendimento',
  SIMULATION = 'Simulação',
  VISIT = 'Marcou Visita',
  FOLLOW_UP = 'Follow-up',

  // Funil de Pós-Venda (Vendas Fechadas)
  WAITING_PAYMENT = 'Pagamento',
  DOCUMENTATION = 'Documentação',
  DELIVERY = 'Entrega',
  COMPLETED = 'Concluído',

  // Estados Finais
  LOST = 'Perdido',
  DISQUALIFIED = 'Desqualificado'
}

export enum LeadTemperature {
  HOT = 'Quente',
  WARM = 'Morna',
  COLD = 'Fria'
}

export type VehicleType = 'SUV' | 'Sedan' | 'Hatch' | 'Picape' | 'Esportivo' | 'Conversível' | 'Van' | 'Em aberto';
export type TransmissionType = 'Manual' | 'Automático' | 'Em aberto';
export type EngineType = '1.0' | '1.4' | '1.6' | '2.0+' | 'Elétrico' | 'Híbrido' | 'Em aberto';

export interface SaleDetails {
  salePrice: number;
  saleDate: string;
  buyerLeadId?: string; // ID do Lead comprador para vínculo
  buyerName: string;
  isFollowUpSale: boolean;
}

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  year: number;
  modelYear?: number;
  plate?: string;
  price: number;
  type: VehicleType;
  transmission: TransmissionType;
  engine: EngineType;
  mileage: number;
  color: string;
  isSingleOwner: boolean;
  isServiceHistoryComplete: boolean;
  isIpvaPaid: boolean;
  hasWarranty: boolean;
  optionals: string[];
  imageUrl: string;
  status: 'available' | 'sold';
  saleDetails?: SaleDetails;
}

export interface LeadPreference {
  types: VehicleType[];
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  models: string[];
  transmission: TransmissionType;
  engine: EngineType;
  additionalNotes: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  phase: LeadPhase;
  temperature: LeadTemperature;
  preferences: LeadPreference;
  presentedVehicles: string[];
  source: string;
  createdAt: string;
  lastUpdate: string;
  notes: string;
  funnelHistory: Record<string, string>;
}

export interface SaleRecord {
  id: string;
  leadId: string;
  vehicleId: string;
  salePrice: number;
  date: string;
}

export type View = 'dashboard' | 'inventory' | 'leads' | 'sales-closed';
