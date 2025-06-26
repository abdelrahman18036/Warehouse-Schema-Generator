"""
Data Processing Utilities for Schema Generation
Handles SQL to JSON conversion and dataset operations
"""

import re
import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_sql_to_json(sql_file_path: str) -> Dict:
    """Parse SQL file to JSON schema format"""
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
    except Exception as e:
        logger.error(f"Error reading SQL file {sql_file_path}: {e}")
        return {}
    
    # Remove comments and normalize whitespace
    sql_content = re.sub(r'--.*?\n', '\n', sql_content)
    sql_content = re.sub(r'/\*.*?\*/', '', sql_content, flags=re.DOTALL)
    sql_content = ' '.join(sql_content.split())
    
    # Extract CREATE TABLE statements
    create_statements = re.findall(
        r'CREATE\s+TABLE\s+[^;]+;', 
        sql_content, 
        re.IGNORECASE | re.DOTALL
    )
    
    schema_json = {}
    
    for statement in create_statements:
        table_info = parse_create_table_statement(statement)
        if table_info:
            table_name, columns, constraints = table_info
            schema_json[table_name] = {
                'columns': columns,
                'table_constraints': constraints
            }
    
    # Extract domain from filename
    filename = Path(sql_file_path).stem
    domain = extract_domain_from_filename(filename)
    schema_json['domain'] = domain
    
    return schema_json

def parse_create_table_statement(statement: str) -> Optional[Tuple[str, List[Dict], List[str]]]:
    """Parse a single CREATE TABLE statement"""
    # Extract table name
    table_match = re.match(r'CREATE\s+TABLE\s+(\w+)', statement, re.IGNORECASE)
    if not table_match:
        return None
    
    table_name = table_match.group(1).lower()
    
    # Extract content between parentheses
    paren_match = re.search(r'\((.*)\)', statement, re.DOTALL)
    if not paren_match:
        return None
    
    content = paren_match.group(1)
    
    # Split into individual column/constraint definitions
    definitions = split_definitions(content)
    
    columns = []
    constraints = []
    
    for definition in definitions:
        definition = definition.strip()
        if not definition:
            continue
            
        # Check if it's a table constraint
        if is_table_constraint(definition):
            constraints.append(definition)
        else:
            # Parse as column definition
            column_info = parse_column_definition(definition)
            if column_info:
                columns.append(column_info)
    
    return table_name, columns, constraints

def split_definitions(content: str) -> List[str]:
    """Split column/constraint definitions, handling nested parentheses"""
    definitions = []
    current_def = ""
    paren_count = 0
    
    for char in content:
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
        elif char == ',' and paren_count == 0:
            definitions.append(current_def.strip())
            current_def = ""
            continue
        
        current_def += char
    
    if current_def.strip():
        definitions.append(current_def.strip())
    
    return definitions

def is_table_constraint(definition: str) -> bool:
    """Check if definition is a table-level constraint"""
    constraint_keywords = [
        'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 
        'CONSTRAINT', 'INDEX', 'KEY'
    ]
    
    definition_upper = definition.upper()
    return any(keyword in definition_upper for keyword in constraint_keywords)

def parse_column_definition(definition: str) -> Optional[Dict]:
    """Parse a column definition"""
    parts = definition.split()
    if len(parts) < 2:
        return None
    
    column_name = parts[0].lower()
    
    # Extract data type (handle types with parameters like VARCHAR(255))
    data_type = extract_data_type(definition)
    
    # Extract constraints
    constraints = extract_column_constraints(definition)
    
    return {
        'name': column_name,
        'type': data_type,
        'constraints': constraints
    }

def extract_data_type(definition: str) -> str:
    """Extract data type from column definition"""
    # Pattern to match data type with optional parameters
    type_pattern = r'\w+\s+(\w+(?:\([^)]+\))?)'
    match = re.search(type_pattern, definition, re.IGNORECASE)
    
    if match:
        return match.group(1)
    
    # Fallback to second word if pattern doesn't match
    parts = definition.split()
    return parts[1] if len(parts) > 1 else 'VARCHAR(255)'

def extract_column_constraints(definition: str) -> List[str]:
    """Extract constraints from column definition"""
    constraints = []
    definition_upper = definition.upper()
    
    # Check for various constraints
    constraint_patterns = {
        'PRIMARY KEY': r'\bPRIMARY\s+KEY\b',
        'NOT NULL': r'\bNOT\s+NULL\b',
        'UNIQUE': r'\bUNIQUE\b',
        'AUTO_INCREMENT': r'\b(?:AUTO_INCREMENT|AUTOINCREMENT|SERIAL)\b',
    }
    
    for constraint_name, pattern in constraint_patterns.items():
        if re.search(pattern, definition_upper):
            constraints.append(constraint_name)
    
    # Check for DEFAULT values
    default_match = re.search(r'\bDEFAULT\s+([^,\s]+(?:\s+[^,\s]+)*)', definition_upper)
    if default_match:
        constraints.append(f'DEFAULT {default_match.group(1)}')
    
    # Check for FOREIGN KEY references
    fk_match = re.search(r'\bREFERENCES\s+(\w+)', definition_upper)
    if fk_match:
        constraints.append(f'FOREIGN KEY REFERENCES {fk_match.group(1).lower()}')
    
    # Check for CHECK constraints
    check_match = re.search(r'\bCHECK\s*\([^)]+\)', definition_upper)
    if check_match:
        constraints.append('CHECK')
    
    return constraints

def extract_domain_from_filename(filename: str) -> str:
    """Extract domain from filename"""
    domain_mapping = {
        'ecommerce': 'E-commerce',
        'healthcare': 'Healthcare', 
        'education': 'Education',
        'finance': 'Finance',
        'store': 'Retail',
        'hotel': 'Real Estate',
        'restaurant': 'Retail',
        'social': 'Social Media',
        'supply': 'Supply Chain',
        'cyber': 'Cybersecurity',
        'telecom': 'Telecommunications'
    }
    
    filename_lower = filename.lower()
    for key, domain in domain_mapping.items():
        if key in filename_lower:
            return domain
    
    return 'E-commerce'  # Default domain

def batch_process_sql_files(directory: str) -> List[Dict]:
    """Process all SQL files in a directory"""
    sql_files = Path(directory).glob("*.sql")
    schemas = []
    
    for sql_file in sql_files:
        try:
            schema_json = parse_sql_to_json(str(sql_file))
            if schema_json:
                schema_json['source_file'] = sql_file.name
                schemas.append(schema_json)
                logger.info(f"Processed {sql_file.name}")
        except Exception as e:
            logger.error(f"Error processing {sql_file}: {e}")
    
    return schemas

def save_schemas_to_json(schemas: List[Dict], output_file: str):
    """Save schemas to JSON file"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(schemas, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(schemas)} schemas to {output_file}")
    except Exception as e:
        logger.error(f"Error saving schemas to {output_file}: {e}")

def load_schemas_from_json(input_file: str) -> List[Dict]:
    """Load schemas from JSON file"""
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            schemas = json.load(f)
        logger.info(f"Loaded {len(schemas)} schemas from {input_file}")
        return schemas
    except Exception as e:
        logger.error(f"Error loading schemas from {input_file}: {e}")
        return []

def create_training_dataset(schemas: List[Dict], output_dir: str):
    """Create training dataset from schemas"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Separate by domain for balanced training
    domain_schemas = {}
    for schema in schemas:
        domain = schema.get('domain', 'Unknown')
        if domain not in domain_schemas:
            domain_schemas[domain] = []
        domain_schemas[domain].append(schema)
    
    # Save domain-specific datasets
    for domain, domain_schema_list in domain_schemas.items():
        domain_file = output_path / f"{domain.lower().replace(' ', '_')}_schemas.json"
        save_schemas_to_json(domain_schema_list, str(domain_file))
    
    # Create overall statistics
    stats = {
        'total_schemas': len(schemas),
        'domains': {domain: len(schema_list) for domain, schema_list in domain_schemas.items()},
        'avg_tables_per_schema': calculate_avg_tables(schemas),
        'avg_columns_per_table': calculate_avg_columns(schemas)
    }
    
    stats_file = output_path / "dataset_statistics.json"
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    logger.info(f"Created training dataset in {output_dir}")
    return stats

def calculate_avg_tables(schemas: List[Dict]) -> float:
    """Calculate average number of tables per schema"""
    if not schemas:
        return 0.0
    
    table_counts = []
    for schema in schemas:
        table_count = len([k for k in schema.keys() if k not in ['domain', 'source_file']])
        table_counts.append(table_count)
    
    return sum(table_counts) / len(table_counts)

def calculate_avg_columns(schemas: List[Dict]) -> float:
    """Calculate average number of columns per table"""
    if not schemas:
        return 0.0
    
    column_counts = []
    for schema in schemas:
        for table_name, table_info in schema.items():
            if table_name in ['domain', 'source_file']:
                continue
            if isinstance(table_info, dict) and 'columns' in table_info:
                column_counts.append(len(table_info['columns']))
    
    return sum(column_counts) / len(column_counts) if column_counts else 0.0

def validate_schema_json(schema: Dict) -> Tuple[bool, List[str]]:
    """Validate schema JSON format"""
    errors = []
    
    # Check basic structure
    if not isinstance(schema, dict):
        errors.append("Schema must be a dictionary")
        return False, errors
    
    # Check for domain
    if 'domain' not in schema:
        errors.append("Schema must have a 'domain' field")
    
    # Validate tables
    table_count = 0
    for table_name, table_info in schema.items():
        if table_name in ['domain', 'source_file']:
            continue
            
        table_count += 1
        
        if not isinstance(table_info, dict):
            errors.append(f"Table '{table_name}' must be a dictionary")
            continue
        
        if 'columns' not in table_info:
            errors.append(f"Table '{table_name}' must have 'columns' field")
            continue
        
        if not isinstance(table_info['columns'], list):
            errors.append(f"Table '{table_name}' columns must be a list")
            continue
        
        # Validate columns
        for i, column in enumerate(table_info['columns']):
            if not isinstance(column, dict):
                errors.append(f"Column {i} in table '{table_name}' must be a dictionary")
                continue
            
            required_fields = ['name', 'type']
            for field in required_fields:
                if field not in column:
                    errors.append(f"Column {i} in table '{table_name}' missing '{field}'")
    
    if table_count == 0:
        errors.append("Schema must contain at least one table")
    
    return len(errors) == 0, errors

def convert_to_bert_training_format(schemas: List[Dict]) -> List[Dict]:
    """Convert schemas to BERT training format"""
    training_data = []
    
    for schema in schemas:
        # Create text representation
        text_parts = []
        domain = schema.get('domain', 'Unknown')
        
        for table_name, table_info in schema.items():
            if table_name in ['domain', 'source_file']:
                continue
                
            text_parts.append(f"Table: {table_name}")
            
            if isinstance(table_info, dict) and 'columns' in table_info:
                for column in table_info['columns']:
                    col_text = f"Column: {column['name']} Type: {column['type']}"
                    if column.get('constraints'):
                        col_text += f" Constraints: {', '.join(column['constraints'])}"
                    text_parts.append(col_text)
        
        training_example = {
            'text': ' '.join(text_parts),
            'label': domain,
            'schema': schema
        }
        training_data.append(training_example)
    
    return training_data 