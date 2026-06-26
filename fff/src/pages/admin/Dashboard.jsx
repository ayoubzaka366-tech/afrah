import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Dashboard() {
  const [stats, setStats] = useState({ events: 0, packages: 0, orders: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/events?limit=1'),
      API.get('/packages'),
      API.get('/orders?limit=1'),
      API.get('/contacts'),
    ]).then(([ev, pkg, ord, con]) => {
      setStats({
        events: ev.data.total || 0,
        packages: pkg.data.length || 0,
        orders: ord.data.total || 0,
        contacts: con.data.length || 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const cards = [
    { label: 'Événements', value: stats.events, color: 'bg-rose-50 text-rose-600', to: '/admin/events' },
    { label: 'Forfaits', value: stats.packages, color: 'bg-gold-50 text-gold-600', to: '/admin/packages' },
    { label: 'Commandes', value: stats.orders, color: 'bg-blue-50 text-blue-600', to: '/admin/orders' },
    { label: 'Messages', value: stats.contacts, color: 'bg-green-50 text-green-600', to: '/admin/orders' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-8">Tableau de bord</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${c.color} text-xl font-bold mb-3`}>
              {c.value}
            </div>
            <p className="text-gray-600 text-sm">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <Link to="/admin/events" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-gray-900">Gérer les événements</h3>
          <p className="text-sm text-gray-500 mt-1">Ajouter, modifier ou supprimer des événements</p>
        </Link>
        <Link to="/admin/packages" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-gray-900">Gérer les forfaits</h3>
          <p className="text-sm text-gray-500 mt-1">Ajouter, modifier ou supprimer des forfaits</p>
        </Link>
        <Link to="/admin/orders" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-gray-900">Voir les commandes</h3>
          <p className="text-sm text-gray-500 mt-1">Gérer les réservations clients</p>
        </Link>
        <Link to="/admin/upload" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-gray-900">Uploader des médias</h3>
          <p className="text-sm text-gray-500 mt-1">Ajouter des images et vidéos</p>
        </Link>
      </div>
    </div>
  );
}
