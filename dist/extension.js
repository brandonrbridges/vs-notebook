"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));
var path3 = __toESM(require("path"));
var fs3 = __toESM(require("fs"));

// src/notes-provider.ts
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var NotesProvider = class {
  constructor(workspaceRoot, isGlobal) {
    this.workspaceRoot = workspaceRoot;
    this.isGlobal = isGlobal;
  }
  _onDidChangeTreeData = new vscode.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No workspace open");
      return Promise.resolve([]);
    }
    const notesPath = this.isGlobal ? this.workspaceRoot : path.join(this.workspaceRoot, ".vs-notebook");
    if (!fs.existsSync(notesPath)) {
      return Promise.resolve([]);
    }
    if (element && element instanceof GroupItem) {
      return Promise.resolve(element.children);
    }
    const files = fs.readdirSync(notesPath).filter((file) => file.endsWith(".md"));
    const notes = files.map((file) => {
      const fullPath = path.join(notesPath, file);
      return new NoteItem(file, fullPath);
    });
    const config = vscode.workspace.getConfiguration("vs-notebook");
    let groupBy = config.get("groupBy", "none");
    if (this.isGlobal && groupBy === "file") {
      groupBy = "tag";
    }
    if (groupBy === "none") {
      return Promise.resolve(notes);
    }
    const groups = this.groupNotes(notes, groupBy);
    return Promise.resolve(groups);
  }
  async search(query) {
    if (!this.workspaceRoot) {
      return [];
    }
    const notesPath = path.join(this.workspaceRoot, ".vs-notebook");
    if (!fs.existsSync(notesPath)) {
      return [];
    }
    const files = fs.readdirSync(notesPath).filter((f) => f.endsWith(".md"));
    const lowerQuery = query.toLowerCase();
    const matches = [];
    for (const file of files) {
      const fullPath = path.join(notesPath, file);
      const content = fs.readFileSync(fullPath, "utf-8").toLowerCase();
      if (content.includes(lowerQuery)) {
        matches.push(new NoteItem(file, fullPath));
      }
    }
    return matches;
  }
  groupNotes(notes, groupBy) {
    switch (groupBy) {
      case "file":
        return this.groupByFile(notes);
      case "tag":
        return this.groupByTag(notes);
      default:
        return notes;
    }
  }
  groupByFile(notes) {
    const groups = /* @__PURE__ */ new Map();
    for (const note of notes) {
      const metadata = NoteItem.readFrontmatter(note.fullPath);
      const fileName = metadata.file ? path.basename(metadata.file) : "Unknown File";
      if (!groups.has(fileName)) {
        groups.set(fileName, []);
      }
      groups.get(fileName).push(note);
    }
    const groupItems = [];
    for (const [fileName, groupNotes] of groups) {
      groupItems.push(new GroupItem(fileName, groupNotes, "file"));
    }
    return groupItems.sort((a, b) => a.label.localeCompare(b.label));
  }
  groupByTag(notes) {
    const groups = /* @__PURE__ */ new Map();
    for (const note of notes) {
      const metadata = NoteItem.readFrontmatter(note.fullPath);
      let tags = metadata.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
      let firstTag = tags.length > 0 ? tags[0] : "Untagged";
      if (!firstTag) {
        firstTag = "Untagged";
      }
      firstTag = firstTag.charAt(0).toUpperCase() + firstTag.slice(1);
      if (!groups.has(firstTag)) {
        groups.set(firstTag, []);
      }
      groups.get(firstTag).push(note);
    }
    const groupItems = [];
    for (const [tag, groupNotes] of groups) {
      groupItems.push(new GroupItem(tag, groupNotes, "tag"));
    }
    return groupItems.sort((a, b) => a.label.localeCompare(b.label));
  }
};
var GroupItem = class extends vscode.TreeItem {
  constructor(label, children, groupType) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.label = label;
    this.children = children;
    this.groupType = groupType;
    this.tooltip = `${this.children.length} note${this.children.length !== 1 ? "s" : ""}`;
    this.description = `${this.children.length}`;
    if (groupType === "file") {
      this.iconPath = new vscode.ThemeIcon("file");
    } else {
      this.iconPath = new vscode.ThemeIcon("tag");
    }
    this.contextValue = "groupItem";
  }
};
var NoteItem = class _NoteItem extends vscode.TreeItem {
  constructor(label, fullPath) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.label = label;
    this.fullPath = fullPath;
    const metadata = _NoteItem.readFrontmatter(fullPath);
    const tags = metadata.tags?.split(",").map((t) => t.trim()) ?? [];
    if (tags.includes("feature")) {
      this.iconPath = new vscode.ThemeIcon(
        "star",
        new vscode.ThemeColor("charts.green")
      );
    } else if (tags.includes("bug")) {
      this.iconPath = new vscode.ThemeIcon(
        "bug",
        new vscode.ThemeColor("errorForeground")
      );
    } else if (tags.includes("todo")) {
      this.iconPath = new vscode.ThemeIcon(
        "checklist",
        new vscode.ThemeColor("charts.yellow")
      );
    } else if (tags.includes("refactor")) {
      this.iconPath = new vscode.ThemeIcon(
        "tools",
        new vscode.ThemeColor("charts.blue")
      );
    } else {
      this.iconPath = new vscode.ThemeIcon("note");
    }
    this.tooltip = `${label}
${metadata.file ?? ""} : ${metadata.line ?? ""}${metadata.tags ? "\nTags: " + metadata.tags : ""}`;
    this.description = metadata.file ? `${path.basename(metadata.file)} ${metadata.tags ? ` \u2022 ${metadata.tags}` : ""}` : "";
    this.command = {
      command: "vs-notebook.openNote",
      title: "Open Note",
      arguments: [this.fullPath]
    };
    this.resourceUri = vscode.Uri.file(this.fullPath);
    this.contextValue = "noteItem";
  }
  static readFrontmatter(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (match) {
        const frontmatter = match[1];
        const lines = frontmatter.split("\n");
        const meta = {};
        for (const line of lines) {
          const [key, ...rest] = line.split(":");
          meta[key.trim()] = rest.join(":").trim();
        }
        return { file: meta["file"], line: meta["line"], tags: meta["tags"] };
      }
    } catch (err) {
      console.error("Failed to read frontmatter:", err);
    }
    return {};
  }
};

// src/lens-provider.ts
var vscode2 = __toESM(require("vscode"));
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var NotesLensProvider = class {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.refreshNotes();
  }
  _onDidChangeCodeLenses = new vscode2.EventEmitter();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  notes = {};
  refreshNotes() {
    this.notes = {};
    const notesDir = path2.join(this.workspaceRoot, ".vs-notebook");
    if (!fs2.existsSync(notesDir)) {
      return;
    }
    const files = fs2.readdirSync(notesDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const fullPath = path2.join(notesDir, file);
      const content = fs2.readFileSync(fullPath, "utf8");
      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (!match) {
        continue;
      }
      const frontmatter = Object.fromEntries(
        match[1].split("\n").map((line) => {
          const [key, ...rest] = line.split(":");
          return [key.trim(), rest.join(":").trim()];
        })
      );
      if (frontmatter.file && frontmatter.line) {
        const key = path2.resolve(frontmatter.file);
        const lineStr = frontmatter.line;
        let lineStart = null;
        let lineEnd = null;
        if (lineStr.includes("-")) {
          const parts = lineStr.split("-").map((n) => parseInt(n));
          if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
            lineStart = parts[0] - 1;
            lineEnd = parts[1] - 1;
          }
        } else {
          const n = parseInt(lineStr);
          if (!isNaN(n)) {
            lineStart = lineEnd = n - 1;
          }
        }
        if (lineStart !== null && lineEnd !== null) {
          if (!this.notes[key]) {
            this.notes[key] = [];
          }
          this.notes[key].push({ start: lineStart, end: lineEnd });
        }
      }
    }
  }
  refresh() {
    this.refreshNotes();
    this._onDidChangeCodeLenses.fire();
  }
  provideCodeLenses(document) {
    const docPath = path2.resolve(document.uri.fsPath);
    const ranges = this.notes[docPath] ?? [];
    const grouped = ranges.reduce((acc, range) => {
      const key = range.start;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(range);
      return acc;
    }, {});
    const lenses = [];
    Object.entries(grouped).forEach(([startLineStr, ranges2]) => {
      const startLine = parseInt(startLineStr);
      const count = ranges2.length;
      const singleLine = ranges2.length === 1 && ranges2[0].start === ranges2[0].end;
      const title = singleLine ? `${count} note${count > 1 ? "s" : ""} for this line` : `${count} note${count > 1 ? "s" : ""} for lines ${ranges2[0].start + 1}-${ranges2[0].end + 1}`;
      lenses.push(
        new vscode2.CodeLens(new vscode2.Range(startLine, 0, startLine, 0), {
          title,
          command: singleLine ? "vs-notebook.openNotesForLine" : "vs-notebook.openNotesForRange",
          arguments: singleLine ? [docPath, startLine + 1] : [docPath, ranges2[0].start + 1, ranges2[0].end + 1]
        })
      );
    });
    return lenses;
  }
};

// src/extension.ts
function activate(context) {
  const rootPath = vscode3.workspace.workspaceFolders?.[0].uri.fsPath ?? "";
  const userHome = require("os").homedir();
  const globalNotesDir = path3.join(userHome, ".vs-notebook-global");
  const notesProvider = new NotesProvider(rootPath, false);
  vscode3.window.registerTreeDataProvider("vs-notebook-notes", notesProvider);
  const globalNotesProvider = new NotesProvider(globalNotesDir, true);
  vscode3.window.registerTreeDataProvider(
    "vs-notebook-notes-global",
    globalNotesProvider
  );
  const lensProvider = new NotesLensProvider(rootPath);
  context.subscriptions.push(
    vscode3.languages.registerCodeLensProvider({ scheme: "file" }, lensProvider)
  );
  vscode3.commands.registerCommand("vs-notebook.openSettings", () => {
    vscode3.commands.executeCommand(
      "workbench.action.openSettings",
      "@ext:brandonbridges.vs-notebook"
    );
  });
  context.subscriptions.push(
    vscode3.commands.registerCommand(
      "vs-notebook.openNote",
      (notePath) => {
        vscode3.workspace.openTextDocument(notePath).then((doc) => {
          vscode3.window.showTextDocument(doc);
        });
      }
    ),
    vscode3.commands.registerCommand("vs-notebook.refreshNotes", () => {
      notesProvider.refresh();
      globalNotesProvider.refresh();
      lensProvider.refresh();
    })
  );
  const createNote = vscode3.commands.registerCommand(
    "vs-notebook.createNote",
    async () => {
      const title = await vscode3.window.showInputBox({
        prompt: "Enter note title"
      });
      if (!title) {
        return;
      }
      const description = await vscode3.window.showInputBox({
        prompt: "Enter note description"
      });
      const tags = await vscode3.window.showInputBox({
        prompt: "Enter tags (comma-separated, optional)"
      });
      const editor = vscode3.window.activeTextEditor;
      const filePath = editor?.document.uri.fsPath ?? "Unknown";
      const selection = editor?.selection;
      let contentFormatter = `title: ${title}
file: ${filePath}
`;
      if (selection?.isEmpty) {
        const lineNumber2 = selection.active.line + 1;
        contentFormatter += `line: ${lineNumber2}
`;
      } else if (selection) {
        const lineStart = selection.start.line + 1;
        const lineEnd = selection.end.line + 1;
        contentFormatter += `line: ${lineStart}-${lineEnd}
`;
      }
      contentFormatter += `tags: ${tags || ""}`;
      contentFormatter += `
url: `;
      const lineNumber = editor ? editor.selection.active.line + 1 : "Unknown";
      const workspaceFolders = vscode3.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode3.window.showErrorMessage("No workspace folder found.");
        return;
      }
      const rootPath2 = workspaceFolders[0].uri.fsPath;
      const notesDirectory = path3.join(rootPath2, ".vs-notebook");
      const notePath = path3.join(
        notesDirectory,
        `${title.replace(/\s+/g, "-")}.md`
      );
      if (!fs3.existsSync(notesDirectory)) {
        fs3.mkdirSync(notesDirectory, { recursive: true });
      }
      const content = `---
${contentFormatter}
---

${description || ""}`;
      fs3.writeFileSync(notePath, content);
      vscode3.window.showInformationMessage(`Note "${title}" created.`);
      vscode3.workspace.openTextDocument(notePath).then((doc) => {
        vscode3.window.showTextDocument(doc, {
          viewColumn: vscode3.ViewColumn.Beside,
          preserveFocus: false,
          preview: false
        });
      });
    }
  );
  const createGlobalNote = vscode3.commands.registerCommand(
    "vs-notebook.createGlobalNote",
    async () => {
      const title = await vscode3.window.showInputBox({
        prompt: "Enter global note title"
      });
      if (!title) {
        return;
      }
      const description = await vscode3.window.showInputBox({
        prompt: "Enter note description"
      });
      const tags = await vscode3.window.showInputBox({
        prompt: "Enter tags (comma-separated, optional)"
      });
      if (!fs3.existsSync(globalNotesDir)) {
        fs3.mkdirSync(globalNotesDir, { recursive: true });
      }
      const notePath = path3.join(
        globalNotesDir,
        `${title.replace(/\s+/g, "-")}.md`
      );
      const content = `---
title: ${title}
tags: ${tags || ""}
url: 
---

${description || ""}`;
      fs3.writeFileSync(notePath, content);
      vscode3.window.showInformationMessage(`Global note "${title}" created.`);
      vscode3.workspace.openTextDocument(notePath).then((doc) => {
        vscode3.window.showTextDocument(doc, {
          viewColumn: vscode3.ViewColumn.Beside,
          preserveFocus: false,
          preview: false
        });
      });
      globalNotesProvider.refresh();
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.deleteNote",
    async (item) => {
      const notePath = item.fullPath;
      const confirm = await vscode3.window.showWarningMessage(
        "Are you sure you want to delete this note?",
        { modal: true },
        "Yes",
        "No"
      );
      if (confirm === "Yes") {
        await vscode3.workspace.fs.delete(vscode3.Uri.file(notePath));
        vscode3.window.showInformationMessage("Note deleted");
        notesProvider.refresh();
        globalNotesProvider.refresh();
        lensProvider.refresh();
      }
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.renameNote",
    async (item) => {
      const notePath = item.fullPath;
      const oldName = path3.basename(notePath, ".md");
      const newName = await vscode3.window.showInputBox({
        prompt: "Enter new note name",
        value: oldName
      });
      if (!newName || newName === oldName) {
        return;
      }
      const newPath = path3.join(
        path3.dirname(notePath),
        `${newName.replace(/\s+/g, "-")}.md`
      );
      await vscode3.workspace.fs.rename(
        vscode3.Uri.file(notePath),
        vscode3.Uri.file(newPath)
      );
      vscode3.window.showInformationMessage("Note renamed");
      notesProvider.refresh();
      globalNotesProvider.refresh();
      lensProvider.refresh();
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.openNotesForLine",
    (filePath, lineNumber) => {
      const notesPath = path3.join(rootPath, ".vs-notebook");
      if (!fs3.existsSync(notesPath)) {
        return;
      }
      const relatedNotes = fs3.readdirSync(notesPath).filter((f) => f.endsWith(".md")).map((f) => path3.join(notesPath, f)).filter((f) => {
        const content = fs3.readFileSync(f, "utf8");
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (!match) {
          return false;
        }
        const meta = Object.fromEntries(
          match[1].split("\n").map((line) => {
            const [k, ...r] = line.split(":");
            return [k.trim(), r.join(":").trim()];
          })
        );
        return path3.resolve(meta.file ?? "") === path3.resolve(filePath) && parseInt(meta.line ?? "") === lineNumber;
      });
      if (relatedNotes.length === 0) {
        vscode3.window.showInformationMessage("No notes found for this line.");
      } else {
        relatedNotes.forEach((note) => {
          vscode3.workspace.openTextDocument(note).then(
            (doc) => vscode3.window.showTextDocument(doc, { preview: false })
          );
        });
      }
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.openNotesForRange",
    (filePath, lineStart, lineEnd) => {
      const notesPath = path3.join(rootPath, ".vs-notebook");
      if (!fs3.existsSync(notesPath)) {
        return;
      }
      const relatedNotes = fs3.readdirSync(notesPath).filter((f) => f.endsWith(".md")).map((f) => path3.join(notesPath, f)).filter((f) => {
        const content = fs3.readFileSync(f, "utf8");
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (!match) {
          return false;
        }
        const meta = Object.fromEntries(
          match[1].split("\n").map((line) => {
            const [k, ...r] = line.split(":");
            return [k.trim(), r.join(":").trim()];
          })
        );
        if (path3.resolve(meta.file ?? "") !== path3.resolve(filePath)) {
          return false;
        }
        const start = meta.lineStart ? parseInt(meta.lineStart) : null;
        const end = meta.lineEnd ? parseInt(meta.lineEnd) : null;
        if (start === null || end === null) {
          return false;
        }
        return !(end < lineStart || start > lineEnd);
      });
      if (relatedNotes.length === 0) {
        vscode3.window.showInformationMessage(
          "No notes found for this code block."
        );
      } else {
        relatedNotes.forEach((note) => {
          vscode3.workspace.openTextDocument(note).then(
            (doc) => vscode3.window.showTextDocument(doc, { preview: false })
          );
        });
      }
    }
  );
  vscode3.workspace.onDidSaveTextDocument((doc) => {
    if (doc.fileName.includes(".vs-notebook")) {
      notesProvider.refresh();
      globalNotesProvider.refresh();
      lensProvider.refresh();
    }
  });
  vscode3.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("vs-notebook.groupBy") || e.affectsConfiguration("vs-notebook.tagIcons")) {
      notesProvider.refresh();
      globalNotesProvider.refresh();
    }
  });
  context.subscriptions.push(createNote);
  context.subscriptions.push(createGlobalNote);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
