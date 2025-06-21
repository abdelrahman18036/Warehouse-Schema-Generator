import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
import re
import time
# from langchain.chat_models import ChatOpenAI
# from langchain.schema import AIMessage, HumanMessage, SystemMessage
# from langchain.memory import ConversationBufferMemory
# from langchain.chains import ConversationChain
# Load API key from .env file
load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')
#"AIzaSyAGfUybsz_GLXkpllVS5RFdoWg_y-k7XNs"
#"AIzaSyB58hL3-9XoxgG5MpAALxPY0lk3WLVReI4"
# Configure Google Generative AI
genai.configure(api_key=API_KEY)

# Initialize the model
model = genai.GenerativeModel("gemini-2.0-flash")

def generate_text(prompt, max_retries=3, delay=1):
    """
    Generates text using Google's Gemini AI model with the given prompt.
    
    Args:
        prompt (str): The text prompt to send to the AI model
        max_retries (int): Maximum number of retry attempts if the API call fails
        delay (int): Seconds to wait between retries
        
    Returns:
        str: The generated text response or empty string on failure
    """
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text if response else ""
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"API call failed (attempt {attempt+1}/{max_retries}): {e}")
                time.sleep(delay)
            else:
                print(f"All retry attempts failed: {e}")
                return ""

def extract_json(text):
    """
    Extract JSON object from text using multiple extraction methods.
    
    Args:
        text (str): Text that may contain a JSON object
        
    Returns:
        str: The extracted JSON string or empty JSON object
    """
    if not text:
        return '{}'
    
    # Method 1: Remove markdown code blocks first
    # Remove ```json and ``` markers
    text = re.sub(r'```json\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'```\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'```', '', text)
    
    # Method 2: Find JSON between curly braces with proper bracket matching
    brace_count = 0
    start_idx = -1
    end_idx = -1
    
    for i, char in enumerate(text):
        if char == '{':
            if start_idx == -1:
                start_idx = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and start_idx != -1:
                end_idx = i
                break
    
    if start_idx != -1 and end_idx != -1:
        json_candidate = text[start_idx:end_idx + 1]
        # Clean up common issues
        json_candidate = re.sub(r',\s*}', '}', json_candidate)  # Remove trailing commas
        json_candidate = re.sub(r',\s*]', ']', json_candidate)  # Remove trailing commas in arrays
        return json_candidate
    
    # Method 3: Fallback - simple regex extraction
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        json_candidate = match.group(0)
        # Clean up common issues
        json_candidate = re.sub(r',\s*}', '}', json_candidate)
        json_candidate = re.sub(r',\s*]', ']', json_candidate)
        return json_candidate
    
        return '{}'

def parse_ai_json_response(response_text, fallback_schema=None):
    """
    Robust JSON parsing function that handles all edge cases and ensures zero failures.
    
    Args:
        response_text (str): The AI response text that should contain JSON
        fallback_schema (dict): Optional fallback schema to return if parsing fails
        
    Returns:
        dict: The parsed JSON schema or a fallback schema
    """
    if not response_text:
        return fallback_schema or {}
    
    # Method 1: Try direct JSON parsing (clean response)
    try:
        return json.loads(response_text.strip())
    except json.JSONDecodeError:
        pass
    
    # Method 2: Extract JSON and parse
    try:
        json_str = extract_json(response_text)
        if json_str and json_str != '{}':
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    # Method 3: More aggressive cleaning and parsing
    try:
        # Remove all markdown and extra text
        cleaned = response_text
        cleaned = re.sub(r'```.*?```', '', cleaned, flags=re.DOTALL)
        cleaned = re.sub(r'```json\s*', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Find and extract the JSON portion
        json_str = extract_json(cleaned)
        if json_str and json_str != '{}':
            # Additional cleaning for common issues
            json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)  # Remove trailing commas
            json_str = re.sub(r':\s*,', ': null,', json_str)    # Fix empty values
            json_str = re.sub(r'([{,]\s*)"([^"]+)"\s*:\s*([^",\[\]{}]+?)(\s*[,}])', r'\1"\2": "\3"\4', json_str)  # Quote unquoted values
            
            return json.loads(json_str)
    except (json.JSONDecodeError, AttributeError, TypeError):
        pass
    
    # Method 4: Create a minimal valid schema if all parsing fails
    if fallback_schema:
        return fallback_schema
    
    # Return a basic valid schema structure
    return {
        "fact_main": {
            "columns": [
                {"name": "main_key", "type": "BIGINT", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "date_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "amount", "type": "DECIMAL(10,2)", "constraints": ["NOT NULL"]}
            ]
        },
        "dim_date": {
            "columns": [
                {"name": "date_key", "type": "INTEGER", "constraints": ["PRIMARY KEY"]},
                {"name": "full_date", "type": "DATE", "constraints": ["NOT NULL", "UNIQUE"]},
                {"name": "year", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "month", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "day", "type": "INTEGER", "constraints": ["NOT NULL"]}
            ]
        }
    }

def describe_schema(schema_details):
    """
    Describe a database schema in a human-readable format.
    
    Args:
        schema_details (dict): The schema dictionary with tables and columns
        
    Returns:
        str: Human-readable description of the schema
    """
    description = ""
    for table_name, table_info in schema_details.items():
        description += f"Table: {table_name}\n"
        if 'columns' in table_info:
            for column in table_info['columns']:
                column_type = column.get('type', 'unknown')
                constraints = ', '.join(column.get('constraints', []))
                description += f" - {column['name']}: {column_type}"
                if constraints:
                    description += f" ({constraints})"
                description += "\n"
        description += "\n"
    return description

def detect_domain_with_ai(schema_details):
    """
    Detect the domain of a database schema using AI.
    
    Args:
        schema_details (dict): The schema dictionary with tables and columns
        
    Returns:
        str: The detected domain name or 'Unknown Domain'
    """
    schema_description = describe_schema(schema_details)
    domains = ['E-commerce', 'Healthcare', 'Finance', 'Education', 'Supply Chain', 'Social Media', 'Retail', 'Logistics', 'Telecommunications',  'Hospitality', 'Insurance', 'Banking', 'Real Estate', 'Other']
    domains_list = '\n- '.join([''] + domains)
    
    prompt = (
        f"You are a database expert tasked with categorizing the following database schema into a specific domain.\n\n"
        f"Schema:\n{schema_description}\n\n"
        f"Select the most appropriate domain from this list:{domains_list}\n\n"
        f"Respond with ONLY the exact domain name from the list. Nothing else."
    )
    
    response = generate_text(prompt)
    
    if response:
        # Use regex to find the domain in the response
        pattern = re.compile(r'\b(' + '|'.join(domains) + r')\b', re.IGNORECASE)
        match = pattern.search(response)
        if match:
            # Return with proper capitalization
            for domain in domains:
                if domain.lower() == match.group(1).lower():
                    return domain
        return 'Unknown Domain'
    else:
        return 'Unknown Domain'

def map_names_with_ai(names_list, domain, name_type='table'):
    """
    Map names to standard domain-specific names using AI.
    
    Args:
        names_list (list): List of names to map to standards
        domain (str): The domain context for mapping
        name_type (str): Type of names being mapped (table, column)
        
    Returns:
        dict: Mapping of original names to standard names
    """
    if not names_list:
        return {}
        
    names_str = '\n- '.join([''] + names_list)
    
    prompt = (
        f"You are a database naming expert in the {domain} domain.\n\n"
        f"Map these {name_type} names to standard naming conventions used in {domain} systems:{names_str}\n\n"
        f"Return ONLY a valid JSON object with this exact format: {{\n"
        f"  \"original_name\": \"standard_name\",\n"
        f"  \"another_name\": \"another_standard_name\"\n"
        f"}}\n\n"
        f"Ensure every original name from the list is included as a key in the JSON."
    )
    
    mapping_response = generate_text(prompt)
    
    # Create fallback mapping
    fallback_mapping = {name: name for name in names_list}
    
    # Use robust JSON parsing
    mapping = parse_ai_json_response(mapping_response, fallback_mapping)
    
    # Ensure all original names are mapped
    for name in names_list:
        if name not in mapping:
            mapping[name] = name
    
    return mapping

def suggest_missing_elements(schema_details, domain):
    """
    Suggest missing tables or columns for the given domain's database schema using AI.
    
    Args:
        schema_details (dict): The schema dictionary with tables and columns
        domain (str): The domain context for suggestions
        
    Returns:
        dict: Suggestions for missing tables and columns
    """
    schema_description = describe_schema(schema_details)
    
    prompt = (
        f"You are a database architect specializing in {domain} systems.\n\n"
        f"Analyze this {domain} database schema:\n{schema_description}\n\n"
        f"What critical tables or columns are missing that would be standard for a {domain} database?\n\n"
        f"Respond with ONLY a JSON object with this exact format:\n"
        f"{{\n"
        f"  \"missing_tables\": [\n"
        f"    {{\n"
        f"      \"name\": \"table_name\",\n"
        f"      \"purpose\": \"brief description\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"missing_columns\": [\n"
        f"    {{\n"
        f"      \"table\": \"existing_table_name\",\n"
        f"      \"name\": \"column_name\",\n"
        f"      \"type\": \"data_type\",\n"
        f"      \"purpose\": \"brief description\"\n"
        f"    }}\n"
        f"  ]\n"
        f"}}"
    )
    
    suggestions_response = generate_text(prompt)
    
    # Create fallback suggestions structure
    fallback_suggestions = {"missing_tables": [], "missing_columns": []}
    
    # Use robust JSON parsing
    suggestions = parse_ai_json_response(suggestions_response, fallback_suggestions)
    
    # Ensure required keys exist
    if "missing_tables" not in suggestions:
        suggestions["missing_tables"] = []
    if "missing_columns" not in suggestions:
        suggestions["missing_columns"] = []
    
    return suggestions

def generate_warehouse_schema_with_ai(schema_details, domain):
    """
    Generate a warehouse schema with multiple fact tables and dimension tables using AI based on the user's schema and the domain.
    
    Args:
        schema_details (dict): The original schema dictionary with tables and columns
        domain (str): The domain context for enhancement
        
    Returns:
        dict: Warehouse schema with multiple fact tables and supporting dimension tables
    """
    schema_description = describe_schema(schema_details)
    
    prompt = (
        f"You are a senior data warehouse architect specializing in {domain} systems.\n\n"
        f"Based on this {domain} database schema, create a comprehensive data warehouse schema with MULTIPLE fact tables and dimension tables:\n\n"
        f"{schema_description}\n\n"
        f"Design a data warehouse schema that includes:\n"
        f"1. MULTIPLE fact tables for different business processes (2-4 fact tables based on the domain and available data)\n"
        f"2. MULTIPLE dimension tables that support the fact tables (5-8 dimension tables)\n"
        f"3. Proper foreign key relationships between fact and dimension tables\n"
        f"4. Appropriate date/time dimensions for time-based analysis\n"
        f"5. Follows data warehouse best practices (star schema pattern)\n"
        f"6. Optimized for analytical queries and business intelligence\n"
        f"7. Include audit columns (created_date, updated_date) where appropriate\n\n"
        f"For {domain} domain, create relevant fact tables such as:\n"
        f"- Primary transactional/operational facts\n"
        f"- Summary/aggregate facts\n"
        f"- Event/activity facts\n"
        f"- Performance/metrics facts (if applicable)\n\n"
        f"Return a complete data warehouse schema as a valid JSON object with this EXACT FLAT format:\n"
        f"{{\n"
        f"  \"fact_main_transactions\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"transaction_key\", \"type\": \"BIGINT\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"product_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"transaction_amount\", \"type\": \"DECIMAL(12,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"quantity\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"unit_price\", \"type\": \"DECIMAL(10,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"created_date\", \"type\": \"TIMESTAMP\", \"constraints\": [\"DEFAULT CURRENT_TIMESTAMP\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"fact_daily_summary\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"summary_key\", \"type\": \"BIGINT\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"location_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"total_transactions\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"total_amount\", \"type\": \"DECIMAL(15,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"average_transaction\", \"type\": \"DECIMAL(10,2)\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"fact_customer_activity\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"activity_key\", \"type\": \"BIGINT\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"activity_type_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"activity_count\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"duration_minutes\", \"type\": \"INTEGER\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_customer\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"customer_id\", \"type\": \"VARCHAR(50)\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"customer_name\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"customer_email\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"customer_segment\", \"type\": \"VARCHAR(50)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"registration_date\", \"type\": \"DATE\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_product\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"product_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"product_id\", \"type\": \"VARCHAR(50)\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"product_name\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"category\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"subcategory\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"price\", \"type\": \"DECIMAL(10,2)\", \"constraints\": [\"NOT NULL\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_date\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\"] }},\n"
        f"      {{ \"name\": \"full_date\", \"type\": \"DATE\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"year\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"quarter\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"month\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"day\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"day_of_week\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"is_weekend\", \"type\": \"BOOLEAN\", \"constraints\": [\"DEFAULT FALSE\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_location\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"location_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"location_id\", \"type\": \"VARCHAR(50)\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"location_name\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"city\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"state\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"country\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }}\n"
        f"}}\n\n"
        f"IMPORTANT: Return ONLY the flat JSON structure above. Do NOT nest tables under any parent keys.\n"
        f"Focus on creating a valuable multi-fact table data warehouse schema for {domain} analytics. Include 2-4 fact tables and 5-8 supporting dimension tables based on the domain and available data. Adapt the table names and columns to be relevant for the {domain} domain. Return ONLY the JSON object."
    )
    
    enhanced_schema_response = generate_text(prompt)
    
    # Debug logging
    print(f"AI Warehouse Schema Response: {enhanced_schema_response[:500]}...")
    
    # Create fallback schema for warehouse
    fallback_warehouse_schema = {
        f"fact_{domain.lower().replace(' ', '_').replace('-', '_')}_transactions": {
            "columns": [
                {"name": "transaction_key", "type": "BIGINT", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "date_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "customer_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "amount", "type": "DECIMAL(12,2)", "constraints": ["NOT NULL"]},
                {"name": "quantity", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "created_date", "type": "TIMESTAMP", "constraints": ["DEFAULT CURRENT_TIMESTAMP"]}
            ]
        },
        f"fact_{domain.lower().replace(' ', '_').replace('-', '_')}_summary": {
            "columns": [
                {"name": "summary_key", "type": "BIGINT", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "date_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "total_amount", "type": "DECIMAL(15,2)", "constraints": ["NOT NULL"]},
                {"name": "total_count", "type": "INTEGER", "constraints": ["NOT NULL"]}
            ]
        },
        "dim_customer": {
            "columns": [
                {"name": "customer_key", "type": "INTEGER", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "customer_name", "type": "VARCHAR(255)", "constraints": ["NOT NULL"]},
                {"name": "customer_email", "type": "VARCHAR(255)", "constraints": ["UNIQUE"]}
            ]
        },
        "dim_date": {
            "columns": [
                {"name": "date_key", "type": "INTEGER", "constraints": ["PRIMARY KEY"]},
                {"name": "full_date", "type": "DATE", "constraints": ["NOT NULL", "UNIQUE"]},
                {"name": "year", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "month", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "day", "type": "INTEGER", "constraints": ["NOT NULL"]}
            ]
        }
    }
    
    # Use robust JSON parsing
    enhanced_schema = parse_ai_json_response(enhanced_schema_response, fallback_warehouse_schema)
    
    # Check if AI returned malformed structure and fix it
    if 'fact_table_name' in enhanced_schema and 'columns' in enhanced_schema:
        print("Detected malformed warehouse schema structure, fixing...")
        fixed_schema = {}
        
        # Extract fact table
        fact_name = enhanced_schema.get('fact_table_name', 'fact_sales')
        if 'columns' in enhanced_schema:
            fixed_schema[fact_name] = {
                'columns': enhanced_schema['columns']
            }
        
        # Extract dimension tables (they should be at the same level)
        for key, value in enhanced_schema.items():
            if key not in ['fact_table_name', 'columns'] and isinstance(value, dict) and 'columns' in value:
                fixed_schema[key] = value
        
        print(f"Fixed malformed structure. Tables: {list(fixed_schema.keys())}")
        enhanced_schema = fixed_schema
    
    print(f"Successfully parsed AI warehouse schema with {len(enhanced_schema)} tables")
    return enhanced_schema

def generate_full_detailed_ai_warehouse(schema_details, domain):
    """
    Generate a comprehensive, full-scale data warehouse with multiple fact tables, dimension tables, and advanced analytics structures.
    
    Args:
        schema_details (dict): The original schema dictionary with tables and columns
        domain (str): The domain context for enhancement
        
    Returns:
        dict: Comprehensive data warehouse schema with multiple fact tables, dimensions, and analytics structures
    """
    schema_description = describe_schema(schema_details)
    
    prompt = (
        f"You are a senior enterprise data warehouse architect with expertise across multiple industries.\n\n"
        f"Based on this {domain} database schema, create a comprehensive, enterprise-scale data warehouse with multiple fact tables, extensive dimension tables, and advanced analytics capabilities:\n\n"
        f"{schema_description}\n\n"
        f"Design a complete enterprise data warehouse that includes:\n"
        f"1. MULTIPLE fact tables for different business processes (3-5 fact tables based on the domain)\n"
        f"2. EXTENSIVE dimension tables with hierarchies and attributes (8-12 dimension tables)\n"
        f"3. Bridge tables for many-to-many relationships when applicable\n"
        f"4. Slowly Changing Dimension (SCD) support with version tracking\n"
        f"5. Comprehensive time dimensions (date, time, fiscal periods)\n"
        f"6. Aggregate/summary tables for performance optimization\n"
        f"7. Analytics-ready structures for reporting and business intelligence\n"
        f"8. Data quality and audit columns (created_date, updated_date, data_source)\n"
        f"9. Domain-specific metrics, KPIs, and business measures\n"
        f"10. Star and snowflake schema patterns optimized for the {domain} domain\n\n"
        f"For {domain} domain, create relevant fact tables such as:\n"
        f"- Core transactional/operational facts\n"
        f"- Financial/accounting facts\n"
        f"- Performance/metrics facts\n"
        f"- Event/activity facts\n\n"
        f"Include comprehensive dimension tables such as:\n"
        f"- Time/date dimensions with multiple granularities\n"
        f"- Geographic/location dimensions\n"
        f"- Organizational/hierarchy dimensions\n"
        f"- Product/service/item dimensions\n"
        f"- Customer/client/user dimensions\n"
        f"- Category/classification dimensions\n"
        f"- Status/state dimensions\n"
        f"- Reference/lookup dimensions\n\n"
        f"Return a complete enterprise data warehouse schema as a valid JSON object with this exact format:\n"
        f"{{\n"
        f"  \"fact_main_transactions\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"transaction_key\", \"type\": \"BIGINT\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"product_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"location_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"transaction_amount\", \"type\": \"DECIMAL(15,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"quantity\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"unit_price\", \"type\": \"DECIMAL(10,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"created_date\", \"type\": \"TIMESTAMP\", \"constraints\": [\"DEFAULT CURRENT_TIMESTAMP\"] }},\n"
        f"      {{ \"name\": \"data_source\", \"type\": \"VARCHAR(50)\", \"constraints\": [\"NOT NULL\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"fact_financial_summary\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"financial_key\", \"type\": \"BIGINT\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"account_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"department_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"revenue\", \"type\": \"DECIMAL(15,2)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"expenses\", \"type\": \"DECIMAL(15,2)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"profit_margin\", \"type\": \"DECIMAL(5,2)\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"fact_performance_metrics\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"metric_key\", \"type\": \"BIGINT\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"entity_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"metric_value\", \"type\": \"DECIMAL(12,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"target_value\", \"type\": \"DECIMAL(12,2)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"performance_score\", \"type\": \"DECIMAL(5,2)\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_date\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\"] }},\n"
        f"      {{ \"name\": \"full_date\", \"type\": \"DATE\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"year\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"quarter\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"month\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"day\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"day_of_week\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"fiscal_year\", \"type\": \"INTEGER\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"fiscal_quarter\", \"type\": \"INTEGER\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"is_weekend\", \"type\": \"BOOLEAN\", \"constraints\": [\"DEFAULT FALSE\"] }},\n"
        f"      {{ \"name\": \"is_holiday\", \"type\": \"BOOLEAN\", \"constraints\": [\"DEFAULT FALSE\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_customer\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"customer_id\", \"type\": \"VARCHAR(50)\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"customer_name\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"customer_type\", \"type\": \"VARCHAR(50)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"customer_segment\", \"type\": \"VARCHAR(50)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"geographic_region\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"scd_version\", \"type\": \"INTEGER\", \"constraints\": [\"DEFAULT 1\"] }},\n"
        f"      {{ \"name\": \"effective_date\", \"type\": \"DATE\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"expiry_date\", \"type\": \"DATE\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"is_current\", \"type\": \"BOOLEAN\", \"constraints\": [\"DEFAULT TRUE\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_location\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"location_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"location_id\", \"type\": \"VARCHAR(50)\", \"constraints\": [\"NOT NULL\", \"UNIQUE\"] }},\n"
        f"      {{ \"name\": \"location_name\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"address\", \"type\": \"TEXT\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"city\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"state_province\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"country\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"postal_code\", \"type\": \"VARCHAR(20)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"region\", \"type\": \"VARCHAR(100)\", \"constraints\": [] }},\n"
        f"      {{ \"name\": \"timezone\", \"type\": \"VARCHAR(50)\", \"constraints\": [] }}\n"
        f"    ]\n"
        f"  }}\n"
        f"}}\n\n"
        f"Create a comprehensive enterprise-grade {domain} data warehouse with extensive fact and dimension tables tailored to the {domain} industry. Include at least 3-5 fact tables and 8-12 dimension tables with advanced analytics features. Make it general and adaptable to various {domain} scenarios. Return ONLY the JSON object."
    )
    
    enhanced_schema_response = generate_text(prompt)
    
    # Debug logging
    print(f"Full Detailed AI Warehouse Response: {enhanced_schema_response[:500]}...")
    
    # Create comprehensive fallback schema for enterprise warehouse
    fallback_enterprise_schema = {
        f"fact_{domain.lower().replace(' ', '_').replace('-', '_')}_transactions": {
            "columns": [
                {"name": "transaction_key", "type": "BIGINT", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "date_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "customer_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "product_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "location_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "transaction_amount", "type": "DECIMAL(15,2)", "constraints": ["NOT NULL"]},
                {"name": "quantity", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "unit_price", "type": "DECIMAL(10,2)", "constraints": ["NOT NULL"]},
                {"name": "created_date", "type": "TIMESTAMP", "constraints": ["DEFAULT CURRENT_TIMESTAMP"]},
                {"name": "data_source", "type": "VARCHAR(50)", "constraints": ["NOT NULL"]}
            ]
        },
        f"fact_{domain.lower().replace(' ', '_').replace('-', '_')}_financial": {
            "columns": [
                {"name": "financial_key", "type": "BIGINT", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "date_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "account_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "revenue", "type": "DECIMAL(15,2)", "constraints": []},
                {"name": "expenses", "type": "DECIMAL(15,2)", "constraints": []},
                {"name": "profit_margin", "type": "DECIMAL(5,2)", "constraints": []}
            ]
        },
        f"fact_{domain.lower().replace(' ', '_').replace('-', '_')}_performance": {
            "columns": [
                {"name": "metric_key", "type": "BIGINT", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "date_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "entity_key", "type": "INTEGER", "constraints": ["FOREIGN KEY"]},
                {"name": "metric_value", "type": "DECIMAL(12,2)", "constraints": ["NOT NULL"]},
                {"name": "target_value", "type": "DECIMAL(12,2)", "constraints": []},
                {"name": "performance_score", "type": "DECIMAL(5,2)", "constraints": []}
            ]
        },
        "dim_date": {
            "columns": [
                {"name": "date_key", "type": "INTEGER", "constraints": ["PRIMARY KEY"]},
                {"name": "full_date", "type": "DATE", "constraints": ["NOT NULL", "UNIQUE"]},
                {"name": "year", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "quarter", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "month", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "day", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "day_of_week", "type": "INTEGER", "constraints": ["NOT NULL"]},
                {"name": "fiscal_year", "type": "INTEGER", "constraints": []},
                {"name": "fiscal_quarter", "type": "INTEGER", "constraints": []},
                {"name": "is_weekend", "type": "BOOLEAN", "constraints": ["DEFAULT FALSE"]},
                {"name": "is_holiday", "type": "BOOLEAN", "constraints": ["DEFAULT FALSE"]}
            ]
        },
        "dim_customer": {
            "columns": [
                {"name": "customer_key", "type": "INTEGER", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "customer_id", "type": "VARCHAR(50)", "constraints": ["NOT NULL", "UNIQUE"]},
                {"name": "customer_name", "type": "VARCHAR(255)", "constraints": ["NOT NULL"]},
                {"name": "customer_type", "type": "VARCHAR(50)", "constraints": []},
                {"name": "customer_segment", "type": "VARCHAR(50)", "constraints": []},
                {"name": "geographic_region", "type": "VARCHAR(100)", "constraints": []},
                {"name": "scd_version", "type": "INTEGER", "constraints": ["DEFAULT 1"]},
                {"name": "effective_date", "type": "DATE", "constraints": ["NOT NULL"]},
                {"name": "expiry_date", "type": "DATE", "constraints": []},
                {"name": "is_current", "type": "BOOLEAN", "constraints": ["DEFAULT TRUE"]}
            ]
        },
        "dim_product": {
            "columns": [
                {"name": "product_key", "type": "INTEGER", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "product_id", "type": "VARCHAR(50)", "constraints": ["NOT NULL", "UNIQUE"]},
                {"name": "product_name", "type": "VARCHAR(255)", "constraints": ["NOT NULL"]},
                {"name": "category", "type": "VARCHAR(100)", "constraints": []},
                {"name": "subcategory", "type": "VARCHAR(100)", "constraints": []},
                {"name": "price", "type": "DECIMAL(10,2)", "constraints": ["NOT NULL"]}
            ]
        },
        "dim_location": {
            "columns": [
                {"name": "location_key", "type": "INTEGER", "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]},
                {"name": "location_id", "type": "VARCHAR(50)", "constraints": ["NOT NULL", "UNIQUE"]},
                {"name": "location_name", "type": "VARCHAR(255)", "constraints": ["NOT NULL"]},
                {"name": "address", "type": "TEXT", "constraints": []},
                {"name": "city", "type": "VARCHAR(100)", "constraints": []},
                {"name": "state_province", "type": "VARCHAR(100)", "constraints": []},
                {"name": "country", "type": "VARCHAR(100)", "constraints": []},
                {"name": "postal_code", "type": "VARCHAR(20)", "constraints": []},
                {"name": "region", "type": "VARCHAR(100)", "constraints": []},
                {"name": "timezone", "type": "VARCHAR(50)", "constraints": []}
            ]
        }
    }
    
    # Use robust JSON parsing with comprehensive fallback
    enhanced_schema = parse_ai_json_response(enhanced_schema_response, fallback_enterprise_schema)
    
    print(f"Successfully parsed full detailed AI warehouse with {len(enhanced_schema)} tables")
    return enhanced_schema


# # Initialize LangChain LLM with OpenAI GPT
# llm = ChatOpenAI(model_name="gpt-4", openai_api_key=API_KEY)

# # Add memory to retain conversation history
# memory = ConversationBufferMemory()

# # Define a conversation chain for interactions
# conversation = ConversationChain(llm=llm, memory=memory)

# def generate_text_with_langchain(prompt):
#     """
#     Generates text using LangChain's LLM model.
    
#     Args:
#         prompt (str): The text prompt to send to the AI model.
        
#     Returns:
#         str: The generated text response.
#     """
#     try:
#         response = conversation.run(prompt)
#         return response
#     except Exception as e:
#         print(f"LangChain generation failed: {e}")
#         return ""
