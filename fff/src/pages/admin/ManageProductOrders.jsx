import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, Check, X, Clock, Trash2 } from 'lucide-react';
import API from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
};

export default function ManageProductOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async (searchTerm = search) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const res = await API.get(`/product-orders?${params}`);
      setOrders(res.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id, status) => {
    try { await API.put(`/product-orders/${id}`, { status }); toast.success('Statut mis à jour'); fetchData(); }
    catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await API.delete(`/product-orders/${deleteTarget}`); toast.success('Supprimée'); fetchData(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Commandes de produits</h1>

      <ConfirmModal open={!!deleteTarget} title="Supprimer la commande"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cette commande ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); fetchData(e.target.value); }}
            placeholder="Rechercher par nom, téléphone..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" /></div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Aucune commande</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm text-gray-500">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Produit</th>
                <th className="px-6 py-3 hidden md:table-cell">Date</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm">{o.customer_name}</p>
                    <p className="text-xs text-gray-400">{o.phone}</p>
                    {o.address && <p className="text-xs text-gray-300 mt-0.5">{o.address}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm">{o.product_title || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{o.created_at?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[o.status] || statusStyles.pending}`}>
                      {o.status === 'pending' && <Clock size={12} />}
                      {o.status === 'confirmed' && <Check size={12} />}
                      {o.status === 'canceled' && <X size={12} />}
                      {o.status === 'pending' ? 'En attente' : o.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {o.status !== 'confirmed' && (
                        <button onClick={() => updateStatus(o.id, 'confirmed')}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-lg transition-all">Confirmer</button>
                      )}
                      {o.status !== 'canceled' && (
                        <button onClick={() => updateStatus(o.id, 'canceled')}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg transition-all">Annuler</button>
                      )}
                      <button onClick={() => setDeleteTarget(o.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
