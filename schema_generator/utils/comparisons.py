# comparisons.py

from .enhancements import COLUMN_VARIATIONS, TABLE_VARIATIONS

def compare_schemas(user_schema, standard_schema):
    missing_tables = []
    missing_columns = {}

    # Create a mapping from user table names to standard table names
    user_table_name_mapping = {}
    user_tables_all = {**user_schema.get('fact_tables', {}), **user_schema.get('dimension_tables', {})}

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
                user_table = user_schema.get('fact_tables', {}).get(user_table_name) or user_schema.get('dimension_tables', {}).get(user_table_name)
                user_columns = {col['name'].lower() for col in user_table['columns']}
                std_columns = {col['name'].lower() for col in std_table_info['columns']}
                missing_cols = std_columns - user_columns
                if missing_cols:
                    missing_columns[std_table_name] = list(missing_cols)
            else:
                # Table is missing
                missing_tables.append(std_table_name)

    return missing_tables, missing_columns
