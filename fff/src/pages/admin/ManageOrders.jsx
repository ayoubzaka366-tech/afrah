import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const fetchOrders = (searchTerm = search) => {
    const params = new URLSearchParams({ limit: '100' });
    if (searchTerm) params.append('search', searchTerm);
    API.get(`/orders?${params}`)
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => fetchOrders(val), 300));
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}`, { status });
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await API.delete(`/orders/${id}`);
      toast.success('Order deleted');
      fetchOrders();
    } catch {
      toast.error('Failed to delete order');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Gérer les commandes</h1>

      <div className="mb-4">
        <input type="text" value={search} onChange={handleSearchChange}
          placeholder="Rechercher par nom client ou téléphone..."
          className="w-full max-w-md px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm text-gray-500">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3 hidden md:table-cell">Téléphone</th>
                <th className="px-6 py-3 hidden lg:table-cell">Forfait</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Aucune commande</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customer_name}</div>
                    {order.notes && <div className="text-xs text-gray-400">{order.notes}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{order.phone}</td>
                  <td className="px-6 py-4 text-sm hidden lg:table-cell">{order.package_title || '—'}</td>
                  <td className="px-6 py-4 text-sm">{order.event_date}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status] || statusColors.pending}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    {order.status !== 'confirmed' && (
                      <button onClick={() => updateStatus(order.id, 'confirmed')}
                        className="text-xs text-green-600 hover:text-green-700 font-medium px-2">Confirmer</button>
                    )}
                    {order.status !== 'canceled' && (
                      <button onClick={() => updateStatus(order.id, 'canceled')}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2">Annuler</button>
                    )}
                    <button onClick={() => handleDelete(order.id)}
                      className="text-xs text-gray-400 hover:text-red-500 font-medium px-2">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
