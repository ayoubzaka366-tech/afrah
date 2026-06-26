import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManagePackages() {
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: '', title: '', price: '', image: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const fetchData = async (searchTerm = search, catId = filterCategory) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (catId) params.append('category_id', catId);
      const [pkgRes, catRes] = await Promise.all([
        API.get(`/packages?${params}`),
        API.get('/categories')
      ]);
      setPackages(pkgRes.data);
      setCategories(catRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => fetchData(val, filterCategory), 300));
  };

  const handleCategoryFilter = (e) => {
    const val = e.target.value;
    setFilterCategory(val);
    fetchData(search, val);
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: '', title: '', price: '', image: '', description: '' });
    setImageFile(null);
    setItems([]);
    setShowForm(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({ category_id: pkg.category_id || '', title: pkg.title, price: String(pkg.price), image: pkg.image, description: pkg.description || '' });
    setImageFile(null);
    setItems((pkg.items || []).map(i => ({ item: i.item, type: i.type })));
    setShowForm(true);
  };

  const addItem = () => setItems(prev => [...prev, { item: '', type: 'gratuite' }]);

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Titre et prix requis'); return; }
    setUploading(true);
    try {
      let imageName = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('type', 'package');
        fd.append('file', imageFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageName = upRes.data.fileName;
      }
      const payload = { ...form, price: parseFloat(form.price), image: imageName, items: items.filter(i => i.item.trim()) };
      if (editing) {
        await API.put(`/packages/${editing.id}`, payload);
        toast.success('Forfait modifié');
      } else {
        await API.post('/packages', payload);
        toast.success('Forfait créé');
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await API.delete(`/packages/${deleteTarget}`); toast.success('Supprimé'); fetchData(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Forfaits</h1>
        <button onClick={openCreate} className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-display font-bold mb-4">{editing ? 'Modifier le forfait' : 'Nouveau forfait'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all">
                <option value="">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Titre" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required />
              <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Prix (DH)" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required />
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100" />
              {(form.image && !imageFile) && <p className="text-xs text-gray-400">{form.image}</p>}
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all resize-none" rows={2} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items du forfait</label>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={it.item} onChange={e => updateItem(i, 'item', e.target.value)}
                        placeholder="Nom de l'item"
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" />
                      <select value={it.type} onChange={e => updateItem(i, 'type', e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all">
                        <option value="gratuite">Gratuit</option>
                        <option value="pay">Payant</option>
                      </select>
                      <button type="button" onClick={() => removeItem(i)}
                        className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">&times;</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem}
                  className="mt-2 text-sm text-gold-600 hover:text-gold-700 font-medium transition-all">
                  + Ajouter un item
                </button>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={uploading} className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex-1">
                  {uploading ? 'En cours...' : (editing ? 'Modifier' : 'Créer')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium py-2.5 px-6 rounded-full transition-all flex-1">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input type="text" value={search} onChange={handleSearchChange}
            placeholder="Rechercher par titre, description..."
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" />
        </div>
        <select value={filterCategory} onChange={handleCategoryFilter}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all">
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        {packages.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun forfait</p>
        ) : packages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-gray-50 p-5 flex items-start justify-between">
            <div className="flex items-start gap-4">
              {pkg.image && (
                <img src={`/uploads/packages/${pkg.image}`} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div>
                <h3 className="font-display font-semibold text-gray-900">{pkg.title}</h3>
                <p className="text-sm text-gray-500">{pkg.category_title || 'Toutes catégories'} · {Number(pkg.price).toLocaleString()} DH</p>
                {(pkg.items || []).length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{pkg.items.length} item(s)</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(pkg)} className="text-sm text-gold-600 hover:text-gold-700 font-medium">Modifier</button>
              <button onClick={() => setDeleteTarget(pkg.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal open={!!deleteTarget} title="Supprimer le forfait"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer ce forfait ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
