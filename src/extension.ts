// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

import { NoteItem, NotesProvider } from './notes-provider'
import { NotesLensProvider } from './lens-provider'

// Migration utility to move existing notes to new structure
function migrateNotesToNewStructure(rootPath: string): void {
	const oldNotesPath = path.join(rootPath, '.vs-notebook')
	const newFilesPath = path.join(oldNotesPath, 'files')
	const projectPath = path.join(oldNotesPath, 'project')

	if (!fs.existsSync(oldNotesPath)) {
		return
	}

	// Create new subdirectories
	if (!fs.existsSync(newFilesPath)) {
		fs.mkdirSync(newFilesPath, { recursive: true })
	}
	if (!fs.existsSync(projectPath)) {
		fs.mkdirSync(projectPath, { recursive: true })
	}

	// Get all .md files in the root .vs-notebook directory
	const files = fs.readdirSync(oldNotesPath).filter(f => f.endsWith('.md') && !f.startsWith('.'))

	for (const file of files) {
		const oldFilePath = path.join(oldNotesPath, file)
		const newFilePath = path.join(newFilesPath, file)
		
		// Move file to files subdirectory (these are file-based notes)
		try {
			fs.renameSync(oldFilePath, newFilePath)
		} catch (error) {
			console.error(`VS Notebook: Error migrating ${file}:`, error)
		}
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''

	// Run migration to move existing notes to new structure
	if (rootPath) {
		migrateNotesToNewStructure(rootPath)
	}

	const userHome = require('os').homedir()
	const globalNotesDir = path.join(userHome, '.vs-notebook-global')

	// File notes provider (reads from .vs-notebook/files/)
	const notesProvider = new NotesProvider(rootPath, 'file')
	vscode.window.registerTreeDataProvider('vs-notebook-notes', notesProvider)
	notesProvider.startWatching()

	// Project notes provider (reads from .vs-notebook/project/)
	const projectNotesProvider = new NotesProvider(rootPath, 'project')
	vscode.window.registerTreeDataProvider('vs-notebook-notes-project', projectNotesProvider)
	projectNotesProvider.startWatching()

	// Global notes provider (reads from ~/.vs-notebook-global)
	const globalNotesProvider = new NotesProvider(globalNotesDir, 'global')
	vscode.window.registerTreeDataProvider(
		'vs-notebook-notes-global',
		globalNotesProvider
	)
	globalNotesProvider.startWatching()

	const lensProvider = new NotesLensProvider(rootPath)
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider({ scheme: 'file' }, lensProvider)
	)

	vscode.commands.registerCommand('vs-notebook.openSettings', () => {
		vscode.commands.executeCommand(
			'workbench.action.openSettings',
			'@ext:brandonbridges.vs-notebook'
		)
	})

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'vs-notebook.openNote',
			(notePath: string) => {
				vscode.workspace.openTextDocument(notePath).then((doc) => {
					vscode.window.showTextDocument(doc)
				})
			}
		),

		vscode.commands.registerCommand('vs-notebook.refreshNotes', () => {
			notesProvider.refresh()
			projectNotesProvider.refresh()
			globalNotesProvider.refresh()
			lensProvider.refresh()
		})
	)

	const createNote = vscode.commands.registerCommand(
		'vs-notebook.createNote',
		async () => {
			const title = await vscode.window.showInputBox({
				prompt: 'Enter note title',
			})

			if (!title) {
				return
			}

			const description = await vscode.window.showInputBox({
				prompt: 'Enter note description',
			})

			const tags = await vscode.window.showInputBox({
				prompt: 'Enter tags (comma-separated, optional)',
			})

			const editor = vscode.window.activeTextEditor
			const filePath = editor?.document.uri.fsPath ?? 'Unknown'
			const selection = editor?.selection

			let contentFormatter = `title: ${title}\nfile: ${filePath}\n`

			if (selection?.isEmpty) {
				const lineNumber = selection.active.line + 1
				contentFormatter += `line: ${lineNumber}\n`
			} else if (selection) {
				const lineStart = selection.start.line + 1
				const lineEnd = selection.end.line + 1
				contentFormatter += `line: ${lineStart}-${lineEnd}\n`
			}

			contentFormatter += `tags: ${tags || ''}`

			contentFormatter += `\nurl: ` // Placeholder for future URL support

			const lineNumber = editor ? editor.selection.active.line + 1 : 'Unknown'

			const workspaceFolders = vscode.workspace.workspaceFolders
			if (!workspaceFolders) {
				vscode.window.showErrorMessage('No workspace folder found.')
				return
			}

			const rootPath = workspaceFolders[0].uri.fsPath
			const notesDirectory = path.join(rootPath, '.vs-notebook', 'files')
			const notePath = path.join(
				notesDirectory,
				`${title.replace(/\s+/g, '-')}.md`
			)

			if (!fs.existsSync(notesDirectory)) {
				fs.mkdirSync(notesDirectory, { recursive: true })
			}

			const content = `---
${contentFormatter}
---

${description || ''}`

			fs.writeFileSync(notePath, content)

			vscode.window.showInformationMessage(`Note "${title}" created.`)
			vscode.workspace.openTextDocument(notePath).then((doc) => {
				vscode.window.showTextDocument(doc, {
					viewColumn: vscode.ViewColumn.Beside,
					preserveFocus: false,
					preview: false,
				})
			})
		}
	)

	const createProjectNote = vscode.commands.registerCommand(
		'vs-notebook.createProjectNote',
		async () => {
			const title = await vscode.window.showInputBox({
				prompt: 'Enter project note title',
			})

			if (!title) {
				return
			}

			const description = await vscode.window.showInputBox({
				prompt: 'Enter note description',
			})

			const tags = await vscode.window.showInputBox({
				prompt: 'Enter tags (comma-separated, optional)',
			})

			const workspaceFolders = vscode.workspace.workspaceFolders
			if (!workspaceFolders) {
				vscode.window.showErrorMessage('No workspace folder found.')
				return
			}

			const rootPath = workspaceFolders[0].uri.fsPath
			const notesDirectory = path.join(rootPath, '.vs-notebook', 'project')
			const notePath = path.join(
				notesDirectory,
				`${title.replace(/\s+/g, '-')}.md`
			)

			if (!fs.existsSync(notesDirectory)) {
				fs.mkdirSync(notesDirectory, { recursive: true })
			}

			const content = `---
title: ${title}
tags: ${tags || ''}
url: 
---

${description || ''}`

			fs.writeFileSync(notePath, content)

			vscode.window.showInformationMessage(`Project note "${title}" created.`)
			vscode.workspace.openTextDocument(notePath).then((doc) => {
				vscode.window.showTextDocument(doc, {
					viewColumn: vscode.ViewColumn.Beside,
					preserveFocus: false,
					preview: false,
				})
			})

			projectNotesProvider.refresh()
		}
	)

	const createGlobalNote = vscode.commands.registerCommand(
		'vs-notebook.createGlobalNote',
		async () => {
			const title = await vscode.window.showInputBox({
				prompt: 'Enter global note title',
			})

			if (!title) {
				return
			}

			const description = await vscode.window.showInputBox({
				prompt: 'Enter note description',
			})
			const tags = await vscode.window.showInputBox({
				prompt: 'Enter tags (comma-separated, optional)',
			})

			if (!fs.existsSync(globalNotesDir)) {
				fs.mkdirSync(globalNotesDir, { recursive: true })
			}

			const notePath = path.join(
				globalNotesDir,
				`${title.replace(/\s+/g, '-')}.md`
			)
			const content = `---
title: ${title}
tags: ${tags || ''}
url: 
---

${description || ''}`

			fs.writeFileSync(notePath, content)

			vscode.window.showInformationMessage(`Global note "${title}" created.`)
			vscode.workspace.openTextDocument(notePath).then((doc) => {
				vscode.window.showTextDocument(doc, {
					viewColumn: vscode.ViewColumn.Beside,
					preserveFocus: false,
					preview: false,
				})
			})

			globalNotesProvider.refresh()
		}
	)

	vscode.commands.registerCommand(
		'vs-notebook.deleteNote',
		async (item: NoteItem) => {
			const notePath = item.fullPath
			const confirm = await vscode.window.showWarningMessage(
				'Are you sure you want to delete this note?',
				{ modal: true },
				'Yes',
				'No'
			)

			if (confirm === 'Yes') {
				await vscode.workspace.fs.delete(vscode.Uri.file(notePath))

				vscode.window.showInformationMessage('Note deleted')

				notesProvider.refresh()
				projectNotesProvider.refresh()
				globalNotesProvider.refresh()
				lensProvider.refresh()
			}
		}
	)

	vscode.commands.registerCommand(
		'vs-notebook.renameNote',
		async (item: NoteItem) => {
			const notePath = item.fullPath
			const oldName = path.basename(notePath, '.md')
			const newName = await vscode.window.showInputBox({
				prompt: 'Enter new note name',
				value: oldName,
			})

			if (!newName || newName === oldName) {
				return
			}

			const newPath = path.join(
				path.dirname(notePath),
				`${newName.replace(/\s+/g, '-')}.md`
			)

			await vscode.workspace.fs.rename(
				vscode.Uri.file(notePath),
				vscode.Uri.file(newPath)
			)

			vscode.window.showInformationMessage('Note renamed')

			notesProvider.refresh()
			projectNotesProvider.refresh()
			globalNotesProvider.refresh()
			lensProvider.refresh()
		}
	)

	vscode.commands.registerCommand(
		'vs-notebook.openNotesForLine',
		(filePath: string, lineNumber: number) => {
			const notesPath = path.join(rootPath, '.vs-notebook', 'files')

			if (!fs.existsSync(notesPath)) {
				return
			}

			const relatedNotes = fs
				.readdirSync(notesPath)
				.filter((f) => f.endsWith('.md'))
				.map((f) => path.join(notesPath, f))
				.filter((f) => {
					const content = fs.readFileSync(f, 'utf8')
					const match = content.match(/^---\n([\s\S]+?)\n---/)

					if (!match) {
						return false
					}

					const meta = Object.fromEntries(
						match[1].split('\n').map((line) => {
							const [k, ...r] = line.split(':')
							return [k.trim(), r.join(':').trim()]
						})
					)
					return (
						path.resolve(meta.file ?? '') === path.resolve(filePath) &&
						parseInt(meta.line ?? '') === lineNumber
					)
				})

			if (relatedNotes.length === 0) {
				vscode.window.showInformationMessage('No notes found for this line.')
			} else {
				relatedNotes.forEach((note) => {
					vscode.workspace
						.openTextDocument(note)
						.then((doc) =>
							vscode.window.showTextDocument(doc, { preview: false })
						)
				})
			}
		}
	)

	vscode.commands.registerCommand(
		'vs-notebook.openNotesForRange',
		(filePath: string, lineStart: number, lineEnd: number) => {
			const notesPath = path.join(rootPath, '.vs-notebook', 'files')

			if (!fs.existsSync(notesPath)) {
				return
			}

			const relatedNotes = fs
				.readdirSync(notesPath)
				.filter((f) => f.endsWith('.md'))
				.map((f) => path.join(notesPath, f))
				.filter((f) => {
					const content = fs.readFileSync(f, 'utf8')
					const match = content.match(/^---\n([\s\S]+?)\n---/)

					if (!match) {
						return false
					}

					const meta = Object.fromEntries(
						match[1].split('\n').map((line) => {
							const [k, ...r] = line.split(':')
							return [k.trim(), r.join(':').trim()]
						})
					)
					if (path.resolve(meta.file ?? '') !== path.resolve(filePath)) {
						return false
					}

					const start = meta.lineStart ? parseInt(meta.lineStart) : null
					const end = meta.lineEnd ? parseInt(meta.lineEnd) : null

					if (start === null || end === null) {
						return false
					}

					// Check if the note's range overlaps with the given range
					return !(end < lineStart || start > lineEnd)
				})

			if (relatedNotes.length === 0) {
				vscode.window.showInformationMessage(
					'No notes found for this code block.'
				)
			} else {
				relatedNotes.forEach((note) => {
					vscode.workspace
						.openTextDocument(note)
						.then((doc) =>
							vscode.window.showTextDocument(doc, { preview: false })
						)
				})
			}
		}
	)

	vscode.workspace.onDidSaveTextDocument((doc) => {
		if (doc.fileName.includes('.vs-notebook')) {
			notesProvider.refresh()
			projectNotesProvider.refresh()
			globalNotesProvider.refresh()
			lensProvider.refresh()
		}
	})

	vscode.workspace.onDidChangeConfiguration((e) => {
		if (
			e.affectsConfiguration('vs-notebook.groupBy') ||
			e.affectsConfiguration('vs-notebook.tagIcons')
		) {
			notesProvider.refresh()
			projectNotesProvider.refresh()
			globalNotesProvider.refresh()
		}
	})

	context.subscriptions.push(createNote)
	context.subscriptions.push(createProjectNote)
	context.subscriptions.push(createGlobalNote)

	// Store providers for cleanup on deactivation
	context.subscriptions.push({
		dispose: () => {
			notesProvider.dispose()
			projectNotesProvider.dispose()
			globalNotesProvider.dispose()
			lensProvider.dispose()
		},
	})
}

// This method is called when your extension is deactivated
export function deactivate() {}
