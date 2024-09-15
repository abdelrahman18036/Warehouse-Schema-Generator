# enhancements.py

TABLE_VARIATIONS = {
    'customer_dimension': ['customer_dimension', 'customers', 'customer', 'cust_dim'],
    'product_dimension': ['product_dimension', 'products', 'product', 'prod_dim'],
    'date_dimension': ['date_dimension', 'dates', 'date', 'time_dim'],
    'store_dimension': ['store_dimension', 'stores', 'store', 'location_dim'],
    'sales_fact': ['sales_fact', 'sales', 'orders', 'order_items', 'order_facts'],
}

COLUMN_VARIATIONS = {
    'customer_id': ['customer_id', 'cust_id', 'c_id'],
    'product_id': ['product_id', 'prod_id', 'p_id'],
    'order_id': ['order_id', 'ord_id', 'o_id'],
    'first_name': ['first_name', 'firstname', 'f_name', 'fname'],
    'last_name': ['last_name', 'lastname', 'l_name', 'lname'],
    'full_name': ['full_name', 'fullname', 'name'],
    'email': ['email', 'email_address', 'e_mail'],
    'phone': ['phone', 'phone_number', 'contact_number'],
    'quantity': ['quantity', 'qty', 'amount'],
    'price': ['price', 'cost', 'amount'],
    'total_amount': ['total_amount', 'total', 'amount_due', 'total_price'],
    'order_date': ['order_date', 'date', 'order_timestamp'],
    'created_at': ['created_at', 'creation_date', 'created_on'],
    'updated_at': ['updated_at', 'updated_on', 'modification_date'],
}

def standardize_column_names(tables):
    for table_info in tables.values():
        for column in table_info['columns']:
            original_name = column['name'].lower()
            standardized_name = get_standard_column_name(original_name)
            column['name'] = standardized_name

def get_standard_column_name(column_name):
    for std_col, variations in COLUMN_VARIATIONS.items():
        if column_name in variations:
            return std_col
    return column_name  # Return the original if no match is found

def enhance_schema_with_domain(warehouse_schema, domain):
    """
    Identify missing tables and columns based on the domain-specific standard schema
    without modifying the user's warehouse schema.
    """
    from .standard_schemas import get_standard_schema_for_domain

    standard_schema = get_standard_schema_for_domain(domain)
    if not standard_schema:
        return warehouse_schema, [], {}  # No standard schema available

    missing_tables = []
    missing_columns = {}

    # Check for missing dimension tables
    for std_dim_name, std_dim_info in standard_schema.get('dimension_tables', {}).items():
        if std_dim_name not in warehouse_schema['dimension_tables']:
            missing_tables.append(std_dim_name)
        else:
            # Check for missing columns in existing dimension tables
            user_columns = {col['name'].lower() for col in warehouse_schema['dimension_tables'][std_dim_name]['columns']}
            std_columns = {col['name'].lower() for col in std_dim_info['columns']}
            missing_cols = std_columns - user_columns
            if missing_cols:
                missing_columns[std_dim_name] = list(missing_cols)

    # Check for missing fact tables
    for std_fact_name, std_fact_info in standard_schema.get('fact_tables', {}).items():
        if std_fact_name not in warehouse_schema['fact_tables']:
            missing_tables.append(std_fact_name)
        else:
            # Check for missing columns in existing fact tables
            user_columns = {col['name'].lower() for col in warehouse_schema['fact_tables'][std_fact_name]['columns']}
            std_columns = {col['name'].lower() for col in std_fact_info['columns']}
            missing_cols = std_columns - user_columns
            if missing_cols:
                missing_columns[std_fact_name] = list(missing_cols)

    return warehouse_schema, missing_tables, missing_columns

def combine_column_names(dimension_tables):
    for table_name, table_info in dimension_tables.items():
        columns = table_info['columns']
        column_names = [col['name'].lower() for col in columns]

        if 'first_name' in column_names and 'last_name' in column_names:
            columns = [col for col in columns if col['name'].lower() not in ['first_name', 'last_name']]
            columns.append({'name': 'full_name', 'type': 'VARCHAR(100)'})
            table_info['columns'] = columns

        if 'created_at' not in column_names:
            columns.append({'name': 'created_at', 'type': 'TIMESTAMP'})
        if 'updated_at' not in column_names:
            columns.append({'name': 'updated_at', 'type': 'TIMESTAMP'})
        table_info['columns'] = columns
