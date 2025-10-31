#!/usr/bin/env python3
"""
Pydantic V2 to TypeScript Type Generation Script for Epic 4 API Models.

This script automatically generates TypeScript interfaces from all Pydantic V2 models
in the Python FastAPI service using JSON Schema export and json-schema-to-typescript.

Features:
- Auto-discovers all Pydantic V2 models in src/ subdirectories
- Uses Pydantic V2's native JSON schema generation
- Generates TypeScript interfaces with proper type mappings
- Includes header comment warning against manual edits
- Validates generation success

Usage:
    python scripts/generate_types.py

Output:
    ../web/src/types/api-generated.ts
"""

import sys
import os
import json
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from typing import List, Type, get_type_hints
from pydantic import BaseModel

# Add api root to path
api_root = Path(__file__).parent.parent
sys.path.insert(0, str(api_root))

# Add ML service root to path (for Epic 5 models)
ml_service_root = api_root.parent / "ml-service"
if ml_service_root.exists():
    sys.path.insert(0, str(ml_service_root))

os.chdir(str(api_root))


def discover_models(module_path: str) -> List[Type[BaseModel]]:
    """
    Discover all Pydantic BaseModel classes in a module.

    Args:
        module_path: Dot-separated module path (e.g., 'src.validation.models')

    Returns:
        List of Pydantic BaseModel classes found in the module
    """
    import importlib
    import inspect

    module = importlib.import_module(module_path)
    models = []

    for name, obj in inspect.getmembers(module):
        if (
            inspect.isclass(obj)
            and issubclass(obj, BaseModel)
            and obj is not BaseModel
            and obj.__module__ == module_path  # Only classes defined in this module
        ):
            models.append(obj)

    return models


def fix_refs(obj: any, replacements: dict) -> None:
    """
    Recursively fix $ref pointers from #/$defs/X to #/definitions/X.

    Args:
        obj: Dictionary or list to process
        replacements: Mapping of old ref paths to new ref paths
    """
    if isinstance(obj, dict):
        # Fix $ref if present
        if "$ref" in obj:
            old_ref = obj["$ref"]
            if old_ref.startswith("#/$defs/"):
                obj["$ref"] = old_ref.replace("#/$defs/", "#/definitions/")

        # Recurse into all values
        for value in obj.values():
            fix_refs(value, replacements)

    elif isinstance(obj, list):
        # Recurse into list items
        for item in obj:
            fix_refs(item, replacements)


def generate_json_schema(models: List[Type[BaseModel]]) -> dict:
    """
    Generate combined JSON Schema for all models.

    Args:
        models: List of Pydantic BaseModel classes

    Returns:
        Combined JSON Schema dictionary
    """
    combined_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "definitions": {}
    }

    # First pass: collect all schemas and nested definitions
    all_defs = {}

    for model in models:
        # Generate JSON Schema for this model using Pydantic V2 API
        schema = model.model_json_schema()

        # Add to definitions
        model_name = model.__name__
        all_defs[model_name] = schema

        # Handle nested definitions if present
        if "$defs" in schema:
            for def_name, def_schema in schema["$defs"].items():
                # Avoid duplicates
                if def_name not in all_defs:
                    all_defs[def_name] = def_schema

            # Remove $defs from the model schema
            del schema["$defs"]

    # Second pass: fix all $ref pointers from #/$defs/X to #/definitions/X
    for def_name, def_schema in all_defs.items():
        fix_refs(def_schema, {})
        combined_schema["definitions"][def_name] = def_schema

    return combined_schema


def json_schema_to_typescript(schema: dict, output_file: Path) -> None:
    """
    Convert JSON Schema to TypeScript using json-schema-to-typescript.
    Converts the entire schema at once to avoid duplicate exports.

    Args:
        schema: JSON Schema dictionary with definitions
        output_file: Path to output TypeScript file
    """
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Write entire schema to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(schema, f, indent=2)
        schema_file = f.name

    try:
        # Run json-schema-to-typescript on entire schema
        # This converts all definitions at once, avoiding duplicates
        # --unreachableDefinitions flag ensures all definitions are exported
        cmd = f'npx json-schema-to-typescript {schema_file} --bannerComment "" --unreachableDefinitions'
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=str(api_root.parent / "web"),
        )

        if result.returncode != 0:
            print(f"❌ Error generating TypeScript: {result.stderr}")
            raise RuntimeError("TypeScript generation failed")

        # Clean up the output - remove eslint-disable and generic comments
        ts_output = result.stdout
        lines = ts_output.split("\n")
        cleaned_lines = []
        skip_until_export = True

        for line in lines:
            if "export " in line:
                skip_until_export = False

            if not skip_until_export:
                cleaned_lines.append(line)

        combined_ts = "\n".join(cleaned_lines).strip()

        # Write final output
        with open(output_file, 'w') as f:
            f.write(combined_ts)

        # Count unique exports for logging
        export_count = combined_ts.count("export interface") + combined_ts.count("export type")
        print(f"✅ Generated {export_count} unique TypeScript exports (no duplicates)")

    finally:
        # Clean up temp file
        os.unlink(schema_file)


def main():
    """Generate TypeScript interfaces from all Pydantic models."""

    print("=" * 80)
    print("Pydantic V2 → TypeScript Type Generation")
    print("=" * 80)
    print()

    # Define paths
    output_file = api_root.parent / "web" / "src" / "types" / "api-generated.ts"

    print(f"API Root: {api_root}")
    print(f"Output File: {output_file}")
    print()

    # Module paths to generate from
    model_modules = [
        # Epic 4: Understanding Validation Engine
        "src.validation.models",       # Story 4.1: Validation models
        "src.challenge.models",        # Story 4.3: Challenge models
        "src.adaptive.models",         # Story 4.5: Adaptive models
        "src.analytics.models",        # Story 4.6: Analytics models

        # Epic 5: ML Service (Behavioral Twin Engine)
        "app.models.predictions",      # Struggle predictions, ML models
        "app.models.feedback",         # User feedback models
        "app.models.interventions",    # Intervention strategies
        "app.models.analytics",        # Advanced analytics models
    ]

    print("Discovering Pydantic V2 models in:")
    for module in model_modules:
        print(f"  - {module}")
    print()

    # Discover all models
    all_models = []
    for module_path in model_modules:
        try:
            models = discover_models(module_path)
            all_models.extend(models)
            print(f"✓ Found {len(models)} models in {module_path}")
        except Exception as e:
            print(f"✗ Error loading {module_path}: {e}")
            import traceback
            traceback.print_exc()

    print()
    print(f"Total models discovered: {len(all_models)}")
    print()

    if not all_models:
        print("❌ No models found to generate!")
        return 1

    # Generate JSON Schema
    try:
        print("Generating JSON Schema...")
        combined_schema = generate_json_schema(all_models)
        print(f"✓ Generated schema with {len(combined_schema['definitions'])} definitions")
        print()

        # Convert to TypeScript
        print("Converting JSON Schema to TypeScript...")
        json_schema_to_typescript(combined_schema, output_file)

        # Add custom header
        with open(output_file, 'r') as f:
            ts_content = f.read()

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        custom_header = f"""/**
 * AUTO-GENERATED FROM PYDANTIC V2 MODELS - DO NOT EDIT MANUALLY
 *
 * This file is automatically generated from Python Pydantic V2 models.
 * Any manual changes will be overwritten on next generation.
 *
 * Source modules:
{chr(10).join(f' *   - {m}' for m in model_modules)}
 *
 * Generated: {timestamp}
 * Generator: Custom Pydantic V2 → TypeScript converter
 *
 * To regenerate:
 *   cd apps/api && python scripts/generate_types.py
 *   or
 *   cd apps/web && npm run generate-types
 */

"""

        # Combine header with content
        final_content = custom_header + ts_content

        # Write final file
        with open(output_file, 'w') as f:
            f.write(final_content)

        print(f"✅ Successfully generated TypeScript types!")
        print(f"   Output: {output_file}")
        print()

        # Count interfaces generated
        interface_count = ts_content.count("export interface") + ts_content.count("export type")
        print(f"📊 Statistics:")
        print(f"   - {interface_count} TypeScript types/interfaces generated")
        print(f"   - {len(all_models)} Pydantic models processed")
        print(f"   - {len(model_modules)} Python modules scanned")
        print()

        # Show sample of generated types
        lines = ts_content.split("\n")
        type_lines = [i for i, line in enumerate(lines) if "export interface" in line or "export type" in line]

        if type_lines:
            print("📄 Sample types generated:")
            for idx in type_lines[:10]:  # Show first 10
                line = lines[idx].strip()
                if "export interface" in line:
                    type_name = line.split("export interface ")[1].split(" {")[0].split(" extends")[0]
                elif "export type" in line:
                    type_name = line.split("export type ")[1].split(" =")[0]
                else:
                    continue
                print(f"   - {type_name}")
            if len(type_lines) > 10:
                print(f"   ... and {len(type_lines) - 10} more")
        print()

        print("=" * 80)
        print("✅ Type generation complete!")
        print("=" * 80)
        print()
        print("Next steps:")
        print("1. Verify TypeScript compilation: cd apps/web && npx tsc --noEmit")
        print("2. Import types in your Next.js code:")
        print("   import type { EvaluationResult, NextQuestionResponse } from '@/types/api-generated'")
        print()

        return 0

    except Exception as e:
        print(f"❌ Error during type generation: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
