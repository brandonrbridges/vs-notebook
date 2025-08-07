# VS Notebook

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/brandonbridges.vs-notebook?label=VS%20Marketplace&color=green)](https://marketplace.visualstudio.com/items?itemName=brandonbridges.vs-notebook)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/brandonbridges.vs-notebook?color=blue)](https://marketplace.visualstudio.com/items?itemName=brandonbridges.vs-notebook)

## Add a Notebook to your Project

![VS Notebook Icon](./src/assets/icon.png)

![VS Notebook Demo](./src/assets/demo.png)

VS Notebook is the quickest way to build a reliable notebook for your Project.

All notes are stored in `./vs-notebook` directory in your workspace so they can be easily shared with your team and safely committed to your version control system.

<a href="https://www.buymeacoffee.com/brandonrbridges" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="auto" width="200"></a>

---

## Features

- **Robust Note Storage**  
  All notes are stored as Markdown with YAML frontmatter in a dedicated `.vs-notebook` directory, supporting version control, audit trails, and easy backup.

- **Multi-Level Organization**  
  Group notes by file, tag, or view all in a flat list. Supports granular organization for large codebases and cross-team projects.

- **Advanced Tagging & Prioritization**  
  Add comma-separated tags to any note. Special tags (e.g., `important`, `feature`, `bug`, `todo`, `refactor`) trigger custom icons and behaviors. Notes tagged as `important` are always shown at the top, sorted alphabetically, and display an exclamation mark icon.

- **Global & Workspace Notes**  
  Create notes tied to specific files, code blocks, or globally for project-wide documentation and knowledge sharing.

- **Powerful Sidebar & Search**  
  Dedicated sidebar for browsing, searching, and managing notes. Filter and search notes by content, tag, or file.

- **Contextual Actions & Code Lens Integration**  
  Inline indicators show the number of notes per line or block. Context menu actions for quick update, rename, or delete.

- **Real-Time Sync & File Watching**  
  Notes are automatically refreshed in the sidebar and Code Lens when files are added, changed, or deleted. Supports both workspace and global notes directories.

- **Customizable Settings**  
  Configure grouping, appearance, and behaviors via extension settings. Easily access settings from the sidebar.

- **Version Control & Compliance**  
  All notes are version-controlled, supporting audit requirements and team collaboration.

- **Comprehensive Test Suite**  
  Automated tests ensure stability and correct behavior for note creation, grouping, searching, and file watching.

---

### 📝 Create Notes Anywhere

Quickly create notes tied to specific lines, code blocks, files, folders, or globally.

Use the Command Palette (CMD/CTRL + SHIFT + P) and type VS Notebook: Create Note or VS Notebook: Create Global Note.

Notes are stored as Markdown files with YAML frontmatter for easy parsing and version control.

### 🌍 Global Notes

Create notes not tied to any specific file—great for general documentation, snippets, or project-wide todos.

Global notes are stored in your home directory and accessible from any workspace.

### 📂 Organize by File, Tag, or None

Group notes by the file they belong to, by tag, or view all notes in a flat list.

Flexible organization helps you find and manage notes efficiently.

### 🏷️ Tagging System

Add comma-separated tags to any note for better categorization.

Special tags (like important, feature, bug, todo, refactor) can trigger custom icons or behaviors in the sidebar.

Notes tagged as important are always shown at the top of the list, sorted alphabetically, and display an exclamation mark icon.

### 🔍 Powerful Sidebar Views

Dedicated sidebar (Activity Bar) for browsing, searching, and managing notes.

Two views: "My Notes" (workspace-specific) and "Global Notes" (accessible from any workspace).

Search and filter notes directly from the sidebar.

### ✏️ Update, Rename, and Delete Notes

Select a note in the sidebar to view, update, rename, or delete it.

Context menu actions for quick management.

### 👀 Code Lens Integration

Inline indicators show the number of notes attached to each line or code block.

Clickable links above code lines to quickly open related notes.

### 🔄 Real-Time Sync & File Watching

Notes are automatically refreshed in the sidebar and Code Lens when files are added, changed, or deleted.

Supports both workspace and global notes directories.

### 🛠️ Customizable Settings

Configure grouping behavior (none, file, or tag) via the extension settings.

Easily access settings from the sidebar.

### 💾 Version Control Friendly

All notes are stored in a `.vs-notebook` directory in your workspace, making them easy to share and track with Git or other VCS.

### 🧪 Tested and Reliable

Comprehensive test suite ensures stability and correct behavior for note creation, grouping, searching, and file watching.

## Requirements

No additional requirements are needed to use VS Notebook.

## Extension Settings

The VS Notebook extension contributes the following settings:

- `vsNotes.groupBy` - Group notes by `file` or `tag`.

## Known Issues

Please see [GitHub Issues](https://github.com/brandonrbridges/vs-notebook/issues) for a list of known issues and feature requests.

## Testing

Automated tests for note creation, grouping, search, and file watching.

- Version controlled and shareable
- Code Lens support to show the number of notes per line/block
