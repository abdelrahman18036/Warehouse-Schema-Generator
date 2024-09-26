import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
import re



# Load API key from .env file if needed
load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY') or "AIzaSyD2T-2WaoJ-Il9r7PFBv0l7_sxAcu_NbdE"

# Set up the API key for Google Generative AI
genai.configure(api_key=API_KEY)

# Initialize the model
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_text(prompt):
    """
    Generates text using Google's Gemini AI model with the prompt.
    """
    try:
        # Use generate_content without temperature and max_output_tokens
        response = model.generate_content(prompt)
        # Extract the generated text
        return response.text if response else ""
    except Exception as e:
        print(f"Error: {e}")

def extract_json(text):
    """
    Extract JSON object from text using regex.
    """
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    else:
        return '{}'






def describe_schema(schema_details):
    """
    Describe a database schema in a human-readable format.
    """
    description = ""
    for table_name, table_info in schema_details.items():
        description += f"Table: {table_name}\n"
        for column in table_info['columns']:
            description += f" - {column['name']}: {column['type']}\n"
        description += "\n"
    return description



def detect_domain_with_ai(schema_details):
    """
    Detect the domain of a database schema using AI.
    """
    schema_description = describe_schema(schema_details)
    prompt = (
        f"Based on the following database schema, determine the most appropriate domain "
        f"from the following options: E-commerce, Healthcare, Finance, Education, Supply Chain, Social Media.\n"
        f"Please respond with only the domain name.\n\n"
        f"{schema_description}\n\nDomain:"
    )
    response = generate_text(prompt)
    
    if response:
        # Use regex to find the domain in the response
        domains = ['E-commerce', 'Healthcare', 'Finance', 'Education', 'Supply Chain', 'Social Media']
        pattern = re.compile(r'\b(' + '|'.join(domains) + r')\b', re.IGNORECASE)
        match = pattern.search(response)
        if match:
            return match.group(1)
        else:
            return 'Unknown Domain'
    else:
        return 'Unknown Domain'



def map_names_with_ai(names_list, domain, name_type='table'):
    """
    Map names to standard domain-specific names using AI.
    """
    names_str = ', '.join(names_list)
    prompt = (
        f"Map the following {name_type} names to standard names used in the {domain} domain:\n\n"
        f"{names_str}\n\n"
        f"Provide the mappings in a JSON object with keys as original names and values as standard names. "
        f"Ensure the output is valid JSON without any additional text."
    )
    mapping_response = generate_text(prompt)
    
    try:
        mapping = json.loads(mapping_response)
        return mapping
    except json.JSONDecodeError:
        print("Failed to parse the AI response as JSON.")
        return {}



def suggest_missing_elements(schema_details, domain):
    """
    Suggest missing tables or columns for the given domain's database schema using AI.
    """
    schema_description = describe_schema(schema_details)
    prompt = (
        f"The following is a database schema for the {domain} domain:\n\n"
        f"{schema_description}\n\n"
        f"Identify any missing tables or columns that are commonly used in this domain. "
        f"Provide your suggestions in a JSON format with 'missing_tables' and 'missing_columns' as keys. "
        f"Output ONLY the JSON object and nothing else."
    )
    suggestions_response = generate_text(prompt)
    
    try:
        # Use regex to extract JSON from the response
        json_str = extract_json(suggestions_response)
        suggestions = json.loads(json_str)
        return suggestions
    except json.JSONDecodeError:
        print("Failed to parse the AI response as JSON.")
        return {}

def generate_enhanced_schema_with_ai(schema_details, domain):
    """
    Generate an enhanced schema using AI based on the user's schema and the domain.
    """
    schema_description = describe_schema(schema_details)
    prompt = (
        f"As a database expert in the {domain} domain, enhance the following database schema "
        f"by adding any missing tables and columns that are commonly used. "
        f"Provide the enhanced schema in a JSON format as follows:\n\n"
        f"{{\n"
        f"  \"table_name\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"column_name\", \"type\": \"data_type\", \"constraints\": [\"constraint1\", \"constraint2\"] }},\n"
        f"      ...\n"
        f"    ]\n"
        f"  }},\n"
        f"  ...\n"
        f"}}\n\n"
        f"Ensure the output is valid JSON without any additional text.\n\n"
        f"Original Schema:\n{schema_description}"
    )
    enhanced_schema_response = generate_text(prompt)
    
    try:
        json_str = extract_json(enhanced_schema_response)
        enhanced_schema = json.loads(json_str)
        return enhanced_schema
    except json.JSONDecodeError:
        print("Failed to parse the AI response as JSON.")
        return {}