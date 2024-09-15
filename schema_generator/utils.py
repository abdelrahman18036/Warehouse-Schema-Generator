import sqlparse

# schema_generator/utils.py
import re

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


# schema_generator/utils.py

def generate_warehouse_schema(schema_details):
    tables = {}

    # Process each table to extract columns, primary keys, and foreign keys
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

    return {
        'fact_tables': fact_tables,
        'dimension_tables': dimension_tables
    }
