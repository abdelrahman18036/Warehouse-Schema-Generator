-- Schema for a hotel management system

CREATE TABLE guests (
    guest_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    id_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    room_number VARCHAR(10),
    room_type VARCHAR(50),
    price_per_night DECIMAL(8, 2),
    max_occupancy INT,
    amenities TEXT,
    status VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    guest_id INT REFERENCES guests(guest_id),
    room_id INT REFERENCES rooms(room_id),
    check_in_date DATE,
    check_out_date DATE,
    total_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'confirmed'
);

CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    reservation_id INT REFERENCES reservations(reservation_id),
    service_name VARCHAR(100),
    service_cost DECIMAL(8, 2),
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
); 