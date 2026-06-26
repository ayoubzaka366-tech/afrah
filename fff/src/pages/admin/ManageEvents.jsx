import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: '', title: '', image: '', address: '', description: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const [showMedia, setShowMedia] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [mediaUploading, setMediaUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMediaTarget, setDeleteMediaTarget] = useState(null);
  const [deletingMedia, setDeletingMedia] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const fetchData = async (searchTerm = search, catId = filterCategory) => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (searchTerm) params.append('search', searchTerm);
      if (catId) params.append('category_id', catId);
      const [evRes, catRes] = await Promise.all([
        API.get(`/events?${params}`),
        API.get('/categories')
      ]);
      setEvents(evRes.data.events);
      setCategories(catRes.data);
    } catch { toast.error('Erreur de chargement') }
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
    setForm({ category_id: categories[0]?.id || '', title: '', image: '', address: '', description: '' });
    setCoverFile(null);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({ category_id: ev.category_id || '', title: ev.title, image: ev.image || '', address: ev.address, description: ev.description });
    setCoverFile(null);
    setShowForm(true);
  };

  const handleCoverUpload = async (file) => {
    if (!file) return form.image;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', 'image');
      fd.append('file', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data.fileName;
    } catch { toast.error('Erreur upload cover'); return null; }
    finally { setCoverUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageName = form.image;
      if (coverFile) {
        const uploaded = await handleCoverUpload(coverFile);
        if (uploaded) imageName = uploaded;
      }
      const payload = { ...form, image: imageName };
      if (editing) {
        await API.put(`/events/${editing.id}`, payload);
        toast.success('Événement modifié');
      } else {
        await API.post('/events', payload);
        toast.success('Événement créé');
      }
      setShowForm(false);
      setEditing(null);
      setCoverFile(null);
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await API.delete(`/events/${deleteTarget}`); toast.success('Supprimé'); fetchData(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  const openMediaPanel = async (ev) => {
    setShowMedia(ev);
    try { const res = await API.get(`/events/${ev.id}`); setMediaList(res.data.media || []); }
    catch { setMediaList([]); }
  };

  const handleMediaUpload = async () => {
    if (!mediaFile) { toast.error('Sélectionnez un fichier'); return; }
    setMediaUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', mediaType === 'video' ? 'video' : 'image');
      fd.append('file', mediaFile);
      const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await API.post('/upload/event-media', { event_id: showMedia.id, type: mediaType, file_name: upRes.data.fileName });
      toast.success('Media ajouté');
      setMediaFile(null);
      const res = await API.get(`/events/${showMedia.id}`);
      setMediaList(res.data.media || []);
    } catch { toast.error('Erreur'); }
    finally { setMediaUploading(false); }
  };

  const handleMediaDelete = async () => {
    if (!deleteMediaTarget) return;
    setDeletingMedia(true);
    try { await API.delete(`/upload/event-media/${deleteMediaTarget}`); toast.success('Supprimé'); setMediaList(prev => prev.filter(m => m.id !== deleteMediaTarget)); setDeleteMediaTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeletingMedia(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Événements</h1>
        <button onClick={openCreate} className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-display font-bold mb-4">{editing ? "Modifier l'événement" : 'Nouvel événement'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required>
                <option value="">Choisir une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Titre" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image de couverture</label>
                {form.image && !coverFile && (
                  <div className="mb-2 relative inline-block">
                    <img src={`/uploads/events/${form.image}`} alt="" className="h-24 rounded-lg object-cover" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100" />
              </div>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Adresse" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" />
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all resize-none" rows={3} />
              <div className="flex gap-3">
                <button type="submit" disabled={coverUploading} className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex-1">{coverUploading ? 'Upload...' : editing ? 'Modifier' : 'Créer'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium py-2.5 px-6 rounded-full transition-all flex-1">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMedia && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMedia(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold">Médias - {showMedia.title}</h2>
              <button onClick={() => setShowMedia(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="flex gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
              <select value={mediaType} onChange={e => setMediaType(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
              </select>
              <input type="file" accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                onChange={e => setMediaFile(e.target.files[0])}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100" />
              <button onClick={handleMediaUpload} disabled={mediaUploading}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2 rounded-full transition-all">
                {mediaUploading ? '...' : 'Ajouter'}
              </button>
            </div>
            {mediaList.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun média</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {mediaList.map(m => (
                  <div key={m.id} className="relative group rounded-xl overflow-hidden bg-gray-100">
                    {m.type === 'video' ? (
                      <video src={`/uploads/videos/${m.file_name}`} className="w-full h-28 object-cover" />
                    ) : (
                      <img src={`/uploads/events/${m.file_name}`} alt="" className="w-full h-28 object-cover" loading="lazy" />
                    )}
                    <button onClick={() => setDeleteMediaTarget(m.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input type="text" value={search} onChange={handleSearchChange}
            placeholder="Rechercher par titre, adresse, description..."
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all" />
        </div>
        <select value={filterCategory} onChange={handleCategoryFilter}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all">
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Titre</th>
              <th className="px-6 py-3 hidden md:table-cell">Catégorie</th>
              <th className="px-6 py-3 hidden md:table-cell">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Aucun événement</td></tr>
            ) : events.map(ev => (
              <tr key={ev.id} className="hover:bg-gray-50">
                <td className="px-6 py-2">
                  {ev.image ? (
                    <img src={`/uploads/events/${ev.image}`} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900 flex items-center justify-center">
                      <span className="text-xs font-display text-white/20">{ev.title[0]}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium">{ev.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{ev.category_title || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{ev.created_at?.slice(0, 10)}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openMediaPanel(ev)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Médias</button>
                  <button onClick={() => openEdit(ev)} className="text-sm text-gold-600 hover:text-gold-700 font-medium">Modifier</button>
                  <button onClick={() => setDeleteTarget(ev.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal open={!!deleteTarget} title="Supprimer l'événement"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cet événement ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <ConfirmModal open={!!deleteMediaTarget} title="Supprimer le média"
        message="Voulez-vous vraiment supprimer ce média ?"
        onConfirm={handleMediaDelete} onCancel={() => setDeleteMediaTarget(null)} loading={deletingMedia} />
    </div>
  );
}
