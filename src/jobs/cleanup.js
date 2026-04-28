const cron = require("node-cron");
const db = require("../config/db");

cron.schedule("0 0 1 * *", async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  try {
    await db.query(`DELETE FROM bookings WHERE status IN ('completed','cancelled') AND completed_at < $1`, [oneMonthAgo]);
    await db.query(`DELETE FROM booking_driver_pings WHERE booking_id NOT IN (SELECT id FROM bookings)`);
    await db.query(`DELETE FROM listings WHERE status IN ('traded','expired') AND (traded_at < $1 OR expires_at < $1)`, [oneMonthAgo]);
    await db.query(`DELETE FROM chats WHERE is_active = false AND created_at < $1`, [oneMonthAgo]);
    await db.query(`DELETE FROM chat_messages WHERE chat_id NOT IN (SELECT id FROM chats)`);
    await db.query(`DELETE FROM notifications WHERE is_read = true AND created_at < $1`, [oneMonthAgo]);
    await db.query(`DELETE FROM vending_stock_logs WHERE created_at < $1`, [oneMonthAgo]);
    await db.query(`DELETE FROM sessions WHERE expires_at < NOW()`);
    await db.query(`DELETE FROM email_verifications WHERE used_at IS NOT NULL OR expires_at < NOW()`);
    console.log("✅ Monthly cleanup complete");
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
  }
});

console.log("⏰ Cleanup job scheduled");
