#schema_generation.py

import re
from .enhancements import enhance_schema_with_domain, standardize_column_names, combine_column_names

def generate_warehouse_schema(schema_details, domain):
    tables = parse_tables(schema_details)
    standardize_column_names(tables)
    fact_tables, dimension_tables = identify_tables(tables)
    combine_column_names(dimension_tables)
    warehouse_schema = {
        'fact_tables': fact_tables,
        'dimension_tables': dimension_tables,
    }
    warehouse_schema, missing_tables, missing_columns = enhance_schema_with_domain(warehouse_schema, domain)
    return warehouse_schema, missing_tables, missing_columns


def parse_tables(schema_details):
    tables = {}
    for table_name, table_info in schema_details.items():
        columns, primary_keys, foreign_keys = parse_columns_and_constraints(table_info)
        tables[table_name] = {
            'columns': columns,
            'primary_keys': list(set(primary_keys)),
            'foreign_keys': foreign_keys
        }
    return tables


def parse_columns_and_constraints(table_info):
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

    primary_keys.extend(parse_primary_keys(constraints))
    foreign_keys.extend(parse_foreign_keys(constraints))

    return columns, primary_keys, foreign_keys

def parse_primary_keys(constraints):
    primary_keys = []
    for constraint in constraints:
        constraint_upper = constraint.upper()
        if 'PRIMARY KEY' in constraint_upper:
            pk_match = re.search(r'PRIMARY KEY\s*\((.*?)\)', constraint, re.IGNORECASE)
            if pk_match:
                pk_columns = [col.strip() for col in pk_match.group(1).split(',')]
                primary_keys.extend(pk_columns)
    return primary_keys

def parse_foreign_keys(constraints):
    foreign_keys = []
    for constraint in constraints:
        constraint_upper = constraint.upper()
        if 'FOREIGN KEY' in constraint_upper:
            fk_match = re.search(r'FOREIGN KEY\s*\((.*?)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)', constraint, re.IGNORECASE)
            if fk_match:
                fk_columns = [col.strip() for col in fk_match.group(1).split(',')]
                ref_table, ref_column = fk_match.group(2), fk_match.group(3)
                for col_name in fk_columns:
                    foreign_keys.append({
                        'column': col_name,
                        'references': {'table': ref_table, 'column': ref_column}
                    })
    return foreign_keys

def identify_tables(tables):
    referenced_tables = set()
    for table in tables.values():
        for fk in table['foreign_keys']:
            referenced_tables.add(fk['references']['table'])

    dimension_tables = {}
    fact_tables = {}

    for table_name, table_info in tables.items():
        fk_tables = set(fk['references']['table'] for fk in table_info['foreign_keys'])
        if len(fk_tables) >= 2:
            fact_tables[table_name] = table_info
        else:
            dimension_tables[table_name] = table_info

    return fact_tables, dimension_tables



