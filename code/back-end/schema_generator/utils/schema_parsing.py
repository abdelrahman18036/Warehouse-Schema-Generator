# utils/schema_parsing.py

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
        # Split columns, handling nested parentheses more carefully
        columns = []
        paren_level = 0
        current_col = ''
        i = 0
        while i < len(column_defs):
            char = column_defs[i]
            if char == '(':
                paren_level += 1
            elif char == ')':
                paren_level -= 1
            
            if char == ',' and paren_level == 0:
                columns.append(current_col.strip())
                current_col = ''
            else:
                current_col += char
            i += 1
        
        if current_col.strip():
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
                # Parse column definition more carefully
                col_name = ''
                col_type = ''
                col_constraints = []
                
                # Split the column definition
                words = col.split()
                if len(words) >= 2:
                    col_name = words[0].strip().lower()
                    
                    # Handle data types with parentheses (e.g., DECIMAL(10,2))
                    if '(' in col and ')' in col:
                        # Find the complete type including parentheses
                        type_match = re.search(r'(\w+\([^)]+\))', col)
                        if type_match:
                            col_type = type_match.group(1)
                        else:
                            col_type = words[1]
                    else:
                        col_type = words[1]
                    
                    # Extract constraints
                    remaining_text = col.replace(col_name, '').replace(col_type, '').strip()
                    
                    # Check for common constraints
                    if re.search(r'\bPRIMARY\s+KEY\b', remaining_text, re.IGNORECASE):
                        col_constraints.append('PRIMARY KEY')
                    if re.search(r'\bNOT\s+NULL\b', remaining_text, re.IGNORECASE):
                        col_constraints.append('NOT NULL')
                    if re.search(r'\bUNIQUE\b', remaining_text, re.IGNORECASE):
                        col_constraints.append('UNIQUE')
                    if re.search(r'\bAUTO_INCREMENT\b|\bAUTOINCREMENT\b|\bSERIAL\b', remaining_text, re.IGNORECASE):
                        col_constraints.append('AUTO_INCREMENT')
                    if re.search(r'\bDEFAULT\b', remaining_text, re.IGNORECASE):
                        default_match = re.search(r'DEFAULT\s+([^\s,]+)', remaining_text, re.IGNORECASE)
                        if default_match:
                            col_constraints.append(f'DEFAULT {default_match.group(1)}')
                    if re.search(r'\bCHECK\b', remaining_text, re.IGNORECASE):
                        col_constraints.append('CHECK')
                    if re.search(r'\bREFERENCES\s+(\w+)', remaining_text, re.IGNORECASE):
                        ref_match = re.search(r'REFERENCES\s+(\w+)', remaining_text, re.IGNORECASE)
                        if ref_match:
                            col_constraints.append(f'FOREIGN KEY REFERENCES {ref_match.group(1)}')
                    
                    if col_name and col_name not in seen_columns:
                        seen_columns.add(col_name)
                        columns_info.append({
                            'name': col_name,
                            'type': col_type,
                            'constraints': col_constraints
                        })

        # Process table-level constraints and apply them to columns
        for constraint in constraints:
            if re.search(r'FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)', constraint, re.IGNORECASE):
                fk_match = re.search(r'FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)', constraint, re.IGNORECASE)
                if fk_match:
                    fk_column = fk_match.group(1).lower()
                    ref_table = fk_match.group(2).lower()
                    # Find the column and add the foreign key constraint
                    for col_info in columns_info:
                        if col_info['name'] == fk_column:
                            if 'FOREIGN KEY' not in ' '.join(col_info['constraints']):
                                col_info['constraints'].append(f'FOREIGN KEY REFERENCES {ref_table}')

        schema_details[table_name] = {
            'columns': columns_info,
            'constraints': constraints
        }

    return schema_details
