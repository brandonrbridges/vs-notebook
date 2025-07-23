import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class NotesLensProvider implements vscode.CodeLensProvider {
	private _onDidChangeCodeLenses = new vscode.EventEmitter<void>()
	public readonly onDidChangeCodeLenses: vscode.Event<void> =
		this._onDidChangeCodeLenses.event

	private notes: { [key: string]: { start: number; end: number }[] } = {}

	constructor(private workspaceRoot: string) {
		this.refreshNotes()
	}

	refreshNotes() {
		this.notes = {}

		const notesDir = path.join(this.workspaceRoot, '.vs-notes')
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
						? 'vs-notes.openNotesForLine'
						: 'vs-notes.openNotesForRange',
					arguments: singleLine
						? [docPath, startLine + 1]
						: [docPath, ranges[0].start + 1, ranges[0].end + 1],
				})
			)
		})

		return lenses
	}
}
