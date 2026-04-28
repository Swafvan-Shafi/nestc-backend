const db = require('../../config/db');
const { client: redisClient } = require('../../config/redis');

const getHostels = async () => {
  const result = await db.query('SELECT * FROM hostels ORDER BY name ASC');
  return result.rows;
};

const getMachinesByHostel = async (hostelId) => {
  const result = await db.query(
    'SELECT * FROM vending_machines WHERE hostel_id = $1 AND is_active = true',
    [hostelId]
  );
  return result.rows;
};

const getMachineItems = async (machineId) => {
  const cacheKey = `vending:stock:${machineId}`;
  const cachedItems = await redisClient.get(cacheKey);

  if (cachedItems) {
    return JSON.parse(cachedItems);
  }

  const result = await db.query(
    'SELECT * FROM vending_items WHERE machine_id = $1 ORDER BY slot_code ASC',
    [machineId]
  );
  const items = result.rows;

  await redisClient.set(cacheKey, JSON.stringify(items), { EX: 300 }); // 5 min TTL

  return items;
};

const updateStock = async (itemId, newStock, userId, note) => {
  // Get current stock for logging
  const currentItem = await db.query('SELECT machine_id, current_stock FROM vending_items WHERE id = $1', [itemId]);
  if (currentItem.rows.length === 0) throw new Error('Item not found');

  const { machine_id, current_stock: previousStock } = currentItem.rows[0];

  // Start transaction
  await db.query('BEGIN');
  try {
    await db.query(
      'UPDATE vending_items SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, itemId]
    );

    await db.query(
      `INSERT INTO vending_stock_logs (item_id, previous_stock, new_stock, updated_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [itemId, previousStock, newStock, userId, note]
    );

    await db.query('COMMIT');

    // Invalidate cache
    await redisClient.del(`vending:stock:${machine_id}`);

    return { message: 'Stock updated successfully' };
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
};

const subscribe = async (studentId, machineId, notifyOnRefill, notifyOnLow) => {
  await db.query(
    `INSERT INTO vending_subscriptions (student_id, machine_id, notify_on_refill, notify_on_low)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id, machine_id) 
     DO UPDATE SET notify_on_refill = $3, notify_on_low = $4`,
    [studentId, machineId, notifyOnRefill, notifyOnLow]
  );
  return { message: 'Subscription updated' };
};

module.exports = {
  getHostels,
  getMachinesByHostel,
  getMachineItems,
  updateStock,
  subscribe
};
