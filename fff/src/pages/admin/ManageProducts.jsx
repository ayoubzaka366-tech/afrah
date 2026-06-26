import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import FormModal from '../../components/FormModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: '', title: '', price: '', image: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async (catId = filterCategory) => {
    try {
      const params = new URLSearchParams();
      if (catId) params.append('category_id', catId);
      const [prRes, catRes] = await Promise.all([
        API.get(`/products?${params}`),
        API.get('/product-categories')
      ]);
      setProducts(prRes.data);
      setCategories(catRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCategoryFilter = (e) => {
    const val = e.target.value;
    setFilterCategory(val);
    fetchData(val);
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: categories[0]?.id || '', title: '', price: '', image: '', description: '' });
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (pr) => {
    setEditing(pr);
    setForm({ category_id: pr.category_id || '', title: pr.title, price: String(pr.price), image: pr.image || '', description: pr.description || '' });
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Titre et prix requis'); return; }
    setUploading(true);
    try {
      let imageName = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('type', 'product');
        fd.append('file', imageFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageName = upRes.data.fileName;
      }
      const payload = { ...form, price: parseFloat(form.price), image: imageName };
      if (editing) {
        await API.put(`/products/${editing.id}`, payload);
        toast.success('Produit modifié');
      } else {
        await API.post('/products', payload);
        toast.success('Produit créé');
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
    try { await API.delete(`/products/${deleteTarget}`); toast.success('Supprimé'); fetchData(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Produits</h1>
        <button onClick={openCreate} className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <FormModal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select name="category_id" value={form.category_id} onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required>
            <option value="">Choisir une catégorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Titre du produit"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required />
          <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Prix (DH)"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
            {form.image && !imageFile && (
              <div className="mb-2"><img src={`/uploads/products/${form.image}`} alt="" className="h-20 rounded-lg object-cover" /></div>
            )}
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100" />
          </div>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all resize-none" rows={3} />
          <div className="flex gap-3">
            <button type="submit" disabled={uploading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium py-2.5 rounded-full transition-all">
              {uploading ? 'En cours...' : (editing ? 'Modifier' : 'Créer')}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium py-2.5 px-6 rounded-full transition-all">Annuler</button>
          </div>
        </form>
      </FormModal>

      <ConfirmModal open={!!deleteTarget} title="Supprimer le produit"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer ce produit ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterCategory} onChange={handleCategoryFilter}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all">
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        {products.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun produit</p>
        ) : products.map(pr => (
          <div key={pr.id} className="bg-white rounded-2xl shadow-sm border border-gray-50 p-5 flex items-start justify-between">
            <div className="flex items-start gap-4">
              {pr.image ? (
                <img src={`/uploads/products/${pr.image}`} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-display text-white/20">{pr.title[0]}</span>
                </div>
              )}
              <div>
                <h3 className="font-display font-semibold text-gray-900">{pr.title}</h3>
                <p className="text-sm text-gray-500">{pr.category_title || '—'} · {Number(pr.price).toLocaleString()} DH</p>
                {pr.description && <p className="text-xs text-gray-400 mt-1 max-w-md">{pr.description}</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(pr)} className="text-sm text-gold-600 hover:text-gold-700 font-medium">Modifier</button>
              <button onClick={() => setDeleteTarget(pr.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
