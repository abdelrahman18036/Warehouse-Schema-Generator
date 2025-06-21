#!/usr/bin/env python
"""
Test runner script for the Django backend application.
This script runs all unit tests and provides a summary of results.
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_settings')
    django.setup()
    
    # Get the Django test runner
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Define test modules to run
    test_modules = [
        'schema_generator.tests.test_models',
        'schema_generator.tests.test_serializers', 
        'schema_generator.tests.test_forms',
        'schema_generator.tests.test_views_simple'
    ]
    
    print("=" * 60)
    print("Running Django Unit Tests for Warehouse Schema Generator")
    print("=" * 60)
    
    # Run tests
    failures = test_runner.run_tests(test_modules, verbosity=2)
    
    print("\n" + "=" * 60)
    if failures:
        print(f"TESTS FAILED - {failures} test(s) failed")
        print("=" * 60)
        sys.exit(1)
    else:
        print("ALL TESTS PASSED SUCCESSFULLY! ✅")
        print("=" * 60)
        sys.exit(0) 