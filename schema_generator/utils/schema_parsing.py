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
            table_name = table_name_match.group(1).strip().lower()
        else:
            continue

        if table_name in schema_details:
            # Table already parsed, skip to avoid duplicates
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
        seen_columns = set()
        for col in columns:
            col = col.strip()
            if col.upper().startswith(('PRIMARY KEY', 'FOREIGN KEY', 'CONSTRAINT', 'UNIQUE', 'CHECK')):
                constraints.append(col)
            else:
                # Extract column name, type, and constraints
                col_parts = re.split(r'\s+', col, maxsplit=2)
                col_name = col_parts[0].strip().lower()
                if col_name in seen_columns:
                    continue  # Skip duplicate columns
                seen_columns.add(col_name)
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
