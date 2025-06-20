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

def generate_enhanced_schema_with_ai(schema_details, domain):
    """
    Generate an enhanced schema using AI based on the user's schema and the domain.
    
    Args:
        schema_details (dict): The original schema dictionary with tables and columns
        domain (str): The domain context for enhancement
        
    Returns:
        dict: Enhanced schema with additional tables and columns
    """
    schema_description = describe_schema(schema_details)
    
    prompt = (
        f"You are a senior database architect specializing in {domain} systems.\n\n"
        f"Enhance this {domain} database schema by adding important missing tables and columns:\n\n"
        f"{schema_description}\n\n"
        f"Return the complete enhanced schema as a valid JSON object with this exact format:\n"
        f"{{\n"
        f"  \"table_name\": {{\n"
        f"    \"columns\": [\n"
        f"      {{ \"name\": \"column_name\", \"type\": \"data_type\", \"constraints\": [\"constraint1\", \"constraint2\"] }},\n"
        f"      ...\n"
        f"    ]\n"
        f"  }},\n"
        f"  ...\n"
        f"}}\n\n"
        f"Include ALL original tables and columns plus your enhancements. Return ONLY the JSON schema."
    )
    
    enhanced_schema_response = generate_text(prompt)
    
    try:
        # Try direct JSON loading first
        enhanced_schema = json.loads(enhanced_schema_response)
        return enhanced_schema
    except json.JSONDecodeError:
        # Fall back to regex extraction
        try:
            json_str = extract_json(enhanced_schema_response)
            enhanced_schema = json.loads(json_str)
            return enhanced_schema
        except json.JSONDecodeError:
            print("Failed to parse the AI enhanced schema response as JSON.")
            # Return original schema to maintain consistent output format
            return schema_details
        


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
