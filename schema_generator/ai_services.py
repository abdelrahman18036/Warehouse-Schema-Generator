import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

# Load API key from .env file if needed
load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY') or "AIzaSyD2T-2WaoJ-Il9r7PFBv0l7_sxAcu_NbdE"

# Set up the API key for Google Generative AI
genai.configure(api_key=API_KEY)

# Initialize the model
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_text(prompt):
    """
    Generates text using Google's Gemini AI model with the prompt and specified parameters.
    """
    try:
        # Use generate_content without temperature and max_output_tokens
        response = model.generate_content(prompt)
        # Extract the generated text
        return response.text if response else ""
    except Exception as e:
        print(f"Error: {e}")
        return None


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
    Detect the domain of a database schema (e.g., E-commerce, Healthcare) using AI.
    """
    schema_description = describe_schema(schema_details)
    prompt = (
        f"Based on the following database schema, determine the most appropriate domain "
        f"(e.g., E-commerce, Healthcare, Finance, Education, Supply Chain, Social Media):\n\n"
        f"{schema_description}\n\nDomain:"
    )
    domain = generate_text(prompt)
    # Handle if domain is None to avoid AttributeError
    return domain.strip() if domain else "Unknown Domain"


def map_names_with_ai(names_list, domain, name_type='table'):
    """
    Map names to standard domain-specific names using AI.
    """
    names_str = ', '.join(names_list)
    prompt = (
        f"Map the following {name_type} names to standard names used in the {domain} domain:\n\n"
        f"{names_str}\n\nProvide a JSON object with keys as original names and values as standard names."
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
        f"Provide your suggestions in a JSON format with 'missing_tables' and 'missing_columns' as keys."
    )
    suggestions_response = generate_text(prompt)
    
    try:
        suggestions = json.loads(suggestions_response)
        return suggestions
    except json.JSONDecodeError:
        print("Failed to parse the AI response as JSON.")
        return {}
