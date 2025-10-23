---
last-redoc-date: 2025-10-23
type: "Module"
---

# BMAD Core Module

**Purpose:** Provides foundational BMAD Method infrastructure, core workflows, and master orchestration agents.

**Overview:** The BMAD Core module serves as the foundation layer for all BMAD Method operations. It includes essential initialization workflows, the master orchestration agent, and core utilities that other modules depend on. This module bootstraps the BMAD Method ecosystem and provides fundamental capabilities for agent coordination and workflow execution.

## Workflows

[View all workflows →](./workflows/README.md)

The module includes **3 core workflows**:

- **bmad-init** - Initialize BMAD Method in a new project
- **brainstorming** - Interactive brainstorming session facilitation
- **party-mode** - Fun, energetic ideation sessions

## Agents

The core module provides **2 foundational agents**:

- **bmad-master** - Master orchestration agent for BMAD Method coordination
- **bmad-web-orchestrator** - Web-based orchestration and coordination

## Configuration

The module uses `/bmad/core/config.yaml` for:

- `user_name` - Primary user identification
- `communication_language` - Preferred language for agent communication
- `output_folder` - Default location for workflow outputs

## Usage

```bash
# Initialize BMAD Method in a project
workflow bmad-init

# Start a brainstorming session
workflow brainstorming

# Invoke the master agent
agent core/bmad-master
```

## Key Responsibilities

- **Method Initialization:** Setup and configuration of BMAD Method infrastructure
- **Agent Orchestration:** Coordinate multi-agent workflows across modules
- **Core Utilities:** Shared tasks and utilities used by all BMAD modules
- **Foundation Layer:** Provide base capabilities for specialized modules (BMB, BMM, CIS)

## Module Dependencies

The CORE module is a dependency for:
- **BMM** (BMAD Method Module) - Uses core orchestration
- **BMB** (BMAD Builder Module) - Leverages core infrastructure
- **CIS** (Creative Intelligence System) - Extends core workflows

---

_BMAD Core v6.0 - The foundation of the BMAD Method ecosystem_
