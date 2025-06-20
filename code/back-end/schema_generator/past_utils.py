
# schema_generator/utils.py
import re

COLUMN_VARIATIONS = {
    'customer_id': ['customer_id', 'cust_id', 'c_id'],
    'first_name': ['first_name', 'firstname', 'f_name', 'fname'],
    'last_name': ['last_name', 'lastname', 'l_name', 'lname'],
    'full_name': ['full_name', 'fullname', 'name'],
    'email': ['email', 'email_address', 'e_mail'],
    'product_id': ['product_id', 'prod_id', 'p_id'],
    'product_name': ['product_name', 'prod_name', 'p_name'],

}


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





def detect_domain(schema_details):
    domain_keywords = {
        'E-commerce': [
            r'customer', r'product', r'order', r'cart', r'payment', r'shipment', r'order_item',
            r'sku', r'sales', r'invoice', r'address', r'firstname', r'lastname', r'email'
        ],
        'Healthcare': [
            r'patient', r'doctor', r'appointment', r'prescription', r'diagnosis', r'medical',
            r'health', r'treatment', r'medication', r'hospital', r'clinic', r'first_name', r'last_name'
        ],
        'Education': [
            r'student', r'course', r'enrollment', r'grade', r'instructor', r'class',
            r'school', r'university', r'teacher', r'first_name', r'last_name', r'subject'
        ],
        'Finance': [
            r'account', r'transaction', r'balance', r'loan', r'investment', r'finance',
            r'customer', r'branch', r'credit', r'debit', r'first_name', r'last_name'
        ],
        'Supply Chain': [
            r'supplier', r'inventory', r'shipment', r'warehouse', r'logistics', r'supply',
            r'demand', r'product', r'order', r'sku', r'item', r'stock'
        ],
        'Social Media': [
            r'user', r'post', r'comment', r'like', r'friend', r'message', r'social',
            r'profile', r'username', r'content', r'follow', r'first_name', r'last_name'
        ],
    }

    names = []
    for table_name, table_info in schema_details.items():
        names.append(table_name.lower())
        for column in table_info['columns']:
            names.append(column['name'].lower())

    domain_scores = {domain: 0 for domain in domain_keywords.keys()}

    for domain, patterns in domain_keywords.items():
        for pattern in patterns:
            regex = re.compile(pattern.lower())
            matches = [name for name in names if regex.search(name)]
            domain_scores[domain] += len(matches)

    max_score = max(domain_scores.values())
    detected_domains = [domain for domain, score in domain_scores.items() if score == max_score]

    if max_score == 0:
        detected_domain = 'General'
    elif len(detected_domains) == 1:
        detected_domain = detected_domains[0]
    else:
        detected_domain = detected_domains[0] 

    return detected_domain




def parse_sql_file(file_path):
    with open(file_path, 'r') as file:
        sql_content = file.read()


    # Remove comments and unnecessary whitespace
    sql_content = re.sub(r'--.*\n', '', sql_content)
    sql_content = ' '.join(sql_content.split())

    # Find all CREATE TABLE statements
    create_statements = re.findall(r'CREATE TABLE.*?\(.*?\);', sql_content, re.IGNORECASE)

    schema_details = {}

    for statement in create_statements:
        # Extract table name
        table_name_match = re.match(r'CREATE TABLE\s+(\w+)', statement, re.IGNORECASE)
        if table_name_match:
            table_name = table_name_match.group(1)
        else:
            continue

        # Extract column definitions
        column_defs_match = re.search(r'\((.*)\)', statement)
        if not column_defs_match:
            continue

        column_defs = column_defs_match.group(1)
        # Split columns, handling nested parentheses
        columns = []
        paren_level = 0
        current_col = ''
        for char in column_defs:
            if char == '(':
                paren_level += 1
            elif char == ')':
                paren_level -= 1
            if char == ',' and paren_level == 0:
                columns.append(current_col.strip())
                current_col = ''
            else:
                current_col += char
        if current_col:
            columns.append(current_col.strip())

        # Process columns and constraints
        columns_info = []
        constraints = []
        for col in columns:
            col = col.strip()
            if col.upper().startswith(('PRIMARY KEY', 'FOREIGN KEY', 'CONSTRAINT', 'UNIQUE', 'CHECK')):
                constraints.append(col)
            else:
                # Extract column name, type, and constraints
                col_parts = re.split(r'\s+', col, maxsplit=2)
                col_name = col_parts[0]
                col_type = col_parts[1] if len(col_parts) > 1 else ''
                col_constraints = col_parts[2] if len(col_parts) > 2 else ''
                columns_info.append({
                    'name': col_name,
                    'type': col_type,
                    'constraints': col_constraints
                })

        schema_details[table_name] = {
            'columns': columns_info,
            'constraints': constraints
        }

    return schema_details


def get_standard_dimension_table(dim_name):
    if dim_name == 'customer_dimension':
        return {
            'columns': [
                {'name': 'customer_id', 'type': 'INT'},
                {'name': 'full_name', 'type': 'VARCHAR(100)'},
                {'name': 'email', 'type': 'VARCHAR(100)'},
                {'name': 'phone', 'type': 'VARCHAR(20)'},
                {'name': 'created_at', 'type': 'TIMESTAMP'},
            ],
            'primary_keys': ['customer_id'],
            'foreign_keys': [],
        }
    elif dim_name == 'product_dimension':
        return {
            'columns': [
                {'name': 'product_id', 'type': 'INT'},
                {'name': 'product_name', 'type': 'VARCHAR(100)'},
                {'name': 'category', 'type': 'VARCHAR(50)'},
                {'name': 'price', 'type': 'DECIMAL(10, 2)'},
            ],
            'primary_keys': ['product_id'],
            'foreign_keys': [],
        }
    elif dim_name == 'date_dimension':
        return {
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
        }
    return {}


def enhance_schema_with_domain(warehouse_schema, domain):
    # Implement enhancements specific to the domain
    if domain == 'E-commerce':
        # Ensure standard dimension tables are present
        required_dimensions = ['customer_dimension', 'product_dimension', 'date_dimension']
        for dim in required_dimensions:
            if dim not in warehouse_schema['dimension_tables']:
                # Add missing dimension tables with standard columns
                warehouse_schema['dimension_tables'][dim] = get_standard_dimension_table(dim)
        # Enhance fact tables
        for fact_table_name, fact_table_info in warehouse_schema['fact_tables'].items():
            # Ensure date dimension is linked
            if not any(fk['references']['table'] == 'date_dimension' for fk in fact_table_info['foreign_keys']):
                # Add date_id foreign key
                fact_table_info['columns'].append({'name': 'date_id', 'type': 'INT'})
                fact_table_info['foreign_keys'].append({
                    'column': 'date_id',
                    'references': {'table': 'date_dimension', 'column': 'date_id'}
                })
    # Add similar enhancements for other domains if needed
    return warehouse_schema


def generate_warehouse_schema(schema_details, domain):
    tables = {}

    for table_name, table_info in schema_details.items():
        columns_info = table_info['columns']
        constraints = table_info['constraints']
        columns = []
        primary_keys = []
        foreign_keys = []

        for col in columns_info:
            col_name = col['name']
            col_type = col['type']
            col_constraints = col['constraints'].upper()
            columns.append({'name': col_name, 'type': col_type})

            if 'PRIMARY KEY' in col_constraints:
                primary_keys.append(col_name)

            fk_match = re.search(r'REFERENCES\s+(\w+)\s*\((\w+)\)', col_constraints)
            if fk_match:
                ref_table, ref_column = fk_match.groups()
                foreign_keys.append({
                    'column': col_name,
                    'references': {'table': ref_table, 'column': ref_column}
                })

        # Process table-level constraints for primary and foreign keys
        for constraint in constraints:
            constraint_upper = constraint.upper()
            if 'PRIMARY KEY' in constraint_upper:
                pk_match = re.search(r'PRIMARY KEY\s*\((.*?)\)', constraint, re.IGNORECASE)
                if pk_match:
                    pk_columns = [col.strip() for col in pk_match.group(1).split(',')]
                    primary_keys.extend(pk_columns)
            elif 'FOREIGN KEY' in constraint_upper:
                fk_match = re.search(r'FOREIGN KEY\s*\((.*?)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)', constraint, re.IGNORECASE)
                if fk_match:
                    fk_columns = [col.strip() for col in fk_match.group(1).split(',')]
                    ref_table, ref_column = fk_match.group(2), fk_match.group(3)
                    for col_name in fk_columns:
                        foreign_keys.append({
                            'column': col_name,
                            'references': {'table': ref_table, 'column': ref_column}
                        })

        tables[table_name] = {
            'columns': columns,
            'primary_keys': list(set(primary_keys)),
            'foreign_keys': foreign_keys
        }

    # Identify dimension and fact tables
    referenced_tables = set()
    for table in tables.values():
        for fk in table['foreign_keys']:
            referenced_tables.add(fk['references']['table'])

    dimension_tables = {}
    fact_tables = {}

    for table_name, table_info in tables.items():
        fk_tables = set(fk['references']['table'] for fk in table_info['foreign_keys'])
        if fk_tables:
            # Table has foreign keys to other tables
            if len(fk_tables) >= 2:
                # References multiple tables, likely a fact table
                fact_tables[table_name] = table_info
            else:
                # References one table, could be a fact or dimension table
                if table_name in referenced_tables:
                    # Referenced by others, likely a dimension table
                    dimension_tables[table_name] = table_info
                else:
                    # Could be either, defaulting to dimension table
                    dimension_tables[table_name] = table_info
        else:
            if table_name in referenced_tables:
                # Referenced by other tables but does not reference others
                dimension_tables[table_name] = table_info
            else:
                # Standalone table, defaulting to dimension table
                dimension_tables[table_name] = table_info


        for table_name, table_info in dimension_tables.items():
                columns = table_info['columns']
                column_names = [col['name'].lower() for col in columns]
                
                # E-commerce: Combine first_name and last_name into full_name in customer_dimension
                if domain == 'E-commerce' and table_name.lower() in ['customers', 'customer_dimension']:
                    if 'first_name' in column_names and 'last_name' in column_names:
                        # Remove first_name and last_name
                        columns = [col for col in columns if col['name'].lower() not in ['first_name', 'last_name']]
                        # Add full_name
                        columns.append({'name': 'full_name', 'type': 'VARCHAR(100)'})
                        table_info['columns'] = columns
                
                # Healthcare: Combine first_name and last_name into full_name in patient and doctor dimensions
                if domain == 'Healthcare' and table_name.lower() in ['patients', 'patient_dimension', 'doctors', 'doctor_dimension']:
                    if 'first_name' in column_names and 'last_name' in column_names:
                        # Remove first_name and last_name
                        columns = [col for col in columns if col['name'].lower() not in ['first_name', 'last_name']]
                        # Add full_name
                        columns.append({'name': 'full_name', 'type': 'VARCHAR(100)'})
                        table_info['columns'] = columns
                
                # Education: Combine first_name and last_name into full_name in student dimension
                if domain == 'Education' and table_name.lower() in ['students', 'student_dimension']:
                    if 'first_name' in column_names and 'last_name' in column_names:
                        # Remove first_name and last_name
                        columns = [col for col in columns if col['name'].lower() not in ['first_name', 'last_name']]
                        # Add full_name
                        columns.append({'name': 'full_name', 'type': 'VARCHAR(100)'})
                        table_info['columns'] = columns
                
                # Finance: Handle currency and amount columns appropriately in account dimension
                if domain == 'Finance' and table_name.lower() in ['accounts', 'account_dimension']:
                    # Ensure balance is of correct type and add currency
                    if 'balance' in column_names:
                        for col in columns:
                            if col['name'].lower() == 'balance':
                                col['type'] = 'DECIMAL(15,2)'  # Adjust balance to larger decimal
                    # Add currency if not already present
                    if 'currency' not in column_names:
                        columns.append({'name': 'currency', 'type': 'VARCHAR(3)'})
                    table_info['columns'] = columns

                # Supply Chain: Add supplier and warehouse details
                if domain == 'Supply Chain' and table_name.lower() in ['suppliers', 'supplier_dimension', 'warehouses', 'warehouse_dimension']:
                    if 'address' not in column_names:
                        columns.append({'name': 'address', 'type': 'VARCHAR(255)'})
                    if 'phone' not in column_names:
                        columns.append({'name': 'phone', 'type': 'VARCHAR(20)'})
                    if 'email' not in column_names:
                        columns.append({'name': 'email', 'type': 'VARCHAR(100)'})
                    table_info['columns'] = columns
                
                # Social Media: Handle username and full name combination in user_dimension
                if domain == 'Social Media' and table_name.lower() in ['users', 'user_dimension']:
                    if 'username' not in column_names:
                        columns.append({'name': 'username', 'type': 'VARCHAR(50)'})
                    if 'first_name' in column_names and 'last_name' in column_names:
                        # Remove first_name and last_name
                        columns = [col for col in columns if col['name'].lower() not in ['first_name', 'last_name']]
                        # Add full_name
                        columns.append({'name': 'full_name', 'type': 'VARCHAR(100)'})
                    if 'location' not in column_names:
                        columns.append({'name': 'location', 'type': 'VARCHAR(100)'})
                    table_info['columns'] = columns
                
                # Common Enhancements: Add audit columns to all tables
                if 'created_at' not in column_names:
                    columns.append({'name': 'created_at', 'type': 'TIMESTAMP'})
                if 'updated_at' not in column_names:
                    columns.append({'name': 'updated_at', 'type': 'TIMESTAMP'})
                
                # Apply final column update
                table_info['columns'] = columns
    


                

    warehouse_schema = {
        'fact_tables': fact_tables,
        'dimension_tables': dimension_tables,
    }

    warehouse_schema = enhance_schema_with_domain(warehouse_schema, domain)
    return warehouse_schema


def enhance_schema_with_domain(warehouse_schema, domain):
    domain_schemas = {
        'E-commerce': {
            'fact_tables': {
                'sales': {
                    'columns': [
                        {'name': 'sale_id', 'type': 'INT'},
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'product_id', 'type': 'INT'},
                        {'name': 'customer_id', 'type': 'INT'},
                        {'name': 'quantity', 'type': 'INT'},
                        {'name': 'total_amount', 'type': 'DECIMAL(10,2)'},
                    ],
                    'primary_keys': ['sale_id'],
                    'foreign_keys': [
                        {'column': 'product_id', 'references': {'table': 'products', 'column': 'product_id'}},
                        {'column': 'customer_id', 'references': {'table': 'customers', 'column': 'customer_id'}},
                    ],
                },
            },
            'dimension_tables': {
                'products': {
                    'columns': [
                        {'name': 'product_id', 'type': 'INT'},
                        {'name': 'product_name', 'type': 'VARCHAR(100)'},
                        {'name': 'category', 'type': 'VARCHAR(50)'},
                        {'name': 'price', 'type': 'DECIMAL(10,2)'},
                    ],
                    'primary_keys': ['product_id'],
                    'foreign_keys': [],
                },
                'customers': {
                    'columns': [
                        {'name': 'customer_id', 'type': 'INT'},
                        {'name': 'first_name', 'type': 'VARCHAR(50)'},
                        {'name': 'last_name', 'type': 'VARCHAR(50)'},
                        {'name': 'email', 'type': 'VARCHAR(100)'},
                    ],
                    'primary_keys': ['customer_id'],
                    'foreign_keys': [],
                },
                'date': {
                    'columns': [
                        {'name': 'date', 'type': 'DATE'},
                        {'name': 'day', 'type': 'INT'},
                        {'name': 'month', 'type': 'INT'},
                        {'name': 'year', 'type': 'INT'},
                    ],
                    'primary_keys': ['date'],
                    'foreign_keys': [],
                },
            },
        },
        # Add similar schemas for other domains
    }

    # Get the standard schema for the domain
    standard_schema = domain_schemas.get(domain, {})

    # Compare and suggest missing tables or columns
    suggested_fact_tables = {}
    suggested_dimension_tables = {}

    # Fact tables
    for fact_table_name, fact_table_info in standard_schema.get('fact_tables', {}).items():
        if fact_table_name not in warehouse_schema['fact_tables']:
            suggested_fact_tables[fact_table_name] = fact_table_info

    # Dimension tables
    for dim_table_name, dim_table_info in standard_schema.get('dimension_tables', {}).items():
        if dim_table_name not in warehouse_schema['dimension_tables']:
            suggested_dimension_tables[dim_table_name] = dim_table_info

    # Add suggestions to the warehouse schema
    warehouse_schema['suggested_fact_tables'] = suggested_fact_tables
    warehouse_schema['suggested_dimension_tables'] = suggested_dimension_tables

    return warehouse_schema



def compare_schemas(user_schema, standard_schema):
    missing_tables = []
    missing_columns = {}

    # Check for missing tables
    for table_type in ['fact_tables', 'dimension_tables']:
        for std_table_name, std_table_info in standard_schema.get(table_type, {}).items():
            user_tables = user_schema.get(table_type, {})
            if std_table_name not in user_tables:
                missing_tables.append(std_table_name)
            else:
                # Check for missing columns
                user_columns = [col['name'].lower() for col in user_tables[std_table_name]['columns']]
                std_columns = [col['name'].lower() for col in std_table_info['columns']]
                # Map user column names to standard column names using variations
                user_columns_mapped = []
                for col in user_columns:
                    mapped = False
                    for std_col, variations in COLUMN_VARIATIONS.items():
                        if col in variations:
                            user_columns_mapped.append(std_col)
                            mapped = True
                            break
                    if not mapped:
                        user_columns_mapped.append(col)
                missing_cols = [col for col in std_columns if col not in user_columns_mapped]
                if missing_cols:
                    missing_columns[std_table_name] = missing_cols

    return missing_tables, missing_columns