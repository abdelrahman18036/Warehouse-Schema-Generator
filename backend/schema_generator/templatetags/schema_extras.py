from django import template

register = template.Library()

@register.filter
def foreign_key_columns(foreign_keys):
    return [fk['column'] for fk in foreign_keys]