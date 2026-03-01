import db from '../models/index.js';
const { ContactMessage, Review, User } = db;

// ─── Contact ──────────────────────────────────────────────────────────────────

/** POST /api/contact  (public) */
export const sendContactMessage = async (req, res) => {
  const { name, email, organization, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
    await ContactMessage.create({ name: name.trim(), email: email.trim(), organization: organization?.trim() || null, message: message.trim(), ip_address: ip });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

/** GET /api/reviews  (public) */
export const getReviews = async (req, res) => {
  try {
    const rows = await Review.findAll({
      order: [['created_at', 'DESC']],
      limit: 50,
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] }]
    });
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/** POST /api/reviews  (authenticated) */
export const createReview = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { rating, message } = req.body;
  const r = Number(rating);
  if (!r || r < 1 || r > 5 || !message?.trim()) {
    return res.status(400).json({ error: 'rating (1–5) and message are required' });
  }
  try {
    // One review per user — upsert
    const [review, created] = await Review.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, rating: r, message: message.trim() }
    });
    if (!created) {
      await review.update({ rating: r, message: message.trim() });
    }
    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] }]
    });
    return res.status(created ? 201 : 200).json(full);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/** DELETE /api/reviews/me  (authenticated — delete own review) */
export const deleteMyReview = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const deleted = await Review.destroy({ where: { user_id: userId } });
    if (!deleted) return res.status(404).json({ error: 'No review found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
