CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('student', 'admin', 'security', 'operator');
CREATE TYPE driver_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE vehicle_type AS ENUM ('auto', 'taxi');
CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'arrived', 'completed', 'cancelled');
CREATE TYPE ping_response AS ENUM ('accepted', 'rejected', 'timeout');
CREATE TYPE hostel_type AS ENUM ('boys', 'girls', 'faculty');
CREATE TYPE listing_type AS ENUM ('have', 'want');
CREATE TYPE listing_category AS ENUM ('books', 'stationery', 'electronics', 'lab', 'clothes', 'cycles', 'other');
CREATE TYPE listing_status AS ENUM ('active', 'traded', 'expired', 'removed');
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');


CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'student',
  hostel        VARCHAR(50),
  room_number   VARCHAR(20),
  phone         VARCHAR(15),
  gender        user_gender,

  fcm_token     TEXT,
  is_verified   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP
);

CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jwt_token   TEXT NOT NULL,
  device_info TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  expires_at  TIMESTAMP NOT NULL
);

CREATE TABLE drivers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(100) NOT NULL,
  phone               VARCHAR(15) UNIQUE NOT NULL,
  vehicle_number      VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type        vehicle_type NOT NULL,
  status              driver_status DEFAULT 'offline',
  last_latitude       DECIMAL(9,6),
  last_longitude      DECIMAL(9,6),
  location_updated_at TIMESTAMP,
  is_approved         BOOLEAN DEFAULT false,
  total_trips         INTEGER DEFAULT 0,
  rating              DECIMAL(2,1) DEFAULT 5.0,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           UUID NOT NULL REFERENCES users(id),
  driver_id            UUID REFERENCES drivers(id),
  vehicle_type         vehicle_type NOT NULL,
  pickup_location      VARCHAR(100) NOT NULL,
  destination          VARCHAR(100) NOT NULL,
  hostel               VARCHAR(50) NOT NULL,
  scheduled_time       TIMESTAMP,
  status               booking_status NOT NULL DEFAULT 'pending',
  booking_code         VARCHAR(6) UNIQUE NOT NULL,
  gate_pass_url        TEXT,
  gate_pass_expires_at TIMESTAMP,
  accepted_at          TIMESTAMP,
  arrived_at           TIMESTAMP,
  completed_at         TIMESTAMP,
  created_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE booking_driver_pings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id        UUID NOT NULL REFERENCES drivers(id),
  whatsapp_sent_at TIMESTAMP,
  response         ping_response,
  responded_at     TIMESTAMP
);

CREATE TABLE hostels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  type        hostel_type NOT NULL,
  block_count INTEGER DEFAULT 1,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vending_machines (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id            UUID NOT NULL REFERENCES hostels(id),
  location_description VARCHAR(100) NOT NULL,
  operator_id          UUID REFERENCES users(id),
  last_refilled_at     TIMESTAMP,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vending_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id          UUID NOT NULL REFERENCES vending_machines(id) ON DELETE CASCADE,
  item_name           VARCHAR(100) NOT NULL,
  slot_code           VARCHAR(10) NOT NULL,
  price               DECIMAL(6,2) NOT NULL,
  current_stock       INTEGER DEFAULT 0,
  max_stock           INTEGER NOT NULL,
  low_stock_threshold INTEGER DEFAULT 3,
  image_url           TEXT,
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vending_stock_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        UUID NOT NULL REFERENCES vending_items(id) ON DELETE CASCADE,
  previous_stock INTEGER NOT NULL,
  new_stock      INTEGER NOT NULL,
  updated_by     UUID REFERENCES users(id),
  note           TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vending_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id       UUID NOT NULL REFERENCES vending_machines(id) ON DELETE CASCADE,
  notify_on_refill BOOLEAN DEFAULT true,
  notify_on_low    BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, machine_id)
);

CREATE TABLE listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES users(id),
  type        listing_type NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  category    listing_category NOT NULL,
  price       DECIMAL(8,2),
  is_urgent   BOOLEAN DEFAULT false,
  is_free     BOOLEAN DEFAULT false,
  status      listing_status DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  expires_at  TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  traded_at   TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE listing_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  photo_url     TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE listing_interests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id   UUID NOT NULL REFERENCES users(id),
  message    TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id)
);

CREATE TABLE chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  buyer_id   UUID NOT NULL REFERENCES users(id),
  seller_id  UUID NOT NULL REFERENCES users(id),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(100) NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN DEFAULT false,
  sent_at    TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_completed_at ON bookings(completed_at);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category, status);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_traded_at ON listings(traded_at);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_vending_stock_logs_created ON vending_stock_logs(created_at);

-- SEED DATA
INSERT INTO hostels (name, type) VALUES
  ('H1','boys'),('H2','boys'),('H3','boys'),('H4','boys'),
  ('H5','boys'),('H6','boys'),('LH','girls'),('LH2','girls');
