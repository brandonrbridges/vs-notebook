# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## VS Code Extension Overview

This is VS Notebook, a VS Code extension that allows users to create, manage, and view notes tied to specific lines or ranges of code within their workspace. Notes are stored as markdown files in a `.vs-notebook` directory and can be organized by file or tag.

## Build and Development Commands

We use Bun as our package manager and build tool. Here are the key commands for development:

```bash
# Compile TypeScript and lint (development)
bun run compile

# Watch mode for development
bun run watch

# Type checking only
bun run check-types

# Linting
bun run lint

# Package for production (includes type check and lint)
bun run package

# Publish to VS Code marketplace
bun run vscode:publish

# Run tests
bun run test

# Compile tests
bun run compile-tests
```

## Core Architecture

### Extension Entry Point (`src/extension.ts:12`)

- `activate()` function initializes two tree data providers: workspace notes and global notes
- Registers all commands, code lens provider, and event listeners
- Notes are stored in `.vs-notebook` directory in workspace root
- Global notes are stored in `~/.vs-notebook-global` directory

### Key Components

**NotesProvider (`src/notes-provider.ts:7`)**

- Implements `vscode.TreeDataProvider<TreeItem>` for sidebar tree views
- Supports grouping notes by file or tag via `vs-notebook.groupBy` configuration
- Handles note frontmatter parsing with metadata (file, line, tags)
- Two instances: workspace notes and global notes

**NotesLensProvider (`src/lens-provider.ts:5`)**

- Implements `vscode.CodeLensProvider` to show note counts above code lines
- Refreshes when notes are added/modified/deleted
- Shows clickable links like "2 notes for this line" or "1 note for lines 10-15"

**NoteItem (`src/notes-provider.ts:196`)**

- Represents individual notes in the tree view
- Icons vary by tag: feature (star), bug (bug icon), todo (checklist), refactor (tools)
- Includes frontmatter parsing for metadata extraction

## Note Storage Format

Notes are markdown files with YAML frontmatter:

```markdown
---
title: Note Title
file: /path/to/file.js
line: 42
tags: feature, important
url:
---

Note content goes here...
```

## Key VS Code API Integration

- **Tree Data Providers**: Two sidebar views (workspace and global notes)
- **Code Lens Provider**: Shows note indicators in editor
- **Commands**: 7 registered commands for creating, deleting, renaming notes
- **Configuration**: `vs-notebook.groupBy` setting (none/file/tag)
- **File System Events**: Watches for note file changes to refresh views

## Testing

Tests are located in `src/test/extension.test.ts`. Use the VS Code Test Runner with the configured test scripts.
