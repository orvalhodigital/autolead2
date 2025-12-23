
import { supabase } from '../lib/supabaseClient';
import { Vehicle, SaleDetails, VehicleType, TransmissionType, EngineType } from '../types';
import { Database } from '../lib/database.types';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];

// Mapper to convert DB Row to App Entity
const mapRowToVehicle = (row: VehicleRow): Vehicle => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    modelYear: row.model_year || row.year,
    plate: row.plate || '',
    price: row.price,
    type: row.type as VehicleType,
    transmission: row.transmission as TransmissionType,
    engine: row.engine as EngineType,
    mileage: row.mileage,
    color: row.color,
    isSingleOwner: row.is_single_owner,
    isServiceHistoryComplete: row.is_service_history_complete,
    isIpvaPaid: row.is_ipva_paid,
    hasWarranty: row.has_warranty,
    optionals: row.optionals || [],
    imageUrl: row.image_url || '',
    status: (row.status as 'available' | 'sold') || 'available',
    saleDetails: row.sale_details ? (row.sale_details as unknown as SaleDetails) : undefined
});

export const vehicleService = {
    async getAll(): Promise<Vehicle[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToVehicle);
    },

    async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
        const { data, error } = await supabase
            .from('vehicles')
            .insert({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                model_year: vehicle.modelYear,
                plate: vehicle.plate,
                price: vehicle.price,
                type: vehicle.type,
                transmission: vehicle.transmission,
                engine: vehicle.engine,
                mileage: vehicle.mileage,
                color: vehicle.color,
                is_single_owner: vehicle.isSingleOwner,
                is_service_history_complete: vehicle.isServiceHistoryComplete,
                is_ipva_paid: vehicle.isIpvaPaid,
                has_warranty: vehicle.hasWarranty,
                optionals: vehicle.optionals,
                image_url: vehicle.imageUrl,
                status: vehicle.status,
                sale_details: vehicle.saleDetails ? (vehicle.saleDetails as unknown as any) : null
            })
            .select()
            .single();

        if (error) throw error;
        return mapRowToVehicle(data);
    },

    async update(vehicle: Vehicle): Promise<Vehicle> {
        const { data, error } = await supabase
            .from('vehicles')
            .update({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                model_year: vehicle.modelYear,
                plate: vehicle.plate,
                price: vehicle.price,
                type: vehicle.type,
                transmission: vehicle.transmission,
                engine: vehicle.engine,
                mileage: vehicle.mileage,
                color: vehicle.color,
                is_single_owner: vehicle.isSingleOwner,
                is_service_history_complete: vehicle.isServiceHistoryComplete,
                is_ipva_paid: vehicle.isIpvaPaid,
                has_warranty: vehicle.hasWarranty,
                optionals: vehicle.optionals,
                image_url: vehicle.imageUrl,
                status: vehicle.status,
                sale_details: vehicle.saleDetails ? (vehicle.saleDetails as unknown as any) : null
            })
            .eq('id', vehicle.id)
            .select()
            .single();

        if (error) throw error;
        return mapRowToVehicle(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async sell(id: string, saleDetails: SaleDetails): Promise<void> {
        const { error } = await supabase
            .from('vehicles')
            .update({
                status: 'sold',
                sale_details: saleDetails as unknown as any
            })
            .eq('id', id);

        if (error) throw error;
    }
};
