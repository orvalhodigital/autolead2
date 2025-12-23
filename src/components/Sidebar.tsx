import React from 'react';
import {
    LayoutDashboard,
    Car,
    Users,
    CheckCircle2,
    LogOut
} from 'lucide-react';
import { View } from '../types';
import { supabase } from '../lib/supabaseClient';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Geral' },
        { id: 'inventory', icon: Car, label: 'Estoque' },
        { id: 'leads', icon: Users, label: 'Leads' },
        { id: 'sales-closed', icon: CheckCircle2, label: 'Vendas Fechadas' }
    ];

    return (
        <aside className="w-20 lg:w-64 bg-white border-r border-slate-100 flex flex-col z-50 shrink-0">
            <div className="p-6 lg:p-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                        <Car size={20} strokeWidth={2.5} />
                    </div>
                    <h1 className="hidden lg:block text-xl font-extrabold tracking-tight text-slate-900">
                        Auto<span className="text-emerald-500">Lead</span>
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id as View)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${currentView === item.id ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} className="shrink-0" />
                        <span className="hidden lg:block text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-6 mt-auto border-t border-slate-50">
                <div className="flex items-center gap-3 p-2 lg:p-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">JD</div>
                    <div className="hidden lg:block flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">João Dealer</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">Administrador</p>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="hidden lg:block text-slate-300 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
