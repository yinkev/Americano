#!/usr/bin/env python3
"""
Quick verification script to check Python API setup.
Run this after setup to verify everything is working.
"""

import sys
from importlib import import_module

def check_import(module_name: str) -> bool:
    """Check if a module can be imported."""
    try:
        import_module(module_name)
        print(f"✓ {module_name}")
        return True
    except ImportError as e:
        print(f"✗ {module_name}: {e}")
        return False

def main():
    print("🔍 Verifying Americano Python API setup...\n")

    # Check core dependencies
    print("Checking dependencies:")
    dependencies = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "pydantic_settings",
        "openai",
        "instructor",
        "pytest",
    ]

    all_ok = all(check_import(dep) for dep in dependencies)

    print("\nChecking project modules:")
    modules = [
        "src.config",
        "src.validation.models",
        "src.validation.evaluator",
        "src.validation.routes",
    ]

    all_ok = all(check_import(mod) for mod in modules) and all_ok

    # Check settings
    print("\nChecking configuration:")
    try:
        from src.config import settings
        print(f"✓ Environment: {settings.environment}")
        print(f"✓ OpenAI Model: {settings.openai_model}")
        print(f"✓ API Port: {settings.api_port}")

        if settings.openai_api_key == "your_openai_api_key_here":
            print("⚠️  WARNING: OPENAI_API_KEY not set in .env")
            all_ok = False
        else:
            print("✓ OpenAI API key configured")

    except Exception as e:
        print(f"✗ Configuration error: {e}")
        all_ok = False

    # Final result
    print("\n" + "="*50)
    if all_ok:
        print("✅ All checks passed! API is ready to run.")
        print("\nStart the server with:")
        print("  uvicorn main:app --reload --port 8000")
        sys.exit(0)
    else:
        print("❌ Some checks failed. Please review errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
