---
title: "AI Agents Usage Guide - Gemini & Codex"
description: "Guide for using Gemini and Codex AI agents in the Americano project"
type: "Guide"
status: "Active"
version: "1.1"
owner: "Kevy"
review_cadence: "Per Change"
created_date: "2025-10-25T10:00:00-07:00"
last_updated: "2025-10-25T10:30:00-07:00"
audience:
  - experienced-devs
  - architects
technical_level: "Intermediate"
tags: ["ai-agents", "gemini", "codex", "automation"]
---

# AI Agents Usage Guide

This guide documents how to use Gemini and Codex AI agents within the Americano adaptive learning platform project.

## Gemini CLI

### Basic Usage

**Command Pattern:**
```bash
gemini -p "Your prompt here"
```

**Test Connection:**
```bash
gemini -p "Hello Gemini, can you confirm you're operational?"
```

### Output Formats

**1. Text (Default)**
```bash
gemini -p "Explain this code"
```

**2. JSON (for programmatic processing)**
```bash
gemini -p "Analyze architecture" --output-format json

# Extract response with jq
result=$(gemini -p "question" --output-format json)
echo "$result" | jq -r '.response'
```

**3. Stream JSON (real-time events)**
```bash
gemini -p "Run tests" --output-format stream-json
```

### Advanced Features

**Include Directories:**
```bash
# Include additional context from other directories
gemini -p "Analyze code" --include-directories ../shared,../utils

# Include all files (ignore .gitignore)
gemini -p "Review codebase" --all-files
```

**Model Selection:**
```bash
gemini -m gemini-2.5-flash -p "Your prompt"
```

**Automation Modes:**
```bash
# Auto-approve file edits only
gemini --approval-mode auto_edit -p "Fix bugs"

# Auto-approve everything (use with caution!)
gemini --yolo -p "Refactor code"
```

**Sandboxing:**
```bash
# Run in Docker sandbox for safety
gemini -s -p "Run tests"
```

### Scripting & Automation

**Extract JSON Response:**
```bash
result=$(gemini -p "Analyze this" --output-format json)
echo "$result" | jq -r '.response'
```

**Track Token Usage:**
```bash
result=$(gemini -p "question" --output-format json)
tokens=$(echo "$result" | jq -r '.stats.models | to_entries | map(.value.tokens.total) | add')
echo "Used $tokens tokens"
```

**Batch Processing:**
```bash
for file in src/*.py; do
    gemini -p "Find bugs in this file" < "$file" > "reports/$(basename $file).txt"
done
```

**Git Integration:**
```bash
# Generate commit messages
result=$(git diff --cached | gemini -p "Write a concise commit message" --output-format json)
message=$(echo "$result" | jq -r '.response')
git commit -m "$message"

# Generate release notes
git log --oneline v1.0.0..HEAD | gemini -p "Generate release notes" >> CHANGELOG.md
```

### Interactive Mode

```bash
# Start interactive session
gemini

# In interactive mode:
> Explain the authentication flow in this project
> @src/auth.ts Explain this authentication module
> @src/ Summarize all code in this directory
> !git status
> !npm test
```

---

## Codex CLI

### Basic Usage

**Command Pattern (Non-Interactive):**
```bash
codex exec "Your prompt here"
```

**Test Connection:**
```bash
codex exec "Hello Codex, can you confirm you're operational?"
```

### Key Features

**Model Selection:**
```bash
codex exec -m o3 "Your prompt"
```

**Sandbox Modes:**
```bash
# Read-only (safest)
codex exec -s read-only "Analyze code"

# Workspace-write (moderate)
codex exec -s workspace-write "Fix bugs"

# Full access (dangerous - use with caution)
codex exec -s danger-full-access "Deploy changes"
```

**Approval Policies:**
```bash
# Only run trusted commands (ls, cat, sed) without approval
codex exec -a untrusted "List files"

# Run all commands, only ask on failure
codex exec -a on-failure "Run tests"

# Model decides when to ask
codex exec -a on-request "Complex task"

# Never ask (fully automated - dangerous!)
codex exec -a never "Automated task"
```

**Full Auto Mode (Low Friction):**
```bash
# Equivalent to: -a on-failure --sandbox workspace-write
codex exec --full-auto "Run tests and fix any failures"
```

**Change Working Directory:**
```bash
codex exec -C /path/to/project "Analyze this project"
```

**Enable Web Search:**
```bash
codex exec --search "Research latest React patterns"
```

**Attach Images:**
```bash
codex exec -i screenshot.png "Analyze this UI"
codex exec -i design1.png -i design2.png "Compare these designs"
```

### Interactive Mode

```bash
# Start interactive session
codex

# With prompt
codex "Analyze the authentication system"

# Resume previous session
codex resume

# Resume last session
codex resume --last
```

### Configuration

**Via Config File (~/.codex/config.toml):**
```toml
model = "gpt-5"
sandbox = "workspace-write"
approval_policy = "on-failure"
```

**Via Command-Line Overrides:**
```bash
codex exec -c model="o3" -c sandbox_permissions='["disk-full-read-access"]' "Your prompt"
```

**Enable/Disable Features:**
```bash
codex exec --enable feature-name "Your prompt"
codex exec --disable feature-name "Your prompt"
```

### Apply Diffs

```bash
# Apply latest diff from Codex agent
codex apply

# Alias
codex a
```

---

## Comparison: Gemini vs Codex

| Feature | Gemini | Codex |
|---------|--------|-------|
| **Primary Use** | General-purpose AI assistant | Code generation & development |
| **Command Pattern** | `gemini -p "prompt"` | `codex exec "prompt"` |
| **Output Formats** | Text, JSON, Stream JSON | Text (stdout) |
| **Sandboxing** | Docker (`-s` or `--sandbox`) | Read-only, Workspace-write, Full access |
| **Approval Modes** | auto_edit, yolo | untrusted, on-failure, on-request, never |
| **Interactive Mode** | `gemini` | `codex` |
| **Best For** | Analysis, documentation, reviews | Code generation, refactoring, fixes |
| **Context** | `--include-directories`, `--all-files` | `-C` (working dir), `--add-dir` |
| **Model Selection** | `-m gemini-2.5-flash` | `-m gpt-5` or `-m o3` |
| **Session Memory** | ❌ No (stateless) | ✅ Yes (via resume) |

---

## Session Memory & Persistence ⭐

### Codex: Full Session Memory ✅

**Codex maintains conversation memory across non-interactive calls!**

Every `codex exec` call creates a session with a unique ID. You can resume sessions to maintain context.

**Example - Multi-turn conversation:**

```bash
# First call - creates session
codex exec "What is 2+2?"
# Output includes: session id: 019a1d42-213e-7103-bc5b-89f0fd65b361
# Response: 4

# Second call - resume session (remembers previous context)
codex exec resume 019a1d42-213e-7103-bc5b-89f0fd65b361 "What number did I just ask about?"
# Response: 4 ✓ (remembers!)

# Third call - continues context
codex exec resume 019a1d42-213e-7103-bc5b-89f0fd65b361 "Multiply that by 3"
# Response: 12 ✓ (4 × 3, full memory intact!)
```

**Resume most recent session:**
```bash
codex exec resume --last "Continue from where we left off"
```

**Benefits:**
- ✅ Full conversation history maintained
- ✅ No need to re-explain context
- ✅ Agent can reference all previous work
- ✅ Perfect for multi-step tasks

**Use for:**
- Complex feature implementations spanning multiple steps
- Iterative debugging and refinement
- Long-running refactoring tasks
- Code reviews with follow-up questions

---

### Gemini: Stateless (No Session Memory) ❌

**Gemini `gemini -p` calls are stateless - no memory between calls.**

Each call is independent. However, we can provide context via **gemini.md**.

**Context File: `gemini.md`**

Located at: `/Users/kyin/Projects/Americano/gemini.md`

This file contains:
- Project overview and architecture
- Technology stack and ADRs
- Completed epics summary
- Development standards
- Key file locations
- Common tasks

**How to use with Gemini:**

```bash
# IMPORTANT: Always mention gemini.md in your prompt
gemini -p "Read gemini.md for project context, then analyze the Epic 5 architecture" --output-format json
```

**For Claude Code orchestrator:**
- ⚠️ **Remember to read `gemini.md` before calling Gemini**
- Include relevant context from gemini.md in your prompt
- Gemini cannot access previous conversation history

**Workaround for multi-turn tasks:**
```bash
# Capture output from first call
result1=$(gemini -p "Analyze authentication system" --output-format json)

# Pass that output as context to next call
gemini -p "Based on this analysis: $(echo "$result1" | jq -r '.response'), suggest improvements" --output-format json
```

**Use for:**
- One-shot analysis tasks
- Documentation generation
- Code reviews (single pass)
- Quick questions

---

## Orchestration Architecture

**Recommended pattern for multi-agent workflows:**

```
User → Claude Code → General Agent → {
    Codex (stateful sessions)
        ├─ Create session: codex exec "task"
        ├─ Continue: codex exec resume <SESSION_ID> "next step"
        └─ Maintains full memory

    Gemini (stateless, context via gemini.md)
        ├─ Read context: gemini.md
        ├─ One-shot: gemini -p "task (see gemini.md for context)"
        └─ No memory between calls
}
```

**Example workflow:**

```bash
# Claude Code reads gemini.md
cat gemini.md

# Calls Codex for implementation (creates session)
SESSION=$(codex exec "Implement dashboard UI" 2>&1 | grep "session id" | awk '{print $3}')

# Continues same session for iterations
codex exec resume $SESSION "Add error handling to the dashboard"
codex exec resume $SESSION "Add tests for the dashboard"

# Calls Gemini for documentation (includes context)
gemini -p "Read gemini.md, then document the new dashboard component" --output-format json
```

---

## Use Cases for Americano Project

### Gemini Use Cases

1. **Documentation Generation**
   ```bash
   gemini -p "Generate API documentation for Epic 5 behavioral analytics endpoints" --output-format json
   ```

2. **Code Review**
   ```bash
   gemini -p "Review this PR for security issues and best practices" --include-directories apps/api,apps/web
   ```

3. **Architecture Analysis**
   ```bash
   gemini -p "Analyze the hybrid TypeScript/Python architecture and suggest improvements"
   ```

4. **Test Generation**
   ```bash
   gemini -p "Generate test cases for the behavioral twin engine" --all-files
   ```

### Codex Use Cases

1. **Feature Implementation**
   ```bash
   codex exec --full-auto "Implement Story 4.7: Add user preference settings for validation prompts"
   ```

2. **Bug Fixes**
   ```bash
   codex exec -s workspace-write "Fix the caching issue in Epic 5 analytics endpoints"
   ```

3. **Refactoring**
   ```bash
   codex exec -a on-request "Refactor the validation engine to use strategy pattern"
   ```

4. **UI Development**
   ```bash
   codex exec -i mockup.png "Implement this dashboard design using shadcn/ui components"
   ```

---

## Best Practices

### General

1. **Start with safer modes** - Use read-only or workspace-write sandboxes before full access
2. **Review outputs** - Always review AI-generated code before committing
3. **Use appropriate tools** - Gemini for analysis/docs, Codex for code generation
4. **Context matters** - Use `--include-directories` or `-C` to provide relevant context

### For Americano Project

1. **Follow CLAUDE.md standards** - Ensure AI agents respect TypeScript/Python split
2. **Verify dependencies** - Check that agents use correct libraries (motion.dev, not framer-motion)
3. **Test coverage** - Ask agents to include tests with code changes
4. **Documentation** - Request docstrings/JSDoc comments for new code
5. **Type safety** - Ensure TypeScript code uses strict mode and proper types

---

## Troubleshooting

### Gemini

**Issue: "Command not found"**
```bash
# Verify installation
which gemini

# Check environment
echo $GEMINI_API_KEY
```

**Issue: "API rate limit exceeded"**
```bash
# Use specific model to reduce usage
gemini -m gemini-2.5-flash -p "prompt"
```

### Codex

**Issue: "Authentication failed"**
```bash
codex login
```

**Issue: "Sandbox execution failed"**
```bash
# Try with full access (if safe)
codex exec -s danger-full-access "Your command"
```

---

## References

- **gemini.md**: Project context file for Gemini (read before calling Gemini)
- **MCP Setup Guide**: `docs/mcp-setup-guide.md` (context7 + chrome-devtools-mcp configuration)
- **Gemini CLI Docs**: `/google-gemini/gemini-cli`
- **Codex CLI**: `codex --help`
- **CLAUDE.md**: Project standards and architecture decisions
- **AGENTS.MD**: Agent development protocol

---

## Version History

- **1.1** (2025-10-25): Added session memory findings - Codex has full session memory via `resume`, Gemini is stateless. Added gemini.md context file and orchestration patterns
- **1.0** (2025-10-25): Initial documentation with Gemini and Codex usage patterns
