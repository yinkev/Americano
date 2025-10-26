---
title: "MCP Setup Guide - Model Context Protocol"
description: "Configuration and usage of MCP servers for AI agents (Gemini, Codex, Claude)"
type: "Guide"
status: "Active"
version: "1.0"
owner: "Kevy"
review_cadence: "Per Change"
created_date: "2025-10-25T11:00:00-07:00"
last_updated: "2025-10-25T11:00:00-07:00"
audience:
  - experienced-devs
  - architects
technical_level: "Intermediate"
tags: ["mcp", "ai-agents", "gemini", "codex", "chrome-devtools", "context7"]
---

# MCP Setup Guide

Model Context Protocol (MCP) servers provide AI agents with access to external tools and data sources.

---

## Configured MCP Servers

### 1. context7 ✅

**Purpose:** Fetch up-to-date library documentation

**Available in:**
- ✅ Gemini CLI
- ✅ Codex CLI
- ✅ Claude Code

**Capabilities:**
- Resolve library IDs from names
- Get latest documentation for any library
- Topic-focused documentation retrieval
- Code examples and usage patterns

**Usage:**
```bash
# Via Gemini
gemini -p "Use context7 to get Next.js App Router documentation"

# Via Codex
codex exec "Use context7 to fetch shadcn/ui button component docs"

# Direct (Claude Code)
mcp__context7__resolve-library-id("next.js")
mcp__context7__get-library-docs("/vercel/next.js", topic="app router")
```

**When to use:**
- Before using any framework or library
- To check for API changes
- To verify correct usage patterns
- For code examples

---

### 2. chrome-devtools-mcp ✅

**Purpose:** Browser automation, testing, and performance analysis

**Available in:**
- ✅ Gemini CLI (connected)
- ✅ Codex CLI (enabled)
- ⚠️ Claude Code (to verify)

**Capabilities:**

#### Input Automation (8 tools)
- Click elements
- Drag and drop
- Fill forms
- Handle dialogs
- Hover interactions
- Press keys
- Type text
- Upload files

#### Navigation (6 tools)
- Open/close pages
- Navigate to URLs
- Manage tabs
- Wait for elements
- Refresh pages
- Go back/forward

#### Emulation (3 tools)
- CPU throttling
- Network simulation (3G, 4G, offline)
- Viewport resizing (mobile, tablet, desktop)

#### Performance (3 tools)
- Record performance traces
- Analyze Core Web Vitals
- Measure page load metrics
- Identify performance bottlenecks

#### Network (2 tools)
- Inspect HTTP requests
- Analyze responses
- Check caching behavior
- Monitor API calls

#### Debugging (5 tools)
- Execute JavaScript
- Capture screenshots
- DOM snapshots
- Console message review
- Error detection

**Usage:**
```bash
# Via Gemini
gemini -p "Use chrome-devtools-mcp to open https://example.com and take a screenshot"

# Via Codex
codex exec "Use chrome-devtools-mcp to test the dashboard UI at localhost:3000"
```

**When to use:**
- UI/UX testing and validation
- Performance analysis (traces, Core Web Vitals)
- End-to-end test automation
- Screenshot and visual regression testing
- Network debugging and API inspection
- Accessibility testing

---

## Setup Status

### Gemini CLI

**Status:** ✅ Fully Connected

**MCP Servers:**
```
✓ zen: Connected
✓ context7: Connected
✓ chrome-devtools: Connected
✓ nanobanana: Connected
```

**Verification:**
```bash
gemini mcp list
```

---

### Codex CLI

**Status:** ✅ Fully Enabled

**MCP Servers:**
```
✓ context7: Enabled
✓ chrome-devtools: Enabled
```

**Verification:**
```bash
codex mcp list
```

**Configuration:**
```bash
# context7 was pre-configured
# chrome-devtools added via:
codex mcp add chrome-devtools npx -y chrome-devtools-mcp@latest
```

---

### Claude Code

**Status:** ✅ Partial (context7 verified, chrome-devtools TBD)

**Available MCP Tools:**
- `mcp__context7__resolve-library-id`
- `mcp__context7__get-library-docs`
- `mcp__chrome-devtools__*` (to verify)

**Verification:**
Check available tools in Claude Code session.

---

## Agent Requirements

### All Agents MUST:

1. ✅ **Read documentation:**
   - `AGENTS.MD` - Agent development protocol
   - `CLAUDE.md` - Project standards
   - `gemini.md` - Project context (includes MCP info)

2. ✅ **Use context7 before using libraries:**
   ```
   Before: Using shadcn/ui Button component
   Action: Fetch latest shadcn/ui docs via context7
   Why: Ensure using correct API, no deprecated patterns
   ```

3. ✅ **Use chrome-devtools-mcp for UI/testing:**
   ```
   Before: Implementing dashboard UI
   Action: Test with chrome-devtools-mcp after implementation
   Why: Validate responsiveness, performance, accessibility
   ```

---

## Usage Examples

### Example 1: Library Documentation (context7)

**Scenario:** Implementing authentication with NextAuth.js

```bash
# Step 1: Resolve library ID
gemini -p "Use context7 to resolve library ID for next-auth"

# Step 2: Get documentation
gemini -p "Use context7 to get next-auth documentation on providers and session handling"

# Step 3: Implement with correct patterns
codex exec "Read gemini.md. Use context7 for next-auth docs. Implement OAuth providers."
```

---

### Example 2: UI Testing (chrome-devtools-mcp)

**Scenario:** Testing responsive dashboard UI

```bash
# Step 1: Start development server
# Terminal 1: npm run dev

# Step 2: Test with Codex
codex exec "Use chrome-devtools-mcp to:
1. Open http://localhost:3000/dashboard
2. Resize viewport to mobile (375x667)
3. Take screenshot
4. Test navigation menu interaction
5. Record performance trace
6. Report any issues"
```

---

### Example 3: Performance Analysis (chrome-devtools-mcp)

**Scenario:** Analyze Epic 5 analytics dashboard performance

```bash
codex exec "Use chrome-devtools-mcp to:
1. Open http://localhost:3000/analytics/dashboard
2. Record performance trace for page load
3. Measure Core Web Vitals (LCP, FID, CLS)
4. Analyze network requests (count, size, caching)
5. Identify performance bottlenecks
6. Provide optimization recommendations"
```

---

### Example 4: Multi-Agent Workflow

**Scenario:** Implement new feature with MCP usage

```bash
# Phase 1: Research (Gemini + context7)
gemini -p "Read gemini.md. Use context7 to research React 19 use hook. Provide best practices."

# Phase 2: Planning (Codex + context7)
codex exec "Read AGENTS.MD, CLAUDE.md, gemini.md. Use context7 for React 19 docs. Plan implementation of custom useAuth hook."

# Phase 3: Implementation (General Agent)
# Claude Code spawns agent with:
# "Read AGENTS.MD, CLAUDE.md, gemini.md. Use context7 for React 19 docs. Implement useAuth hook."

# Phase 4: Testing (Codex + chrome-devtools-mcp)
codex exec resume [SESSION_ID] "Use chrome-devtools-mcp to test the useAuth hook in login page. Verify authentication flow."
```

---

## Verification Commands

### Check Gemini MCP Status
```bash
gemini mcp list
```

**Expected output:**
```
✓ context7: Connected
✓ chrome-devtools: Connected
```

### Check Codex MCP Status
```bash
codex mcp list
```

**Expected output:**
```
Name             Command  Args                           Status
chrome-devtools  npx      -y chrome-devtools-mcp@latest  enabled
context7         npx      -y @upstash/context7-mcp       enabled
```

### Test Gemini MCP Awareness
```bash
gemini -p "Read gemini.md. List the two MCP servers available."
```

**Expected response:**
```
1. context7
2. chrome-devtools-mcp
```

### Test Codex MCP Awareness
```bash
codex exec "Read gemini.md. What MCP servers are available?"
```

**Expected response:**
```
context7 and chrome-devtools-mcp
```

---

## Troubleshooting

### Issue: "MCP server not found"

**Solution:**
```bash
# For Gemini
gemini mcp list  # Verify server is connected

# For Codex
codex mcp list  # Verify server is enabled

# Re-add if missing (Codex example)
codex mcp add chrome-devtools npx -y chrome-devtools-mcp@latest
```

---

### Issue: "context7 not resolving library"

**Solution:**
```bash
# Try exact library name
# Wrong: "nextjs"
# Right: "next.js"

# Use full search query
gemini -p "Use context7 to resolve library ID for 'Next.js framework'"
```

---

### Issue: "chrome-devtools-mcp connection failed"

**Prerequisites:**
- Node.js v20.19+
- Chrome browser installed
- npm available

**Solution:**
```bash
# Verify Node version
node --version  # Should be >= v20.19

# Verify Chrome installed
which google-chrome-stable || which chrome

# Reinstall chrome-devtools-mcp
codex mcp remove chrome-devtools
codex mcp add chrome-devtools npx -y chrome-devtools-mcp@latest
```

---

### Issue: "Agent not using MCP servers"

**Solution:**

1. **Ensure agent reads docs:**
   ```bash
   # Agent prompt MUST include:
   "Read AGENTS.MD, CLAUDE.md, gemini.md. Use context7 for [library] docs."
   ```

2. **Verify gemini.md mentions MCP:**
   ```bash
   cat gemini.md | grep -A5 "MCP Servers"
   ```

3. **Explicitly request MCP usage:**
   ```bash
   codex exec "IMPORTANT: Use chrome-devtools-mcp to test the UI. Then implement fixes."
   ```

---

## Adding New MCP Servers

### For Gemini

Gemini MCP servers are typically configured via Gemini settings. Check:
```bash
gemini mcp list
```

### For Codex

Add new MCP server:
```bash
codex mcp add <server-name> <command> [args...]

# Example: Add hypothetical database-inspector MCP
codex mcp add db-inspector npx -y database-inspector-mcp
```

Remove MCP server:
```bash
codex mcp remove <server-name>

# Example
codex mcp remove db-inspector
```

---

## Best Practices

### 1. Always Use context7 Before Libraries

**❌ Bad:**
```bash
codex exec "Implement authentication with NextAuth.js"
# Might use outdated patterns
```

**✅ Good:**
```bash
codex exec "Use context7 to get latest NextAuth.js docs. Then implement authentication following current best practices."
```

---

### 2. Test UI with chrome-devtools-mcp

**❌ Bad:**
```bash
codex exec "Implement dashboard UI"
# No validation
```

**✅ Good:**
```bash
codex exec "Implement dashboard UI. Then use chrome-devtools-mcp to:
1. Test on mobile (375x667) and desktop (1920x1080)
2. Capture screenshots
3. Record performance trace
4. Verify no console errors"
```

---

### 3. Include MCP in Agent Prompts

**❌ Bad:**
```bash
# General agent spawned with:
"Implement feature X"
```

**✅ Good:**
```bash
# General agent spawned with:
"Read AGENTS.MD, CLAUDE.md, gemini.md. Use context7 for [library] docs. Use chrome-devtools-mcp for testing. Implement feature X."
```

---

## References

- **gemini.md:** Project context (includes MCP server details)
- **CLAUDE.md:** Project standards
- **AGENTS.MD:** Agent development protocol
- **context7 Docs:** https://context7.com
- **chrome-devtools-mcp Repo:** https://github.com/ChromeDevTools/chrome-devtools-mcp

---

## Version History

- **1.0** (2025-10-25): Initial MCP setup documentation
  - Configured chrome-devtools-mcp in Codex
  - Updated gemini.md with MCP server info
  - Verified Gemini and Codex MCP access
  - Documented usage patterns and troubleshooting
