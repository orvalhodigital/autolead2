
import { supabase } from '../lib/supabaseClient';
import { Lead, LeadPhase, LeadTemperature, LeadPreference } from '../types';
import { Database } from '../lib/database.types';

type LeadRow = Database['public']['Tables']['leads']['Row'];

const mapRowToLead = (row: LeadRow): Lead => ({
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    phase: row.phase as LeadPhase,
    temperature: row.temperature as LeadTemperature,
    preferences: (row.preferences as unknown as LeadPreference) || {
        types: [],
        brands: [],
        models: [],
        transmission: 'Em aberto',
        engine: 'Em aberto',
        additionalNotes: ''
    },
    presentedVehicles: row.presented_vehicles || [],
    source: row.source || '',
    createdAt: row.created_at,
    lastUpdate: row.last_update || row.created_at,
    notes: row.notes || '',
    funnelHistory: (row.funnel_history as Record<string, string>) || {}
});

export const leadService = {
    async getAll(): Promise<Lead[]> {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('last_update', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToLead);
    },

    async create(lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>): Promise<Lead> {
        const { data, error } = await supabase
            .from('leads')
            .insert({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                phase: lead.phase,
                temperature: lead.temperature,
                preferences: lead.preferences as unknown as any,
                presented_vehicles: lead.presentedVehicles,
                source: lead.source,
                notes: lead.notes,
                funnel_history: lead.funnelHistory || {}
            })
            .select()
            .single();

        if (error) throw error;
        return mapRowToLead(data);
    },

    async update(lead: Lead): Promise<Lead> {
        const { data, error } = await supabase
            .from('leads')
            .update({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                phase: lead.phase,
                temperature: lead.temperature,
                preferences: lead.preferences as unknown as any,
                presented_vehicles: lead.presentedVehicles,
                source: lead.source,
                last_update: new Date().toISOString(),
                notes: lead.notes,
                funnel_history: lead.funnelHistory || {}
            })
            .eq('id', lead.id)
            .select()
            .single();

        if (error) throw error;
        return mapRowToLead(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
