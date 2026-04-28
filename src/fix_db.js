const mysql = require('mysql2/promise');

async function fix() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Thottath3/',
    database: 'nestc'
  });

  const addColumn = async (table, col, definition) => {
    try {
      console.log(`Adding ${col} to ${table}...`);
      await connection.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log(`Column ${col} already exists.`);
      } else {
        console.error(`Error adding ${col}:`, e.message);
      }
    }
  };

  try {
    // Fix drivers table
    await addColumn('drivers', 'is_approved', 'BOOLEAN DEFAULT true');
    await addColumn('drivers', 'vehicle_type', "VARCHAR(20) DEFAULT 'auto'");
    await addColumn('drivers', 'last_latitude', 'DECIMAL(10, 8)');
    await addColumn('drivers', 'last_longitude', 'DECIMAL(11, 8)');
    await addColumn('drivers', 'vehicle_number', 'VARCHAR(20)');
    await addColumn('drivers', 'total_trips', 'INTEGER DEFAULT 0');
    
    // Status sync
    await connection.query("UPDATE drivers SET status = 'available' WHERE status = 'free'");

    // Fix bookings table
    await addColumn('bookings', 'vehicle_type', "VARCHAR(20) DEFAULT 'auto'");
    await addColumn('bookings', 'pickup_location', 'TEXT');
    await addColumn('bookings', 'destination', 'TEXT');
    await addColumn('bookings', 'hostel', 'VARCHAR(20)');
    await addColumn('bookings', 'booking_code', 'VARCHAR(20)');
    await addColumn('bookings', 'scheduled_time', 'DATETIME');
    await addColumn('bookings', 'accepted_at', 'DATETIME');
    await addColumn('bookings', 'gate_pass_url', 'TEXT');
    await addColumn('bookings', 'gate_pass_expires_at', 'DATETIME');
    await addColumn('bookings', 'completed_at', 'DATETIME');

    // Add pass columns
    await addColumn('bookings', 'pass_id', 'VARCHAR(255) UNIQUE');
    await addColumn('bookings', 'driver_response', "VARCHAR(50) DEFAULT 'pending'");
    await addColumn('bookings', 'pickup_lat', 'DECIMAL(10, 8)');
    await addColumn('bookings', 'pickup_lng', 'DECIMAL(11, 8)');

    // Create gate passes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS gate_passes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pass_id VARCHAR(255) UNIQUE NOT NULL,
        student_roll VARCHAR(100) NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        driver_name VARCHAR(100) NOT NULL,
        vehicle_number VARCHAR(100) NOT NULL,
        pickup_location VARCHAR(255) NOT NULL,
        drop_location VARCHAR(255) NOT NULL,
        booking_time TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      )
    `);

    console.log('Database schema fixed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during schema fix:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fix();
