import React from 'react';
import {
    Search,
    Settings,
    Bell
} from 'lucide-react';
import { View } from '../types';

interface HeaderProps {
    currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
    const getTitle = () => {
        switch (currentView) {
            case 'dashboard': return 'Dashboard';
            case 'inventory': return 'Estoque';
            case 'sales-closed': return 'Vendas Fechadas';
            default: return 'Gestão de Leads';
        }
    };

    return (
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 shrink-0">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {getTitle()}
            </h2>

            <div className="flex items-center gap-4 lg:gap-8">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium w-64 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => alert("Sem novas notificações")} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all relative">
                        <Bell size={18} /><span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></span>
                    </button>
                    <button onClick={() => alert("Configurações indisponíveis")} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
