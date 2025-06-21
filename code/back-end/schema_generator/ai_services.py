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
    Extract JSON object from text using regex.
    
    Args:
        text (str): Text that may contain a JSON object
        
    Returns:
        str: The extracted JSON string or empty JSON object
    """
    # Look for content between curly braces, capture as much as possible
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    else:
        return '{}'

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
    domains = ['E-commerce', 'Healthcare', 'Finance', 'Education', 'Supply Chain', 'Social Media']
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
    
    try:
        # First try direct JSON loading
        mapping = json.loads(mapping_response)
        return mapping
    except json.JSONDecodeError:
        # Fall back to regex extraction
        try:
            json_str = extract_json(mapping_response)
            mapping = json.loads(json_str)
            return mapping
        except json.JSONDecodeError:
            print(f"Failed to parse the AI response as JSON for {name_type} name mapping.")
            # Return empty mapping to maintain consistent output format
            return {name: name for name in names_list}

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
    
    try:
        # Try direct JSON loading first
        suggestions = json.loads(suggestions_response)
        return suggestions
    except json.JSONDecodeError:
        # Fall back to regex extraction
        try:
            json_str = extract_json(suggestions_response)
            suggestions = json.loads(json_str)
            return suggestions
        except json.JSONDecodeError:
            print("Failed to parse the AI suggestions response as JSON.")
            # Return empty structure to maintain consistent output format
            return {"missing_tables": [], "missing_columns": []}

def generate_warehouse_schema_with_ai(schema_details, domain):
    """
    Generate a warehouse schema with one fact table and multiple dimension tables using AI based on the user's schema and the domain.
    
    Args:
        schema_details (dict): The original schema dictionary with tables and columns
        domain (str): The domain context for enhancement
        
    Returns:
        dict: Warehouse schema with one fact table and supporting dimension tables
    """
    schema_description = describe_schema(schema_details)
    
    prompt = (
        f"You are a senior data warehouse architect specializing in {domain} systems.\n\n"
        f"Based on this {domain} database schema, create a comprehensive data warehouse schema with ONE fact table and multiple dimension tables:\n\n"
        f"{schema_description}\n\n"
        f"Design a data warehouse schema that includes:\n"
        f"1. ONE central fact table containing the most critical business measures/metrics for {domain}\n"
        f"2. MULTIPLE dimension tables that support the fact table\n"
        f"3. Proper foreign key relationships between fact and dimension tables\n"
        f"4. Appropriate date/time dimensions for time-based analysis\n"
        f"5. Follows data warehouse best practices (star schema)\n"
        f"6. Optimized for analytical queries\n\n"
        f"Return a complete data warehouse schema as a valid JSON object with this EXACT FLAT format:\n"
        f"{{\n"
        f"  \"fact_sales\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"sales_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"product_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"FOREIGN KEY\"] }},\n"
        f"      {{ \"name\": \"sales_amount\", \"type\": \"DECIMAL(10,2)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"quantity\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_customer\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"customer_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"customer_name\", \"type\": \"VARCHAR(100)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"customer_email\", \"type\": \"VARCHAR(255)\", \"constraints\": [\"UNIQUE\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_product\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"product_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\", \"AUTO_INCREMENT\"] }},\n"
        f"      {{ \"name\": \"product_name\", \"type\": \"VARCHAR(100)\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"price\", \"type\": \"DECIMAL(10,2)\", \"constraints\": [\"NOT NULL\"] }}\n"
        f"    ]\n"
        f"  }},\n"
        f"  \"dim_date\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"date_key\", \"type\": \"INTEGER\", \"constraints\": [\"PRIMARY KEY\"] }},\n"
        f"      {{ \"name\": \"full_date\", \"type\": \"DATE\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"year\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }},\n"
        f"      {{ \"name\": \"month\", \"type\": \"INTEGER\", \"constraints\": [\"NOT NULL\"] }}\n"
        f"    ]\n"
        f"  }}\n"
        f"}}\n\n"
        f"IMPORTANT: Return ONLY the flat JSON structure above. Do NOT nest tables under a 'fact_table_name' key.\n"
        f"Focus on creating the most valuable data warehouse schema for {domain} analytics. Include one fact table and multiple supporting dimension tables. Return ONLY the JSON object."
    )
    
    enhanced_schema_response = generate_text(prompt)
    
    # Debug logging
    print(f"AI Warehouse Schema Response: {enhanced_schema_response[:500]}...")
    
    try:
        # Try direct JSON loading first
        enhanced_schema = json.loads(enhanced_schema_response)
        print(f"Successfully parsed AI warehouse schema with {len(enhanced_schema)} tables")
        
        # Check if AI returned malformed structure and fix it
        needs_fixing = False
        
        # Check for the specific malformed structure from your example
        if 'fact_table_name' in enhanced_schema and 'columns' in enhanced_schema:
            needs_fixing = True
            
        if needs_fixing:
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
            return fixed_schema
        
        return enhanced_schema
    except json.JSONDecodeError as e:
        print(f"Direct JSON parsing failed: {e}")
        # Fall back to regex extraction
        try:
            json_str = extract_json(enhanced_schema_response)
            print(f"Extracted JSON string: {json_str[:200]}...")
            enhanced_schema = json.loads(json_str)
            print(f"Successfully parsed extracted JSON with {len(enhanced_schema)} tables")
            return enhanced_schema
        except json.JSONDecodeError as e2:
            print(f"Regex extraction JSON parsing also failed: {e2}")
            print("Failed to parse the AI warehouse schema response as JSON.")
            print("AI parsing failed - returning empty schema")
            return {}

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
    
    try:
        # Try direct JSON loading first
        enhanced_schema = json.loads(enhanced_schema_response)
        print(f"Successfully parsed full detailed AI warehouse with {len(enhanced_schema)} tables")
        return enhanced_schema
    except json.JSONDecodeError as e:
        print(f"Direct JSON parsing failed: {e}")
        # Fall back to regex extraction
        try:
            json_str = extract_json(enhanced_schema_response)
            print(f"Extracted JSON string: {json_str[:200]}...")
            enhanced_schema = json.loads(json_str)
            print(f"Successfully parsed extracted JSON with {len(enhanced_schema)} tables")
            return enhanced_schema
        except json.JSONDecodeError as e2:
            print(f"Regex extraction JSON parsing also failed: {e2}")
            print("Failed to parse the full detailed AI warehouse response as JSON.")
            print("AI parsing failed - this endpoint requires successful AI generation")
            return {}


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
