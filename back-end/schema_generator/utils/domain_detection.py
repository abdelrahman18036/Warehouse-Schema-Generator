# domain_detection.py

import re
from collections import defaultdict

def detect_domain(schema_details):
    domain_keywords = {
        'E-commerce': {
            'keywords': [
                'customer', 'product', 'order', 'cart', 'payment', 'shipment', 'order_item',
                'sku', 'sales', 'invoice', 'address', 'firstname', 'lastname', 'email', 'price', 'quantity'
            ],
            'weight': 1.0
        },
        'Healthcare': {
            'keywords': [
                'patient', 'doctor', 'appointment', 'prescription', 'diagnosis', 'medical',
                'health', 'treatment', 'medication', 'hospital', 'clinic', 'first_name', 'last_name', 'dob', 'nurse'
            ],
            'weight': 1.0
        },
        'Education': {
            'keywords': [
                'student', 'course', 'enrollment', 'grade', 'instructor', 'class',
                'school', 'university', 'teacher', 'first_name', 'last_name', 'subject', 'curriculum', 'degree'
            ],
            'weight': 1.0
        },
        'Finance': {
            'keywords': [
                'account', 'transaction', 'balance', 'loan', 'investment', 'finance',
                'customer', 'branch', 'credit', 'debit', 'first_name', 'last_name', 'currency', 'interest_rate'
            ],
            'weight': 1.0
        },
        'Supply Chain': {
            'keywords': [
                'supplier', 'inventory', 'shipment', 'warehouse', 'logistics', 'supply',
                'demand', 'product', 'order', 'sku', 'item', 'stock', 'procurement', 'distribution'
            ],
            'weight': 1.0
        },
        'Social Media': {
            'keywords': [
                'user', 'post', 'comment', 'like', 'friend', 'message', 'social',
                'profile', 'username', 'content', 'follow', 'first_name', 'last_name', 'share', 'media'
            ],
            'weight': 1.0
        },
    }

    # Flatten table and column names into a single list
    names = []
    for table_name, table_info in schema_details.items():
        names.append(table_name.lower())
        for column in table_info['columns']:
            names.append(column['name'].lower())

    domain_scores = defaultdict(float)

    for domain, info in domain_keywords.items():
        keywords = info['keywords']
        weight = info['weight']
        for keyword in keywords:
            pattern = re.compile(r'\b' + re.escape(keyword.lower()) + r'\b')
            matches = [name for name in names if pattern.search(name)]
            domain_scores[domain] += len(matches) * weight

    # Select the domain with the highest score
    max_score = max(domain_scores.values())
    detected_domains = [domain for domain, score in domain_scores.items() if score == max_score]

    if max_score == 0:
        detected_domain = 'General'
    elif len(detected_domains) == 1:
        detected_domain = detected_domains[0]
    else:
        # In case of a tie, select the domain with the most specific keywords matched
        detected_domain = detected_domains[0]

    return detected_domain
