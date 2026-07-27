// models/Setting.js
const db = require('../config/db');

class Setting {
  static async all() {
    const [rows] = await db.execute('SELECT * FROM settings');
    return rows;
  }

  static async findByKey(key) {
    const [rows] = await db.execute('SELECT * FROM settings WHERE `key` = ? ORDER BY id DESC', [key]);
    return rows[0];
  }

  static async upsert(key, value) {
    // Ensure value is stored as string (JSON for objects)
    const storedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Find existing rows for this key, newest first
    const [rows] = await db.execute('SELECT id FROM settings WHERE `key` = ? ORDER BY id DESC', [key]);

    if (rows.length > 0) {
      const latestId = rows[0].id;
      // Update the newest record
      await db.execute('UPDATE settings SET `value` = ? WHERE id = ?', [storedValue, latestId]);

      // If there are older duplicate records, delete them
      if (rows.length > 1) {
        const idsToDelete = rows.slice(1).map(r => r.id);
        const placeholders = idsToDelete.map(() => '?').join(',');
        await db.execute(`DELETE FROM settings WHERE id IN (${placeholders})`, idsToDelete);
      }
    } else {
      // No existing record, insert a new one
      await db.execute('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [key, storedValue]);
    }
  }
}

module.exports = Setting;