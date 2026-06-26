const express = require('express');
const path = require('path');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  const { search } = req.query;
  let sql = `SELECT po.*, p.title as product_title, p.price as product_price FROM product_orders po LEFT JOIN products p ON po.product_id = p.id`;
  const params = [];

  if (search) {
    sql += ' WHERE po.customer_name LIKE ? OR po.phone LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY po.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { customer_name, phone, address, product_id, notes } = req.body;
  if (!customer_name || !phone) return res.status(400).json({ message: 'Customer name and phone are required' });
  if (!product_id) return res.status(400).json({ message: 'Product ID is required' });

  const stmt = db.prepare('INSERT INTO product_orders (customer_name, phone, address, product_id, notes) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(customer_name, phone, address || '', product_id, notes || '');
  const orderId = info.lastInsertRowid;

  res.status(201).json({ id: orderId, message: 'Order created' });

  db.get('SELECT title, image, price FROM products WHERE id = ?', [product_id], (err, product) => {
    const productTitle = product?.title || 'Produit';
    const productImage = product?.image || '';
    const productPrice = product?.price || 0;

    db.get('SELECT admin_whatsapp FROM settings WHERE id = 1', (err2, row) => {
      const adminPhone = (row && row.admin_whatsapp) || '';

      const customerMsg = `━━━━━━━━━━━━━━━━━━━━━━\n✨ *AFRAH - Confirmation* ✨\n━━━━━━━━━━━━━━━━━━━━━━\n\nBonjour ${customer_name} 👋\n\nNous avons le plaisir de vous confirmer votre commande pour :\n\n🛍️ *${productTitle}*\n💰 *${productPrice} DH*\n\n━━━━━━━━━━━━━━━━━━━━━━\nMerci de nous répondre par un simple chiffre :\n━━━━━━━━━━━━━━━━━━━━━━\n\n1️⃣ *Je confirme* ma commande\n2️⃣ *Je souhaite* un devis\n3️⃣ *J'ai* des questions\n\n━━━━━━━━━━━━━━━━━━━━━━\n*Afrah - Mariage & Événements* ✨\n━━━━━━━━━━━━━━━━━━━━━━`;
      const adminMsg = `━━━━━━━━━━━━━━━━━━━━━━\n🛍️ *NOUVELLE COMMANDE* 🛍️\n━━━━━━━━━━━━━━━━━━━━━━\n\n*N°${orderId}*\n\n👤 *Client :* ${customer_name}\n📞 *Téléphone :* ${phone}\n🛍️ *Produit :* ${productTitle}\n💰 *Prix :* ${productPrice} DH${address ? `\n📍 *Adresse :* ${address}` : ''}\n\n━━━━━━━━━━━━━━━━━━━━━━\n🔗 https://afrah-production.up.railway.app/admin/product-orders\n━━━━━━━━━━━━━━━━━━━━━━`;

      const imagePath = productImage ? path.join(__dirname, '..', 'uploads', 'products', productImage) : null;
      const hasImage = productImage && require('fs').existsSync(imagePath);

      const sendTo = (number, msg, img) => {
        if (img) return whatsapp.sendMedia(number, img, msg);
        return whatsapp.sendMessage(number, msg);
      };

      sendTo(phone, customerMsg, hasImage ? imagePath : null).then(sent => {
        if (adminPhone) sendTo(adminPhone, adminMsg, hasImage ? imagePath : null);
        if (!sent && adminPhone) console.log(`Order #${orderId}: Client unreachable on WhatsApp, notified admin`);
      });
    });
  });
});

router.put('/:id', verifyToken, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'canceled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  db.run('UPDATE product_orders SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Order updated' });
  });
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM product_orders WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Order deleted' });
  });
});

module.exports = router;
