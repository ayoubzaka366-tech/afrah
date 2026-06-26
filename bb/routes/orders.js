const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

router.post('/', (req, res) => {
  const { customer_name, phone, address, event_date, package_id, notes } = req.body;
  if (!customer_name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  db.run('INSERT INTO orders (customer_name, phone, address, event_date, package_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [customer_name, phone, address || '', event_date || '', package_id || null, notes || ''],
    async function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });

      const orderId = this.lastID;

      db.get(`SELECT o.*, p.title as package_title FROM orders o LEFT JOIN packages p ON o.package_id = p.id WHERE o.id = ?`, [orderId], async (err, order) => {
        if (!err && order) {
          const clientMsg = `✅ *Confirmation de réservation #${order.id}*

Bonjour ${order.customer_name} 👋

Votre réservation a bien été reçue ! Voici un récapitulatif :

📅 *Date :* ${order.event_date || 'Non spécifiée'}
📦 *Forfait :* ${order.package_title || 'Non spécifié'}

Notre équipe vous contactera très bientôt pour confirmer tous les détails.

Merci de nous avoir choisis ! ✨
*Afrah - Mariage & Événements*`;

          const adminMsg = `🆕 *Nouvelle commande #${order.id}*

👤 *Client :* ${order.customer_name}
📞 *Téléphone :* ${order.phone}
📍 *Adresse :* ${order.address || 'Non renseignée'}
📅 *Date :* ${order.event_date || 'Non spécifiée'}
📦 *Forfait :* ${order.package_title || 'Non spécifié'}
📝 *Notes :* ${order.notes || 'Aucune'}
🕐 *Date commande :* ${order.created_at?.slice(0, 16) || ''}

🔗 Voir dans l'admin : https://afrah-production.up.railway.app/admin/orders`;

          const sent = await whatsapp.sendMessage(order.phone, clientMsg);
          if (!sent) {
            db.get('SELECT admin_whatsapp FROM settings WHERE id = 1', (_, row) => {
              const adminPhone = row?.admin_whatsapp || '0679990934';
              whatsapp.sendMessage(adminPhone, adminMsg);
            });
          }
        }
      });

      res.status(201).json({ id: orderId, message: 'Order placed successfully' });
    }
  );
});

router.get('/', verifyToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search;

  let where = '';
  const params = [];
  const countParams = [];

  if (search) {
    where = ' WHERE (o.customer_name LIKE ? OR o.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
    countParams.push(s, s);
  }

  db.all(`
    SELECT o.*, p.title as package_title
    FROM orders o 
    LEFT JOIN packages p ON o.package_id = p.id 
    ${where}
    ORDER BY o.created_at DESC 
    LIMIT ? OFFSET ?
  `, [...params, limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    db.get(`SELECT COUNT(*) as total FROM orders o${where}`, countParams, (_, count) => {
      res.json({ orders: rows, total: count ? count.total : 0, page, limit });
    });
  });
});

router.put('/:id', verifyToken, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'canceled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order updated successfully' });
  });
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  });
});

module.exports = router;
