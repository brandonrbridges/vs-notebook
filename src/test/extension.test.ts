import * as assert from 'assert'
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { NotesProvider, NoteItem } from '../notes-provider'

suite('VS Notebook Extension Tests', () => {
	let testWorkspaceRoot: string
	let testGlobalNotesDir: string
	let notesProvider: NotesProvider
	let globalNotesProvider: NotesProvider

	suiteSetup(() => {
		// Create temporary directories for testing
		testWorkspaceRoot = fs.mkdtempSync(
			path.join(os.tmpdir(), 'vs-notebook-test-')
		)
		testGlobalNotesDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'vs-notebook-global-test-')
		)
	})

	setup(() => {
		// Initialize providers for each test
		notesProvider = new NotesProvider(testWorkspaceRoot, 'file')
		globalNotesProvider = new NotesProvider(testGlobalNotesDir, 'global')
	})

	teardown(() => {
		// Clean up providers
		notesProvider.dispose()
		globalNotesProvider.dispose()
		
		// Clean up notes directories between tests
		const notesPath = path.join(testWorkspaceRoot, '.vs-notebook')
		if (fs.existsSync(notesPath)) {
			fs.rmSync(notesPath, { recursive: true, force: true })
		}
		
		// Clean up global notes directory between tests
		if (fs.existsSync(testGlobalNotesDir)) {
			const files = fs.readdirSync(testGlobalNotesDir).filter(f => f.endsWith('.md'))
			files.forEach(file => {
				fs.unlinkSync(path.join(testGlobalNotesDir, file))
			})
		}
	})

	suiteTeardown(() => {
		// Clean up temporary directories
		if (fs.existsSync(testWorkspaceRoot)) {
			fs.rmSync(testWorkspaceRoot, { recursive: true, force: true })
		}
		if (fs.existsSync(testGlobalNotesDir)) {
			fs.rmSync(testGlobalNotesDir, { recursive: true, force: true })
		}
	})

	suite('NotesProvider', () => {
		test('should initialize with empty workspace', async () => {
			const children = await notesProvider.getChildren()
			assert.strictEqual(children.length, 0)
		})

		test('should create notes directory when starting to watch', () => {
			notesProvider.startWatching()
			const notesPath = path.join(testWorkspaceRoot, '.vs-notebook', 'files')
			assert.strictEqual(fs.existsSync(notesPath), true)
		})

		test('should detect notes in directory', async () => {
			const notesPath = path.join(testWorkspaceRoot, '.vs-notebook', 'files')
			fs.mkdirSync(notesPath, { recursive: true })

			const noteContent = `---
title: Test Note
file: /test/file.js
line: 42
tags: test, feature
---

This is a test note.`

			fs.writeFileSync(path.join(notesPath, 'test-note.md'), noteContent)

			// Mock VS Code configuration to return 'none' for groupBy
			const originalGet = vscode.workspace.getConfiguration
			vscode.workspace.getConfiguration = () =>
				({
					get: (key: string, defaultValue?: any) => {
						if (key === 'groupBy') {
							return 'none'
						}
						return defaultValue
					},
				} as any)

			const children = await notesProvider.getChildren()
			assert.strictEqual(children.length, 1)
			assert.strictEqual(children[0].label, 'test-note.md')

			// Restore original function
			vscode.workspace.getConfiguration = originalGet
		})

		test('should group notes by file when configured', async () => {
			const notesPath = path.join(testWorkspaceRoot, '.vs-notebook', 'files')
			fs.mkdirSync(notesPath, { recursive: true })

			// Create multiple notes for the same file
			const note1Content = `---
title: Note 1
file: /test/file.js
line: 10
tags: feature
---

First note.`

			const note2Content = `---
title: Note 2
file: /test/file.js
line: 20
tags: bug
---

Second note.`

			fs.writeFileSync(path.join(notesPath, 'note1.md'), note1Content)
			fs.writeFileSync(path.join(notesPath, 'note2.md'), note2Content)

			// Mock VS Code configuration
			const originalGet = vscode.workspace.getConfiguration
			vscode.workspace.getConfiguration = () =>
				({
					get: (key: string, defaultValue?: any) => {
						if (key === 'groupBy') {
							return 'file'
						}

						return defaultValue
					},
				} as any)

			const children = await notesProvider.getChildren()

			assert.strictEqual(children.length, 1) // One group
			assert.strictEqual(children[0].label, 'file.js')

			// Restore original function
			vscode.workspace.getConfiguration = originalGet
		})

		test('should group notes by tag when configured', async () => {
			const notesPath = path.join(testWorkspaceRoot, '.vs-notebook', 'files')
			fs.mkdirSync(notesPath, { recursive: true })

			const featureNoteContent = `---
title: Feature Note
file: /test/file.js
line: 10
tags: feature
---

Feature note.`

			const bugNoteContent = `---
title: Bug Note
file: /test/file.js
line: 20
tags: bug
---

Bug note.`

			fs.writeFileSync(
				path.join(notesPath, 'feature-note.md'),
				featureNoteContent
			)
			fs.writeFileSync(path.join(notesPath, 'bug-note.md'), bugNoteContent)

			// Mock VS Code configuration
			const originalGet = vscode.workspace.getConfiguration
			vscode.workspace.getConfiguration = () =>
				({
					get: (key: string, defaultValue?: any) => {
						if (key === 'groupBy') {
							return 'tag'
						}

						return defaultValue
					},
				} as any)

			const children = await notesProvider.getChildren()

			assert.strictEqual(children.length, 2) // Two groups: Feature and Bug

			// Restore original function
			vscode.workspace.getConfiguration = originalGet
		})
	})

	suite('NoteItem', () => {
		test('should parse frontmatter correctly', () => {
			const tempFile = path.join(testWorkspaceRoot, 'temp-note.md')
			const content = `---
title: Test Note
file: /path/to/file.js
line: 42
tags: test, feature
---

Note content here.`

			fs.writeFileSync(tempFile, content)

			const metadata = NoteItem.readFrontmatter(tempFile)
			assert.strictEqual(metadata.file, '/path/to/file.js')
			assert.strictEqual(metadata.line, '42')
			assert.strictEqual(metadata.tags, 'test, feature')

			fs.unlinkSync(tempFile)
		})

		test('should handle missing frontmatter gracefully', () => {
			const tempFile = path.join(testWorkspaceRoot, 'no-frontmatter.md')
			const content = 'Just content without frontmatter.'

			fs.writeFileSync(tempFile, content)

			const metadata = NoteItem.readFrontmatter(tempFile)
			assert.strictEqual(metadata.file, undefined)
			assert.strictEqual(metadata.line, undefined)
			assert.strictEqual(metadata.tags, undefined)

			fs.unlinkSync(tempFile)
		})

		test('should create note item with correct properties', () => {
			const tempFile = path.join(testWorkspaceRoot, 'test-note.md')
			const content = `---
title: Test Note
file: /test/file.js
line: 42
tags: feature
---

Test content.`

			fs.writeFileSync(tempFile, content)

			const noteItem = new NoteItem('test-note.md', tempFile)
			assert.strictEqual(noteItem.label, 'test-note.md')
			assert.strictEqual(noteItem.fullPath, tempFile)
			assert.strictEqual(noteItem.command?.command, 'vs-notebook.openNote')
			assert.strictEqual(noteItem.command?.arguments?.[0], tempFile)

			fs.unlinkSync(tempFile)
		})
	})

	suite('Global Notes', () => {
		test('should initialize global notes provider', async () => {
			const children = await globalNotesProvider.getChildren()
			assert.strictEqual(children.length, 0)
		})

		test('should create global notes directory when watching', () => {
			globalNotesProvider.startWatching()
			assert.strictEqual(fs.existsSync(testGlobalNotesDir), true)
		})

		test('should detect global notes', async () => {
			fs.mkdirSync(testGlobalNotesDir, { recursive: true })

			const noteContent = `---
title: Global Test Note
tags: global, test
---

This is a global test note.`

			fs.writeFileSync(
				path.join(testGlobalNotesDir, 'global-note.md'),
				noteContent
			)

			// Mock VS Code configuration to return 'none' for groupBy
			const originalGet = vscode.workspace.getConfiguration
			vscode.workspace.getConfiguration = () =>
				({
					get: (key: string, defaultValue?: any) => {
						if (key === 'groupBy') {
							return 'none'
						}
						return defaultValue
					},
				} as any)

			const children = await globalNotesProvider.getChildren()
			assert.strictEqual(children.length, 1)
			assert.strictEqual(children[0].label, 'global-note.md')

			// Restore original function
			vscode.workspace.getConfiguration = originalGet
		})

		test('should force tag grouping for global notes when file grouping is selected', async () => {
			fs.mkdirSync(testGlobalNotesDir, { recursive: true })

			const noteContent = `---
title: Global Note
tags: test
---

Global note content.`

			fs.writeFileSync(
				path.join(testGlobalNotesDir, 'global-note.md'),
				noteContent
			)

			// Mock VS Code configuration to return 'file' grouping
			const originalGet = vscode.workspace.getConfiguration
			vscode.workspace.getConfiguration = () =>
				({
					get: (key: string, defaultValue?: any) => {
						if (key === 'groupBy') {
							return 'file'
						}
						return defaultValue
					},
				} as any)

			const children = await globalNotesProvider.getChildren()
			// Should be grouped by tag even though config says 'file'
			assert.strictEqual(children.length, 1)
			assert.strictEqual(children[0].label, 'Test')

			// Restore original function
			vscode.workspace.getConfiguration = originalGet
		})
	})

	suite('File System Watching', () => {
		test('should start file watcher without errors', () => {
			assert.doesNotThrow(() => {
				notesProvider.startWatching()
			})
		})

		test('should dispose watcher properly', () => {
			notesProvider.startWatching()
			assert.doesNotThrow(() => {
				notesProvider.dispose()
			})
		})

		// Note: Testing actual file watching events requires more complex setup
		// and timing considerations. These tests focus on the setup/teardown.
	})

	suite('Search Functionality', () => {
		test('should search notes by content', async () => {
			const notesPath = path.join(testWorkspaceRoot, '.vs-notebook', 'files')
			fs.mkdirSync(notesPath, { recursive: true })

			const note1Content = `---
title: JavaScript Note
file: /test/file.js
line: 10
---

This note contains JavaScript code examples.`

			const note2Content = `---
title: Python Note
file: /test/file.py
line: 20
---

This note contains Python code examples.`

			fs.writeFileSync(path.join(notesPath, 'js-note.md'), note1Content)
			fs.writeFileSync(path.join(notesPath, 'py-note.md'), note2Content)

			const jsResults = await notesProvider.search('JavaScript')
			assert.strictEqual(jsResults.length, 1)
			assert.strictEqual(jsResults[0].label, 'js-note.md')

			const pyResults = await notesProvider.search('Python')
			assert.strictEqual(pyResults.length, 1)
			assert.strictEqual(pyResults[0].label, 'py-note.md')

			const noResults = await notesProvider.search('nonexistent')
			assert.strictEqual(noResults.length, 0)
		})
	})
})
