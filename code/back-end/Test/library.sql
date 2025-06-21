-- Schema for a library management system

CREATE TABLE members (
    member_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    membership_date DATE,
    membership_type VARCHAR(20) DEFAULT 'regular'
);

CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    birth_date DATE,
    nationality VARCHAR(50)
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    author_id INT REFERENCES authors(author_id),
    isbn VARCHAR(20),
    publication_year INT,
    genre VARCHAR(50),
    available_copies INT DEFAULT 1
);

CREATE TABLE loans (
    loan_id SERIAL PRIMARY KEY,
    member_id INT REFERENCES members(member_id),
    book_id INT REFERENCES books(book_id),
    loan_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'active'
); 