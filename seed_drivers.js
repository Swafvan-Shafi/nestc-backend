const db = require('./src/config/db');
const { randomUUID } = require('crypto');

const drivers = [
  { name: 'Meharuba', phone: '9037463202', vehicle: 'KL-11-A-1234', type: 'auto', lat: 11.3216, lng: 75.9338 },
  { name: 'swafvan', phone: '7994480054', vehicle: 'KL-11-B-5678', type: 'auto', lat: 11.3190, lng: 75.9310 },
  { name: 'noorjahan', phone: '9895860054', vehicle: 'KL-11-C-9012', type: 'taxi', lat: 11.3250, lng: 75.9350 },
  { name: 'ameekh', phone: '7306634360', vehicle: 'KL-11-D-3456', type: 'auto', lat: 11.3100, lng: 75.9400 },
  { name: 'rithu', phone: '9747880011', vehicle: 'KL-11-E-7890', type: 'taxi', lat: 11.3300, lng: 75.9200 }
];

async function seedDrivers() {
  try {
    // Clear existing (optional, but good for testing)
    await db.pool.query('DELETE FROM drivers');
    
    for (const d of drivers) {
      await db.pool.query(
        'INSERT INTO drivers (id, name, phone, vehicle_number, vehicle_type, status, is_approved, last_latitude, last_longitude) VALUES (?, ?, ?, ?, ?, "available", true, ?, ?)',
        [randomUUID(), d.name, d.phone, d.vehicle, d.type, d.lat, d.lng]
      );
      console.log(`✅ Seeded driver: ${d.name}`);
    }
    console.log('--- SEEDING COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding drivers:', err.message);
    process.exit(1);
  }
}

seedDrivers();
