CREATE DATABASE IF NOT EXISTS nestc;
USE nestc;

CREATE TABLE users (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          ENUM('student', 'admin', 'security', 'operator') NOT NULL DEFAULT 'student',
  hostel        VARCHAR(50),
  room_number   VARCHAR(20),
  phone         VARCHAR(15),
  gender        ENUM('male', 'female', 'other'),
  fcm_token     TEXT,
  is_verified   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_verifications (
  id         VARCHAR(36) PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  token      VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  jwt_token   TEXT NOT NULL,
  device_info TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE drivers (
  id                  VARCHAR(36) PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  phone               VARCHAR(15) UNIQUE NOT NULL,
  vehicle_number      VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type        ENUM('auto', 'taxi') NOT NULL,
  status              ENUM('available', 'busy', 'offline') DEFAULT 'offline',
  last_latitude       DECIMAL(9,6),
  last_longitude      DECIMAL(9,6),
  location_updated_at TIMESTAMP NULL,
  is_approved         BOOLEAN DEFAULT false,
  total_trips         INTEGER DEFAULT 0,
  rating              DECIMAL(2,1) DEFAULT 5.0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id                   VARCHAR(36) PRIMARY KEY,
  student_id           VARCHAR(36) NOT NULL,
  driver_id            VARCHAR(36),
  vehicle_type         ENUM('auto', 'taxi') NOT NULL,
  pickup_location      VARCHAR(100) NOT NULL,
  destination          VARCHAR(100) NOT NULL,
  hostel               VARCHAR(50) NOT NULL,
  scheduled_time       TIMESTAMP NULL,
  status               ENUM('pending', 'accepted', 'arrived', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  booking_code         VARCHAR(6) UNIQUE NOT NULL,
  gate_pass_url        TEXT,
  gate_pass_expires_at TIMESTAMP NULL,
  accepted_at          TIMESTAMP NULL,
  arrived_at           TIMESTAMP NULL,
  completed_at         TIMESTAMP NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE booking_driver_pings (
  id               VARCHAR(36) PRIMARY KEY,
  booking_id       VARCHAR(36) NOT NULL,
  driver_id        VARCHAR(36) NOT NULL,
  whatsapp_sent_at TIMESTAMP NULL,
  response         ENUM('accepted', 'rejected', 'timeout'),
  responded_at     TIMESTAMP NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE hostels (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  type        ENUM('boys', 'girls', 'faculty') NOT NULL,
  block_count INTEGER DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vending_machines (
  id                   VARCHAR(36) PRIMARY KEY,
  hostel_id            VARCHAR(36) NOT NULL,
  location_description VARCHAR(100) NOT NULL,
  operator_id          VARCHAR(36),
  last_refilled_at     TIMESTAMP NULL,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE vending_items (
  id                  VARCHAR(36) PRIMARY KEY,
  machine_id          VARCHAR(36) NOT NULL,
  item_name           VARCHAR(100) NOT NULL,
  slot_code           VARCHAR(10) NOT NULL,
  price               DECIMAL(6,2) NOT NULL,
  current_stock       INTEGER DEFAULT 0,
  max_stock           INTEGER NOT NULL,
  low_stock_threshold INTEGER DEFAULT 3,
  image_url           TEXT,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES vending_machines(id) ON DELETE CASCADE
);

CREATE TABLE vending_stock_logs (
  id             VARCHAR(36) PRIMARY KEY,
  item_id        VARCHAR(36) NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock      INTEGER NOT NULL,
  updated_by     VARCHAR(36),
  note           TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES vending_items(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE vending_subscriptions (
  id               VARCHAR(36) PRIMARY KEY,
  student_id       VARCHAR(36) NOT NULL,
  machine_id       VARCHAR(36) NOT NULL,
  notify_on_refill BOOLEAN DEFAULT true,
  notify_on_low    BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, machine_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (machine_id) REFERENCES vending_machines(id) ON DELETE CASCADE
);

CREATE TABLE listings (
  id          VARCHAR(36) PRIMARY KEY,
  seller_id   VARCHAR(36) NOT NULL,
  type        ENUM('have', 'want') NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  category    ENUM('books', 'stationery', 'electronics', 'lab', 'clothes', 'cycles', 'other') NOT NULL,
  price       DECIMAL(8,2),
  is_urgent   BOOLEAN DEFAULT false,
  is_free     BOOLEAN DEFAULT false,
  status      ENUM('active', 'traded', 'expired', 'removed') DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  expires_at  TIMESTAMP NULL,
  traded_at   TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE listing_photos (
  id            VARCHAR(36) PRIMARY KEY,
  listing_id    VARCHAR(36) NOT NULL,
  photo_url     TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE listing_interests (
  id         VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  buyer_id   VARCHAR(36) NOT NULL,
  message    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, buyer_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE chats (
  id         VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36),
  buyer_id   VARCHAR(36) NOT NULL,
  seller_id  VARCHAR(36) NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
  id         VARCHAR(36) PRIMARY KEY,
  chat_id    VARCHAR(36) NOT NULL,
  sender_id  VARCHAR(36) NOT NULL,
  content    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE notifications (
  id         VARCHAR(36) PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(100) NOT NULL,
  body       TEXT NOT NULL,
  data       JSON,
  is_read    BOOLEAN DEFAULT false,
  sent_at    TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GATE PASS SYSTEM UPDATES
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pass_id VARCHAR(255) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_response VARCHAR(50) DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10,8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11,8);

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
);

-- Note: Indexes on status and pass_id to speed up lookups
CREATE INDEX IF NOT EXISTS idx_gate_pass_id ON gate_passes(pass_id);
CREATE INDEX IF NOT EXISTS idx_gate_pass_status ON gate_passes(status);

-- SEED DATA
INSERT IGNORE INTO hostels (id, name, type) VALUES
  (UUID(), 'H1','boys'),(UUID(), 'H2','boys'),(UUID(), 'H3','boys'),(UUID(), 'H4','boys'),
  (UUID(), 'H5','boys'),(UUID(), 'H6','boys'),(UUID(), 'LH','girls'),(UUID(), 'LH2','girls');
