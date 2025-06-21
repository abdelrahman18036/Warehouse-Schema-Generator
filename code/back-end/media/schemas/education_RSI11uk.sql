-- Schema for an education management system

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    enrollment_date DATE,
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    teacher_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    subject VARCHAR(100),
    hire_date DATE
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100),
    course_code VARCHAR(20),
    credits INT,
    teacher_id INT REFERENCES teachers(teacher_id),
    semester VARCHAR(20)
);

CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    course_id INT REFERENCES courses(course_id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(5),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100),
    department_head INT REFERENCES teachers(teacher_id),
    building VARCHAR(50),
    budget DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classrooms (
    classroom_id SERIAL PRIMARY KEY,
    room_number VARCHAR(20),
    building VARCHAR(50),
    capacity INT,
    equipment TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(course_id),
    title VARCHAR(200),
    description TEXT,
    due_date TIMESTAMP,
    max_points INT,
    assignment_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(assignment_id),
    student_id INT REFERENCES students(student_id),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500),
    points_earned INT,
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted'
);

CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    course_id INT REFERENCES courses(course_id),
    attendance_date DATE,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT
);

CREATE TABLE schedules (
    schedule_id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(course_id),
    classroom_id INT REFERENCES classrooms(classroom_id),
    day_of_week VARCHAR(10),
    start_time TIME,
    end_time TIME,
    semester VARCHAR(20)
);

CREATE TABLE student_guardians (
    guardian_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    guardian_name VARCHAR(100),
    relationship VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_emergency_contact BOOLEAN DEFAULT FALSE
); 