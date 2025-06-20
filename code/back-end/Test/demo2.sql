-- Create the database
CREATE DATABASE sales_dw;
\c sales_dw; -- Connect to the new database

-- Create the Customer Dimension table
CREATE TABLE customer_dimension (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_address VARCHAR(255),
    customer_email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the Product Dimension table
CREATE TABLE product_dimension (
    product_id SERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL,
    product_category VARCHAR(100),
    price DECIMAL(10, 2) CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the Time Dimension table
CREATE TABLE time_dimension (
    time_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    year INT NOT NULL,
    month VARCHAR(20),
    quarter VARCHAR(10)
);

-- Create the Company Dimension table
CREATE TABLE company_dimension (
    company_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100),
    department_name VARCHAR(100),
    region VARCHAR(100)
);

-- Create the Sales Fact table
CREATE TABLE sales_fact (
    sales_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    company_id INT NOT NULL,
    time_id INT NOT NULL,
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES product_dimension(product_id),
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer_dimension(customer_id),
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company_dimension(company_id),
    CONSTRAINT fk_time FOREIGN KEY (time_id) REFERENCES time_dimension(time_id)
);

-- Create indexes to optimize query performance
CREATE INDEX idx_sales_product ON sales_fact(product_id);
CREATE INDEX idx_sales_customer ON sales_fact(customer_id);
CREATE INDEX idx_sales_company ON sales_fact(company_id);
CREATE INDEX idx_sales_time ON sales_fact(time_id);

-- Insert sample data into time dimension
INSERT INTO time_dimension (date, year, month, quarter) VALUES
('2024-01-01', 2024, 'January', 'Q1'),
('2024-02-01', 2024, 'February', 'Q1'),
('2024-03-01', 2024, 'March', 'Q1'),
('2024-04-01', 2024, 'April', 'Q2');

-- Insert sample data into customer dimension
INSERT INTO customer_dimension (customer_name, customer_address, customer_email) VALUES
('John Doe', '123 Main St, New York, NY', 'john.doe@example.com'),
('Jane Smith', '456 Oak Ave, Los Angeles, CA', 'jane.smith@example.com');

-- Insert sample data into product dimension
INSERT INTO product_dimension (product_sku, product_category, price) VALUES
('SKU12345', 'Electronics', 499.99),
('SKU67890', 'Home Appliances', 299.99);

-- Insert sample data into company dimension
INSERT INTO company_dimension (employee_name, department_name, region) VALUES
('Alice Brown', 'Sales', 'North America'),
('Bob Green', 'Marketing', 'Europe');

-- Insert sample data into sales fact table
INSERT INTO sales_fact (product_id, customer_id, company_id, time_id, quantity_ordered, total) VALUES
(1, 1, 1, 1, 2, 999.98),  -- John Doe purchased 2 units of product 1 from Alice Brown in Q1 2024
(2, 2, 2, 2, 1, 299.99);  -- Jane Smith purchased 1 unit of product 2 from Bob Green in Q1 2024

