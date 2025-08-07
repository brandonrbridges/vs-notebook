import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as chokidar from 'chokidar'

export class NotesLensProvider implements vscode.CodeLensProvider {
	private _onDidChangeCodeLenses = new vscode.EventEmitter<void>()
	public readonly onDidChangeCodeLenses: vscode.Event<void> =
		this._onDidChangeCodeLenses.event

	private notes: { [key: string]: { start: number; end: number }[] } = {}
	private watcher?: chokidar.FSWatcher
	private refreshTimeout?: NodeJS.Timeout

	constructor(private workspaceRoot: string) {
		this.refreshNotes()
		this.startWatching()
	}

	refreshNotes() {
		this.notes = {}

		const notesDir = path.join(this.workspaceRoot, '.vs-notebook', 'files')
		if (!fs.existsSync(notesDir)) {
			return
		}

		const files = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md'))

		for (const file of files) {
			const fullPath = path.join(notesDir, file)
			const content = fs.readFileSync(fullPath, 'utf8')
			const match = content.match(/^---\n([\s\S]+?)\n---/)

			if (!match) {
				continue
			}

			const frontmatter = Object.fromEntries(
				match[1].split('\n').map((line) => {
					const [key, ...rest] = line.split(':')
					return [key.trim(), rest.join(':').trim()]
				})
			)

			if (frontmatter.file && frontmatter.line) {
				const key = path.resolve(frontmatter.file)

				// Parse the line field: could be "12" or "10-15"
				const lineStr = frontmatter.line
				let lineStart = null
				let lineEnd = null

				if (lineStr.includes('-')) {
					const parts = lineStr.split('-').map((n) => parseInt(n))
					if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
						lineStart = parts[0] - 1 // 0-based
						lineEnd = parts[1] - 1
					}
				} else {
					const n = parseInt(lineStr)
					if (!isNaN(n)) {
						lineStart = lineEnd = n - 1
					}
				}

				if (lineStart !== null && lineEnd !== null) {
					if (!this.notes[key]) {
						this.notes[key] = []
					}

					this.notes[key].push({ start: lineStart, end: lineEnd })
				}
			}
		}
	}

	refresh() {
		this.refreshNotes()
		this._onDidChangeCodeLenses.fire()
	}

	startWatching(): void {
		if (!this.workspaceRoot) {
			return
		}

		const notesPath = path.join(this.workspaceRoot, '.vs-notebook', 'files')

		if (!fs.existsSync(notesPath)) {
			return
		}

		try {
			this.watcher = chokidar.watch(path.join(notesPath, '*.md'), {
				ignored: /^\./,
				persistent: true,
				ignoreInitial: true,
				awaitWriteFinish: {
					stabilityThreshold: 300,
					pollInterval: 100
				}
			})

			this.watcher
				.on('add', () => this.debouncedRefresh())
				.on('change', () => this.debouncedRefresh())
				.on('unlink', () => this.debouncedRefresh())
				.on('error', (error) => {
					console.error('VS Notebook: Error watching workspace notes for code lens:', error)
					// Attempt to restart watcher after a delay
					setTimeout(() => {
						if (!this.watcher) {
							this.startWatching()
						}
					}, 5000)
				})
		} catch (error) {
			console.error('VS Notebook: Failed to start code lens file watcher:', error)
		}
	}

	private debouncedRefresh(): void {
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout)
		}
		this.refreshTimeout = setTimeout(() => {
			this.refresh()
		}, 100)
	}

	dispose(): void {
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout)
		}
		if (this.watcher) {
			this.watcher.close()
		}
	}

	provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		const docPath = path.resolve(document.uri.fsPath)
		const ranges = this.notes[docPath] ?? []

		// Group CodeLens by start line
		// For multiple notes starting at same line, sum count
		const grouped = ranges.reduce((acc, range) => {
			const key = range.start

			if (!acc[key]) {
				acc[key] = []
			}

			acc[key].push(range)

			return acc
		}, {} as Record<number, { start: number; end: number }[]>)

		const lenses: vscode.CodeLens[] = []

		Object.entries(grouped).forEach(([startLineStr, ranges]) => {
			const startLine = parseInt(startLineStr)
			const count = ranges.length

			// Determine display text: single line or range
			const singleLine =
				ranges.length === 1 && ranges[0].start === ranges[0].end
			const title = singleLine
				? `${count} note${count > 1 ? 's' : ''} for this line`
				: `${count} note${count > 1 ? 's' : ''} for lines ${
						ranges[0].start + 1
				  }-${ranges[0].end + 1}`

			lenses.push(
				new vscode.CodeLens(new vscode.Range(startLine, 0, startLine, 0), {
					title,
					command: singleLine
						? 'vs-notebook.openNotesForLine'
						: 'vs-notebook.openNotesForRange',
					arguments: singleLine
						? [docPath, startLine + 1]
						: [docPath, ranges[0].start + 1, ranges[0].end + 1],
				})
			)
		})

		return lenses
	}
}
