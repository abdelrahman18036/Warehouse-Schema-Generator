#standard_schemas.py


def get_standard_schema_for_domain(domain):
    if domain == 'E-commerce':
        return {
            'fact_tables': {
                'sales_fact': {
                    'columns': [
                        {'name': 'sale_id', 'type': 'INT'},
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'customer_id', 'type': 'INT'},
                        {'name': 'product_id', 'type': 'INT'},
                        {'name': 'quantity', 'type': 'INT'},
                        {'name': 'total_amount', 'type': 'DECIMAL(10,2)'},
                        {'name': 'discount_amount', 'type': 'DECIMAL(10,2)'},
                        {'name': 'tax_amount', 'type': 'DECIMAL(10,2)'},
                        {'name': 'shipping_cost', 'type': 'DECIMAL(10,2)'},
                        {'name': 'store_id', 'type': 'INT'},  # for multi-channel sales
                    ],
                    'primary_keys': ['sale_id'],
                    'foreign_keys': [
                        {'column': 'date_id', 'references': {'table': 'date_dimension', 'column': 'date_id'}},
                        {'column': 'customer_id', 'references': {'table': 'customer_dimension', 'column': 'customer_id'}},
                        {'column': 'product_id', 'references': {'table': 'product_dimension', 'column': 'product_id'}},
                        {'column': 'store_id', 'references': {'table': 'store_dimension', 'column': 'store_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'customer_dimension': {
                    'columns': [
                        {'name': 'customer_id', 'type': 'INT'},
                        {'name': 'full_name', 'type': 'VARCHAR(100)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                        {'name': 'phone', 'type': 'VARCHAR(20)'},
                        {'name': 'address', 'type': 'VARCHAR(255)'},
                        {'name': 'created_at', 'type': 'TIMESTAMP'},
                        {'name': 'updated_at', 'type': 'TIMESTAMP'},
                        {'name': 'loyalty_points', 'type': 'INT'},  # loyalty points system
                    ],
                    'primary_keys': ['customer_id'],
                    'foreign_keys': [],
                },
                'product_dimension': {
                    'columns': [
                        {'name': 'product_id', 'type': 'INT'},
                        {'name': 'product_name', 'type': 'VARCHAR(100)'},
                        {'name': 'category', 'type': 'VARCHAR(50)'},
                        {'name': 'price', 'type': 'DECIMAL(10,2)'},
                        {'name': 'sku', 'type': 'VARCHAR(50)'},
                        {'name': 'inventory_level', 'type': 'INT'},  # track stock levels
                    ],
                    'primary_keys': ['product_id'],
                    'foreign_keys': [],
                },
                'date_dimension': {
                    'columns': [
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'year', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'quarter', 'type': 'INT'},
                        {'name': 'is_holiday', 'type': 'BOOLEAN'},  # whether the day is a holiday
                    ],
                    'primary_keys': ['date_id'],
                    'foreign_keys': [],
                },
                'store_dimension': {
                    'columns': [
                        {'name': 'store_id', 'type': 'INT'},
                        {'name': 'store_name', 'type': 'VARCHAR(100)'},
                        {'name': 'location', 'type': 'VARCHAR(255)'},
                        {'name': 'store_type', 'type': 'VARCHAR(50)'},  # online, physical
                    ],
                    'primary_keys': ['store_id'],
                    'foreign_keys': [],
                }
            },
        }
    elif domain == 'Healthcare':
        return {
            'fact_tables': {
                'appointment_fact': {
                    'columns': [
                        {'name': 'appointment_id', 'type': 'INT'},
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'patient_id', 'type': 'INT'},
                        {'name': 'doctor_id', 'type': 'INT'},
                        {'name': 'diagnosis', 'type': 'VARCHAR(255)'},
                        {'name': 'treatment', 'type': 'VARCHAR(255)'},
                        {'name': 'cost', 'type': 'DECIMAL(10,2)'},  # cost of treatment
                        {'name': 'payment_method', 'type': 'VARCHAR(50)'},  # cash, insurance, etc.
                    ],
                    'primary_keys': ['appointment_id'],
                    'foreign_keys': [
                        {'column': 'date_id', 'references': {'table': 'date_dimension', 'column': 'date_id'}},
                        {'column': 'patient_id', 'references': {'table': 'patient_dimension', 'column': 'patient_id'}},
                        {'column': 'doctor_id', 'references': {'table': 'doctor_dimension', 'column': 'doctor_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'patient_dimension': {
                    'columns': [
                        {'name': 'patient_id', 'type': 'INT'},
                        {'name': 'full_name', 'type': 'VARCHAR(100)'},
                        {'name': 'dob', 'type': 'DATE'},
                        {'name': 'address', 'type': 'VARCHAR(255)'},
                        {'name': 'phone', 'type': 'VARCHAR(20)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                        {'name': 'insurance_provider', 'type': 'VARCHAR(100)'},  # insurance details
                    ],
                    'primary_keys': ['patient_id'],
                    'foreign_keys': [],
                },
                'doctor_dimension': {
                    'columns': [
                        {'name': 'doctor_id', 'type': 'INT'},
                        {'name': 'full_name', 'type': 'VARCHAR(100)'},
                        {'name': 'specialization', 'type': 'VARCHAR(50)'},
                        {'name': 'phone', 'type': 'VARCHAR(20)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                        {'name': 'years_experience', 'type': 'INT'},  # number of years of experience
                    ],
                    'primary_keys': ['doctor_id'],
                    'foreign_keys': [],
                },
                'date_dimension': {
                    'columns': [
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'year', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'quarter', 'type': 'INT'},
                        {'name': 'is_weekend', 'type': 'BOOLEAN'},  # mark if it's a weekend
                    ],
                    'primary_keys': ['date_id'],
                    'foreign_keys': [],
                },
            },
        }
    elif domain == 'Education':
        return {
            'fact_tables': {
                'enrollment_fact': {
                    'columns': [
                        {'name': 'enrollment_id', 'type': 'INT'},
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'student_id', 'type': 'INT'},
                        {'name': 'course_id', 'type': 'INT'},
                        {'name': 'grade', 'type': 'DECIMAL(5,2)'},
                        {'name': 'attendance_rate', 'type': 'DECIMAL(5,2)'},  # attendance record
                    ],
                    'primary_keys': ['enrollment_id'],
                    'foreign_keys': [
                        {'column': 'date_id', 'references': {'table': 'date_dimension', 'column': 'date_id'}},
                        {'column': 'student_id', 'references': {'table': 'student_dimension', 'column': 'student_id'}},
                        {'column': 'course_id', 'references': {'table': 'course_dimension', 'column': 'course_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'student_dimension': {
                    'columns': [
                        {'name': 'student_id', 'type': 'INT'},
                        {'name': 'full_name', 'type': 'VARCHAR(100)'},
                        {'name': 'dob', 'type': 'DATE'},
                        {'name': 'address', 'type': 'VARCHAR(255)'},
                        {'name': 'phone', 'type': 'VARCHAR(20)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                        {'name': 'major', 'type': 'VARCHAR(50)'},  # academic major
                    ],
                    'primary_keys': ['student_id'],
                    'foreign_keys': [],
                },
                'course_dimension': {
                    'columns': [
                        {'name': 'course_id', 'type': 'INT'},
                        {'name': 'course_name', 'type': 'VARCHAR(100)'},
                        {'name': 'instructor', 'type': 'VARCHAR(50)'},
                        {'name': 'subject', 'type': 'VARCHAR(50)'},
                        {'name': 'credits', 'type': 'INT'},  # number of course credits
                    ],
                    'primary_keys': ['course_id'],
                    'foreign_keys': [],
                },
                'date_dimension': {
                    'columns': [
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'year', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'quarter', 'type': 'INT'},
                    ],
                    'primary_keys': ['date_id'],
                    'foreign_keys': [],
                },
            },
        }
    elif domain == 'Finance':
        return {
            'fact_tables': {
                'transaction_fact': {
                    'columns': [
                        {'name': 'transaction_id', 'type': 'INT'},
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'account_id', 'type': 'INT'},
                        {'name': 'amount', 'type': 'DECIMAL(10,2)'},
                        {'name': 'transaction_type', 'type': 'VARCHAR(20)'},
                        {'name': 'currency', 'type': 'VARCHAR(3)'},  # add currency type (e.g., USD)
                    ],
                    'primary_keys': ['transaction_id'],
                    'foreign_keys': [
                        {'column': 'date_id', 'references': {'table': 'date_dimension', 'column': 'date_id'}},
                        {'column': 'account_id', 'references': {'table': 'account_dimension', 'column': 'account_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'account_dimension': {
                    'columns': [
                        {'name': 'account_id', 'type': 'INT'},
                        {'name': 'account_name', 'type': 'VARCHAR(100)'},
                        {'name': 'account_type', 'type': 'VARCHAR(50)'},
                        {'name': 'balance', 'type': 'DECIMAL(10,2)'},
                        {'name': 'branch', 'type': 'VARCHAR(100)'},  # add bank branch
                    ],
                    'primary_keys': ['account_id'],
                    'foreign_keys': [],
                },
                'date_dimension': {
                    'columns': [
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'year', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'quarter', 'type': 'INT'},
                    ],
                    'primary_keys': ['date_id'],
                    'foreign_keys': [],
                },
            },
        }
    elif domain == 'Supply Chain':
        return {
            'fact_tables': {
                'shipment_fact': {
                    'columns': [
                        {'name': 'shipment_id', 'type': 'INT'},
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'supplier_id', 'type': 'INT'},
                        {'name': 'product_id', 'type': 'INT'},
                        {'name': 'quantity', 'type': 'INT'},
                        {'name': 'warehouse_id', 'type': 'INT'},
                    ],
                    'primary_keys': ['shipment_id'],
                    'foreign_keys': [
                        {'column': 'date_id', 'references': {'table': 'date_dimension', 'column': 'date_id'}},
                        {'column': 'supplier_id', 'references': {'table': 'supplier_dimension', 'column': 'supplier_id'}},
                        {'column': 'product_id', 'references': {'table': 'product_dimension', 'column': 'product_id'}},
                        {'column': 'warehouse_id', 'references': {'table': 'warehouse_dimension', 'column': 'warehouse_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'supplier_dimension': {
                    'columns': [
                        {'name': 'supplier_id', 'type': 'INT'},
                        {'name': 'supplier_name', 'type': 'VARCHAR(100)'},
                        {'name': 'address', 'type': 'VARCHAR(255)'},
                        {'name': 'phone', 'type': 'VARCHAR(20)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                    ],
                    'primary_keys': ['supplier_id'],
                    'foreign_keys': [],
                },
                'warehouse_dimension': {
                    'columns': [
                        {'name': 'warehouse_id', 'type': 'INT'},
                        {'name': 'warehouse_name', 'type': 'VARCHAR(100)'},
                        {'name': 'location', 'type': 'VARCHAR(255)'},
                    ],
                    'primary_keys': ['warehouse_id'],
                    'foreign_keys': [],
                },
                'product_dimension': {
                    'columns': [
                        {'name': 'product_id', 'type': 'INT'},
                        {'name': 'product_name', 'type': 'VARCHAR(100)'},
                        {'name': 'category', 'type': 'VARCHAR(50)'},
                        {'name': 'price', 'type': 'DECIMAL(10,2)'},
                        {'name': 'sku', 'type': 'VARCHAR(50)'},
                    ],
                    'primary_keys': ['product_id'],
                    'foreign_keys': [],
                },
                'date_dimension': {
                    'columns': [
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'year', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'quarter', 'type': 'INT'},
                    ],
                    'primary_keys': ['date_id'],
                    'foreign_keys': [],
                },
            },
        }
    elif domain == 'Social Media':
        return {
            'fact_tables': {
                'post_fact': {
                    'columns': [
                        {'name': 'post_id', 'type': 'INT'},
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'user_id', 'type': 'INT'},
                        {'name': 'content', 'type': 'TEXT'},
                        {'name': 'likes', 'type': 'INT'},
                        {'name': 'comments', 'type': 'INT'},
                    ],
                    'primary_keys': ['post_id'],
                    'foreign_keys': [
                        {'column': 'date_id', 'references': {'table': 'date_dimension', 'column': 'date_id'}},
                        {'column': 'user_id', 'references': {'table': 'user_dimension', 'column': 'user_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'user_dimension': {
                    'columns': [
                        {'name': 'user_id', 'type': 'INT'},
                        {'name': 'username', 'type': 'VARCHAR(50)'},
                        {'name': 'full_name', 'type': 'VARCHAR(100)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                        {'name': 'phone', 'type': 'VARCHAR(20)'},
                        {'name': 'location', 'type': 'VARCHAR(100)'},
                    ],
                    'primary_keys': ['user_id'],
                    'foreign_keys': [],
                },
                'date_dimension': {
                    'columns': [
                        {'name': 'date_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'year', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'quarter', 'type': 'INT'},
                    ],
                    'primary_keys': ['date_id'],
                    'foreign_keys': [],
                },
            },
        }

    else:
        return {}




