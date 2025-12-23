
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            vehicles: {
                Row: {
                    id: string
                    created_at: string | null
                    brand: string
                    model: string
                    year: number
                    model_year: number | null
                    plate: string | null
                    price: number
                    type: string
                    transmission: string
                    engine: string
                    mileage: number
                    color: string
                    is_single_owner: boolean | null
                    is_service_history_complete: boolean | null
                    is_ipva_paid: boolean | null
                    has_warranty: boolean | null
                    optionals: string[] | null
                    image_url: string | null
                    status: string | null
                    sale_details: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string | null
                    brand: string
                    model: string
                    year: number
                    model_year?: number | null
                    plate?: string | null
                    price: number
                    type: string
                    transmission: string
                    engine: string
                    mileage: number
                    color: string
                    is_single_owner?: boolean | null
                    is_service_history_complete?: boolean | null
                    is_ipva_paid?: boolean | null
                    has_warranty?: boolean | null
                    optionals?: string[] | null
                    image_url?: string | null
                    status?: string | null
                    sale_details?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string | null
                    brand?: string
                    model?: string
                    year?: number
                    model_year?: number | null
                    plate?: string | null
                    price?: number
                    type?: string
                    transmission?: string
                    engine?: string
                    mileage?: number
                    color?: string
                    is_single_owner?: boolean | null
                    is_service_history_complete?: boolean | null
                    is_ipva_paid?: boolean | null
                    has_warranty?: boolean | null
                    optionals?: string[] | null
                    image_url?: string | null
                    status?: string | null
                    sale_details?: Json | null
                }
            },
            leads: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    phone: string | null
                    email: string | null
                    phase: string
                    temperature: string
                    preferences: Json | null
                    presented_vehicles: string[] | null
                    source: string | null
                    last_update: string | null
                    notes: string | null
                    funnel_history: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    phase: string
                    temperature: string
                    preferences?: Json | null
                    presented_vehicles?: string[] | null
                    source?: string | null
                    last_update?: string | null
                    notes?: string | null
                    funnel_history?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    phase?: string
                    temperature?: string
                    preferences?: Json | null
                    presented_vehicles?: string[] | null
                    source?: string | null
                    last_update?: string | null
                    notes?: string | null
                    funnel_history?: Json | null
                }
            }
        }
    }
}
