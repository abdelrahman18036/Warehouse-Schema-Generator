-- Create a new database
CREATE DATABASE ecommerce_db;
\c ecommerce_db; -- Connect to the new database

-- Create the 'customers' table (Dimension Table)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email LIKE '%@%.%')
);

-- Create the 'products' table (Dimension Table)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the 'orders' table (Dimension Table)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Create the 'order_items' table (Fact Table)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT chk_quantity CHECK (quantity >= 1)
);

-- Create the 'categories' table (Dimension Table) for product categorization
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

-- Create a join table for the many-to-many relationship between products and categories
CREATE TABLE product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT fk_product_cat FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Create an 'order_statuses' table to track order status over time (Dimension Table)
CREATE TABLE order_statuses (
    order_status_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Create the 'payment_methods' table (Dimension Table) for storing available payment options
CREATE TABLE payment_methods (
    payment_method_id SERIAL PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL
);

-- Create the 'payments' table (Fact Table)
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id)
);

-- Create an 'addresses' table to store customer shipping and billing addresses (Dimension Table)
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    address_type VARCHAR(10) CHECK (address_type IN ('shipping', 'billing')),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Create indexes to improve performance on key queries
CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_product_name ON products(product_name);
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_order_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payment_order_id ON payments(order_id);

-- Insert some sample data for testing
-- Insert data into 'categories'
INSERT INTO categories (category_name) VALUES ('Electronics'), ('Clothing'), ('Books'), ('Home & Kitchen');

-- Insert data into 'payment_methods'
INSERT INTO payment_methods (method_name) VALUES ('Credit Card'), ('PayPal'), ('Bank Transfer');

-- Insert sample customers
INSERT INTO customers (first_name, last_name, email, phone) VALUES
('John', 'Doe', 'john.doe@example.com', '555-1234'),
('Jane', 'Smith', 'jane.smith@example.com', '555-5678');

-- Insert sample products
INSERT INTO products (product_name, description, price, stock_quantity) VALUES
('Laptop', 'A high-performance laptop.', 999.99, 50),
('Smartphone', 'Latest model with advanced features.', 599.99, 100),
('T-shirt', 'Comfortable cotton t-shirt.', 19.99, 200),
('Blender', 'High-speed blender for smoothies.', 49.99, 75);

-- Insert sample orders
INSERT INTO orders (customer_id, total_amount) VALUES (1, 1019.98), (2, 619.98);

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 999.99), -- John Doe bought 1 laptop
(1, 3, 1, 19.99), -- John Doe bought 1 t-shirt
(2, 2, 1, 599.99), -- Jane Smith bought 1 smartphone

-- Insert sample payments
INSERT INTO payments (order_id, payment_method_id, amount) VALUES
(1, 1, 1019.98), -- John Doe paid with Credit Card
(2, 2, 619.98);  -- Jane Smith paid with PayPal

-- Insert sample addresses
INSERT INTO addresses (customer_id, address_type, street_address, city, state, postal_code, country) VALUES
(1, 'shipping', '123 Main St', 'New York', 'NY', '10001', 'USA'),
(2, 'shipping', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA');
