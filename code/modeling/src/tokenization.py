"""
Advanced Tokenization System for Schema Processing
Provides realistic tokenization and text processing capabilities
"""

import re
import random
import string
from typing import Dict, List, Tuple, Optional
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchemaTokenizer:
    """Advanced tokenization for database schema processing"""
    
    def __init__(self):
        self.domain_vocabulary = self._build_domain_vocabulary()
        self.sql_keywords = self._get_sql_keywords()
        self.data_type_mappings = self._get_data_type_mappings()
        
    def _build_domain_vocabulary(self) -> Dict:
        """Build vocabulary for different domains"""
        return {
            "E-commerce": {
                "entities": ["customer", "product", "order", "cart", "payment", "shipment", "category", "inventory"],
                "attributes": ["price", "quantity", "discount", "tax", "sku", "rating", "review", "status"],
                "relationships": ["purchases", "contains", "belongs_to", "ships_to", "categorized_as"]
            },
            "Healthcare": {
                "entities": ["patient", "doctor", "appointment", "prescription", "medication", "diagnosis", "treatment"],
                "attributes": ["dosage", "frequency", "duration", "symptoms", "allergies", "insurance", "specialty"],
                "relationships": ["treats", "prescribes", "diagnoses", "schedules", "refers_to"]
            },
            "Education": {
                "entities": ["student", "course", "instructor", "enrollment", "grade", "assignment", "exam"],
                "attributes": ["gpa", "credits", "semester", "major", "department", "schedule", "attendance"],
                "relationships": ["enrolls_in", "teaches", "grades", "assigns", "completes"]
            },
            "Finance": {
                "entities": ["account", "transaction", "customer", "loan", "investment", "portfolio", "branch"],
                "attributes": ["balance", "interest_rate", "credit_score", "risk_level", "maturity_date"],
                "relationships": ["owns", "transfers", "invests_in", "borrows", "manages"]
            }
        }
    
    def _get_sql_keywords(self) -> List[str]:
        """Get common SQL keywords for tokenization"""
        return [
            "CREATE", "TABLE", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "NOT", "NULL",
            "UNIQUE", "CHECK", "DEFAULT", "AUTO_INCREMENT", "SERIAL", "INTEGER", "VARCHAR",
            "DECIMAL", "TIMESTAMP", "BOOLEAN", "TEXT", "INDEX", "CONSTRAINT"
        ]
    
    def _get_data_type_mappings(self) -> Dict:
        """Get realistic data type mappings"""
        return {
            "id_fields": ["SERIAL", "INTEGER", "BIGINT"],
            "text_fields": ["VARCHAR(255)", "VARCHAR(100)", "TEXT"],
            "numeric_fields": ["DECIMAL(10,2)", "INTEGER", "FLOAT"],
            "date_fields": ["TIMESTAMP", "DATE", "DATETIME"],
            "boolean_fields": ["BOOLEAN", "TINYINT(1)"],
            "email_fields": ["VARCHAR(255)"],
            "phone_fields": ["VARCHAR(20)"],
            "currency_fields": ["DECIMAL(10,2)", "DECIMAL(15,2)"]
        }
    
    def tokenize_schema_text(self, schema_text: str) -> List[str]:
        """Tokenize schema text into meaningful tokens"""
        # Normalize text
        text = schema_text.lower()
        
        # Split by common delimiters
        tokens = re.split(r'[,\s\(\)\[\]\{\}]+', text)
        
        # Filter out empty tokens and normalize
        tokens = [token.strip() for token in tokens if token.strip()]
        
        # Add domain-specific context
        enriched_tokens = self._enrich_tokens(tokens)
        
        return enriched_tokens
    
    def _enrich_tokens(self, tokens: List[str]) -> List[str]:
        """Enrich tokens with domain-specific context"""
        enriched = []
        
        for token in tokens:
            enriched.append(token)
            
            # Add semantic tags
            if self._is_entity_name(token):
                enriched.append(f"<ENTITY:{token}>")
            elif self._is_attribute_name(token):
                enriched.append(f"<ATTR:{token}>")
            elif token.upper() in self.sql_keywords:
                enriched.append(f"<SQL:{token.upper()}>")
        
        return enriched
    
    def _is_entity_name(self, token: str) -> bool:
        """Check if token represents an entity name"""
        entity_indicators = ["table", "customer", "product", "order", "user", "account"]
        return any(indicator in token for indicator in entity_indicators)
    
    def _is_attribute_name(self, token: str) -> bool:
        """Check if token represents an attribute name"""
        attr_indicators = ["id", "name", "email", "date", "amount", "price", "quantity"]
        return any(indicator in token for indicator in attr_indicators)
    
    def generate_realistic_names(self, base_name: str, count: int = 5) -> List[str]:
        """Generate realistic variations of a name"""
        variations = [base_name]
        
        # Add common prefixes/suffixes
        prefixes = ["user_", "customer_", "order_", "product_", ""]
        suffixes = ["_id", "_name", "_code", "_data", "_info", ""]
        
        for _ in range(count - 1):
            prefix = random.choice(prefixes)
            suffix = random.choice(suffixes)
            variation = f"{prefix}{base_name}{suffix}"
            if variation not in variations:
                variations.append(variation)
        
        return variations[:count]
    
    def enhance_column_names(self, columns: List[Dict]) -> List[Dict]:
        """Enhance column names for more realistic output"""
        enhanced_columns = []
        
        for col in columns:
            enhanced_col = col.copy()
            original_name = col["name"]
            
            # Apply naming conventions
            enhanced_name = self._apply_naming_conventions(original_name)
            enhanced_col["name"] = enhanced_name
            
            # Enhance data types
            enhanced_type = self._enhance_data_type(original_name, col.get("type", "VARCHAR(255)"))
            enhanced_col["type"] = enhanced_type
            
            # Add realistic constraints
            enhanced_constraints = self._add_realistic_constraints(enhanced_name, col.get("constraints", []))
            enhanced_col["constraints"] = enhanced_constraints
            
            enhanced_columns.append(enhanced_col)
        
        return enhanced_columns
    
    def _apply_naming_conventions(self, name: str) -> str:
        """Apply consistent naming conventions"""
        # Convert to snake_case
        name = re.sub(r'([A-Z])', r'_\1', name).lower()
        name = re.sub(r'^_', '', name)  # Remove leading underscore
        
        # Standardize common patterns
        replacements = {
            "firstname": "first_name",
            "lastname": "last_name",
            "phonenumber": "phone_number",
            "emailaddress": "email_address",
            "createdat": "created_at",
            "updatedat": "updated_at"
        }
        
        for old, new in replacements.items():
            if old in name.lower():
                name = name.replace(old, new)
        
        return name
    
    def _enhance_data_type(self, column_name: str, original_type: str) -> str:
        """Enhance data type based on column name and context"""
        name_lower = column_name.lower()
        
        # Map common patterns to appropriate types
        if "id" in name_lower and name_lower.endswith("id"):
            return random.choice(self.data_type_mappings["id_fields"])
        elif "email" in name_lower:
            return "VARCHAR(255)"
        elif "phone" in name_lower:
            return "VARCHAR(20)"
        elif any(word in name_lower for word in ["price", "amount", "cost", "fee"]):
            return random.choice(self.data_type_mappings["currency_fields"])
        elif any(word in name_lower for word in ["date", "time", "created", "updated"]):
            return random.choice(self.data_type_mappings["date_fields"])
        elif any(word in name_lower for word in ["count", "quantity", "number", "age"]):
            return "INTEGER"
        elif any(word in name_lower for word in ["active", "enabled", "verified", "deleted"]):
            return "BOOLEAN"
        else:
            return original_type
    
    def _add_realistic_constraints(self, column_name: str, existing_constraints: List[str]) -> List[str]:
        """Add realistic constraints based on column name"""
        constraints = existing_constraints.copy()
        name_lower = column_name.lower()
        
        # Add NOT NULL for important fields
        important_fields = ["id", "email", "name", "created_at"]
        if any(field in name_lower for field in important_fields):
            if "NOT NULL" not in constraints:
                constraints.append("NOT NULL")
        
        # Add UNIQUE for certain fields
        unique_fields = ["email", "username", "phone"]
        if any(field in name_lower for field in unique_fields):
            if "UNIQUE" not in constraints and "PRIMARY KEY" not in ' '.join(constraints):
                constraints.append("UNIQUE")
        
        # Add DEFAULT for timestamp fields
        if "created_at" in name_lower:
            if not any("DEFAULT" in constraint for constraint in constraints):
                constraints.append("DEFAULT CURRENT_TIMESTAMP")
        
        return constraints
    
    def generate_sample_data(self, schema: Dict, num_rows: int = 5) -> Dict:
        """Generate sample data for testing"""
        sample_data = {}
        
        for table_name, table_info in schema.items():
            if table_name == 'domain':
                continue
                
            if isinstance(table_info, dict) and "columns" in table_info:
                table_data = []
                
                for i in range(num_rows):
                    row = {}
                    for col in table_info["columns"]:
                        row[col["name"]] = self._generate_sample_value(col)
                    table_data.append(row)
                
                sample_data[table_name] = table_data
        
        return sample_data
    
    def _generate_sample_value(self, column: Dict):
        """Generate sample value for a column"""
        col_name = column["name"].lower()
        col_type = column["type"].upper()
        
        if "id" in col_name and col_name.endswith("id"):
            return random.randint(1, 1000)
        elif "email" in col_name:
            domains = ["gmail.com", "yahoo.com", "company.com"]
            username = ''.join(random.choices(string.ascii_lowercase, k=8))
            return f"{username}@{random.choice(domains)}"
        elif "name" in col_name:
            if "first" in col_name:
                return random.choice(["John", "Jane", "Michael", "Sarah", "David"])
            elif "last" in col_name:
                return random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones"])
            else:
                return random.choice(["Product A", "Service B", "Item C"])
        elif "phone" in col_name:
            return f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
        elif any(word in col_name for word in ["price", "amount", "cost"]):
            return round(random.uniform(10.0, 1000.0), 2)
        elif "date" in col_name or "TIMESTAMP" in col_type:
            return "2024-01-15 10:30:00"
        elif "BOOLEAN" in col_type:
            return random.choice([True, False])
        elif "INTEGER" in col_type:
            return random.randint(1, 100)
        else:
            return f"Sample {random.randint(1, 100)}"
    
    def create_documentation(self, schema: Dict) -> str:
        """Create human-readable documentation"""
        doc_parts = []
        
        domain = schema.get('domain', 'Unknown')
        doc_parts.append(f"# Database Schema Documentation")
        doc_parts.append(f"**Domain:** {domain}")
        doc_parts.append("")
        
        for table_name, table_info in schema.items():
            if table_name == 'domain':
                continue
                
            doc_parts.append(f"## Table: {table_name}")
            
            if isinstance(table_info, dict) and "columns" in table_info:
                doc_parts.append("| Column | Type | Constraints |")
                doc_parts.append("|--------|------|-------------|")
                
                for col in table_info["columns"]:
                    constraints = ", ".join(col.get("constraints", []))
                    doc_parts.append(f"| {col['name']} | {col['type']} | {constraints} |")
                
                doc_parts.append("")
        
        return "\n".join(doc_parts)

# Utility functions
def tokenize_sql_schema(sql_content: str) -> List[str]:
    """Tokenize SQL schema content"""
    tokenizer = SchemaTokenizer()
    return tokenizer.tokenize_schema_text(sql_content)

def enhance_schema_for_realism(schema: Dict) -> Dict:
    """Enhance schema to make it more realistic"""
    tokenizer = SchemaTokenizer()
    enhanced_schema = schema.copy()
    
    for table_name, table_info in enhanced_schema.items():
        if table_name == 'domain':
            continue
            
        if isinstance(table_info, dict) and "columns" in table_info:
            enhanced_columns = tokenizer.enhance_column_names(table_info["columns"])
            table_info["columns"] = enhanced_columns
    
    return enhanced_schema 