# utils/enhancements.py
COLUMN_VARIATIONS = {
    'customer_id': ['customer_id', 'cust_id', 'c_id', 'client_id', 'user_id'],
    'product_id': ['product_id', 'prod_id', 'p_id', 'item_id', 'sku'],
    'order_id': ['order_id', 'ord_id', 'o_id', 'transaction_id', 'purchase_id'],
    'invoice_id': ['invoice_id', 'inv_id', 'bill_id', 'receipt_id'],
    'first_name': ['first_name', 'firstname', 'f_name', 'fname', 'given_name'],
    'last_name': ['last_name', 'lastname', 'l_name', 'lname', 'surname', 'family_name'],
    'full_name': ['full_name', 'fullname', 'name', 'customer_name', 'client_name'],
    'email': ['email', 'email_address', 'e_mail', 'mail'],
    'phone': ['phone', 'phone_number', 'contact_number', 'mobile', 'cell'],
    'address': ['address', 'addr', 'location', 'street_address', 'residence'],
    'quantity': ['quantity', 'qty', 'amount', 'units', 'count'],
    'price': ['price', 'cost', 'amount', 'unit_price', 'rate', 'selling_price'],
    'total_amount': ['total_amount', 'total', 'amount_due', 'total_price', 'grand_total'],
    'discount': ['discount', 'rebate', 'price_reduction', 'offer_price'],
    'tax': ['tax', 'vat', 'gst', 'sales_tax'],
    'order_date': ['order_date', 'date', 'order_timestamp', 'purchase_date'],
    'shipment_date': ['shipment_date', 'shipping_date', 'delivery_date'],
    'payment_date': ['payment_date', 'transaction_date', 'billing_date'],
    'status': ['status', 'state', 'order_status', 'transaction_status'],
    'created_at': ['created_at', 'creation_date', 'created_on', 'date_created'],
    'updated_at': ['updated_at', 'updated_on', 'modification_date', 'last_modified'],
    'dob': ['dob', 'date_of_birth', 'birth_date'],
    'age': ['age', 'customer_age', 'years_old'],
    'gender': ['gender', 'sex'],
    'salary': ['salary', 'income', 'wage', 'pay', 'earnings'],
    'balance': ['balance', 'account_balance', 'remaining_amount'],
    'interest_rate': ['interest_rate', 'rate_of_interest', 'apr'],
    'loan_amount': ['loan_amount', 'credit_amount', 'borrowed_amount'],
    'transaction_id': ['transaction_id', 'txn_id', 'tx_id', 'payment_id'],
    'ip_address': ['ip_address', 'ip', 'device_ip'],
    'user_agent': ['user_agent', 'browser_info', 'device_info'],
    # More variations can be added as needed
}

TABLE_VARIATIONS = {
    'customer_dimension': ['customer_dimension', 'customers', 'customer', 'cust_dim', 'client_dim', 'user_dim'],
    'product_dimension': ['product_dimension', 'products', 'product', 'prod_dim', 'item_dim', 'sku_dim'],
    'date_dimension': ['date_dimension', 'dates', 'date', 'time_dim', 'calendar_dim'],
    'store_dimension': ['store_dimension', 'stores', 'store', 'location_dim', 'branch_dim'],
    'sales_fact': ['sales_fact', 'sales', 'orders', 'order_items', 'order_facts', 'transactions'],
    'invoice_fact': ['invoice_fact', 'invoices', 'billing', 'bills', 'receipts'],
    'inventory_fact': ['inventory_fact', 'inventory', 'stock', 'warehouse_stock'],
    'employee_dimension': ['employee_dimension', 'employees', 'staff', 'worker_dim', 'hr_dim'],
    'shipment_fact': ['shipment_fact', 'shipments', 'delivery_fact', 'logistics_fact'],
    'supplier_dimension': ['supplier_dimension', 'suppliers', 'vendor_dimension', 'manufacturers'],
    'payment_fact': ['payment_fact', 'payments', 'transactions', 'financial_facts'],
    'loan_fact': ['loan_fact', 'loans', 'credits', 'borrowings'],
    'finance_dimension': ['finance_dimension', 'bank_accounts', 'financial_accounts'],
    'social_media_fact': ['social_media_fact', 'social_activity', 'user_interactions', 'engagement_fact'],
    'real_estate_fact': ['real_estate_fact', 'property_transactions', 'rental_facts'],
    'medical_fact': ['medical_fact', 'patient_visits', 'health_records', 'hospital_visits'],
    'ecommerce_fact': ['ecommerce_fact', 'online_orders', 'digital_sales', 'shopping_facts'],
    'marketing_dimension': ['marketing_dimension', 'ad_campaigns', 'promotion_dimension'],
    'logistics_fact': ['logistics_fact', 'transportation_fact', 'supply_chain_facts'],
    # More variations can be added as needed
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

def combine_column_names(dimension_tables):
    for table_name, table_info in dimension_tables.items():
        columns = table_info['columns']
        column_names = [col['name'].lower() for col in columns]

        # General rule to combine 'first_name' and 'last_name' into 'full_name'
        if 'first_name' in column_names and 'last_name' in column_names:
            # Remove 'first_name' and 'last_name'
            columns = [col for col in columns if col['name'].lower() not in ['first_name', 'last_name']]
            # Add 'full_name'
            columns.append({'name': 'full_name', 'type': 'VARCHAR(100)'})
            table_info['columns'] = columns

        # Common enhancements: Add audit columns to all tables
        if 'created_at' not in column_names:
            columns.append({'name': 'created_at', 'type': 'TIMESTAMP'})
        if 'updated_at' not in column_names:
            columns.append({'name': 'updated_at', 'type': 'TIMESTAMP'})
        table_info['columns'] = columns

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

    # Create a mapping from user table names to standard table names
    user_tables_all = {**warehouse_schema.get('fact_tables', {}), **warehouse_schema.get('dimension_tables', {})}
    user_table_name_mapping = {}
    for std_table_name, variations in TABLE_VARIATIONS.items():
        for user_table_name in user_tables_all.keys():
            if user_table_name.lower() in variations:
                user_table_name_mapping[std_table_name] = user_table_name
                break

    # Check for missing tables
    for table_type in ['fact_tables', 'dimension_tables']:
        std_tables = standard_schema.get(table_type, {})
        for std_table_name, std_table_info in std_tables.items():
            user_table_name = user_table_name_mapping.get(std_table_name)
            if user_table_name:
                # Table exists, check for missing columns
                user_table = warehouse_schema.get('fact_tables', {}).get(user_table_name) or warehouse_schema.get('dimension_tables', {}).get(user_table_name)
                user_columns = {col['name'].lower() for col in user_table['columns']}
                std_columns = {col['name'].lower() for col in std_table_info['columns']}
                missing_cols = std_columns - user_columns
                if missing_cols:
                    missing_columns[std_table_name] = list(missing_cols)
            else:
                # Table is missing
                missing_tables.append(std_table_name)

    return warehouse_schema, missing_tables, missing_columns
