-- Table: customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: addresses
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state_province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: products
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_number VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    standard_cost DECIMAL(10, 2) NOT NULL,
    list_price DECIMAL(10, 2) NOT NULL,
    size VARCHAR(10),
    weight DECIMAL(8, 2),
    category_id INT,
    model_id INT,
    sell_start_date TIMESTAMP NOT NULL,
    sell_end_date TIMESTAMP,
    discontinued_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: product_categories
CREATE TABLE product_categories (
    category_id SERIAL PRIMARY KEY,
    parent_category_id INT,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: product_descriptions
CREATE TABLE product_descriptions (
    description_id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: product_models
CREATE TABLE product_models (
    model_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    catalog_description XML,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: customer_addresses
CREATE TABLE customer_addresses (
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    address_id INT NOT NULL REFERENCES addresses(address_id),
    address_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, address_id)
);

-- Table: sales_order_headers
CREATE TABLE sales_order_headers (
    order_id SERIAL PRIMARY KEY,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    ship_date TIMESTAMP,
    status TINYINT,
    order_number VARCHAR(25) UNIQUE,
    customer_id INT REFERENCES customers(customer_id),
    bill_to_address_id INT REFERENCES addresses(address_id),
    ship_to_address_id INT REFERENCES addresses(address_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: sales_order_details
CREATE TABLE sales_order_details (
    order_id INT NOT NULL REFERENCES sales_order_headers(order_id),
    detail_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    order_qty SMALLINT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    unit_price_discount DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(18, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
