import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import API from '../../api/axios';
import FormModal from '../../components/FormModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = () => {
    API.get('/categories').then(res => setCategories(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', image: '' });
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat.id);
    setForm({ title: cat.title, description: cat.description || '', image: cat.image || '' });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Le titre est obligatoire');
    setUploading(true);
    try {
      let imageName = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('type', 'category');
        fd.append('file', imageFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageName = upRes.data.fileName;
      }
      const payload = { title: form.title, description: form.description, image: imageName };
      if (editing) {
        await API.put(`/categories/${editing}`, payload);
        toast.success('Catégorie modifiée');
      } else {
        await API.post('/categories', payload);
        toast.success('Catégorie créée');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', description: '', image: '' });
      setImageFile(null);
      fetch();
    } catch { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await API.delete(`/categories/${deleteTarget}`); toast.success('Supprimée'); fetch(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Catégories</h1>
        <button onClick={openCreate} className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <FormModal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all"
            placeholder="Titre (ex: Mariage, Chétinga...)" required />
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100" />
          {(form.image && !imageFile) && <p className="text-xs text-gray-400">Image actuelle: {form.image}</p>}
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all resize-none"
            rows={2} placeholder="Description" />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={uploading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium py-2.5 rounded-full transition-all">
              {uploading ? 'En cours...' : (editing ? 'Modifier' : 'Ajouter')}
            </button>
            <button type="button" onClick={() => setShowModal(false)}
              className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium py-2.5 px-6 rounded-full transition-all">Annuler</button>
          </div>
        </form>
      </FormModal>

      <ConfirmModal open={!!deleteTarget} title="Supprimer la catégorie"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cette catégorie ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" /></div>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Aucune catégorie</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden group">
              <div className="h-36 bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900 flex items-center justify-center">
                {cat.image ? (
                  <img src={`/uploads/categories/${cat.image}`} alt={cat.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-display text-white/10">{cat.title[0]}</span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display font-semibold text-gray-900">{cat.title}</h3>
                {cat.description && <p className="text-xs text-gray-400 mt-1">{cat.description}</p>}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)}
                    className="flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium bg-gold-50 hover:bg-gold-100 px-3 py-1.5 rounded-lg transition-all">
                    <Pencil size={12} /> Modifier
                  </button>
                  <button onClick={() => setDeleteTarget(cat.id)}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all">
                    <Trash2 size={12} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
