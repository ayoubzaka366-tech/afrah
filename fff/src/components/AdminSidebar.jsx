import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Folder, Calendar, Package, ClipboardList, Upload, Settings, MessageSquare, LogOut, ShoppingBag, Tags, ShoppingCart } from 'lucide-react';

const links = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/categories', label: 'Catégories', icon: Folder },
  { to: '/admin/events', label: 'Événements', icon: Calendar },
  { to: '/admin/packages', label: 'Forfaits', icon: Package },
  { to: '/admin/orders', label: 'Commandes', icon: ClipboardList },
  { to: '/admin/product-categories', label: 'Catégories produits', icon: Tags },
  { to: '/admin/products', label: 'Produits', icon: ShoppingBag },
  { to: '/admin/product-orders', label: 'Commandes produits', icon: ShoppingCart },
  { to: '/admin/upload', label: 'Médias', icon: Upload },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
  { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen hidden md:flex md:flex-col">
      <div className="p-6 border-b space-y-1">
        <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-bold text-sm">
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</h2>
          <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
        </div>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        {links.map(l => {
          const Icon = l.icon;
          return (
            <NavLink key={l.to} to={l.to} end={l.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm ${isActive ? 'bg-gold-50 text-gold-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
              }>
              <Icon size={18} />
              <span>{l.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t flex items-center gap-3">
        <button onClick={logout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
