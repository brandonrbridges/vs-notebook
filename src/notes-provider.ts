import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export type TreeItem = NoteItem | GroupItem

export class NotesProvider implements vscode.TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<
		TreeItem | undefined | null | void
	> = new vscode.EventEmitter()

	readonly onDidChangeTreeData: vscode.Event<
		TreeItem | undefined | null | void
	> = this._onDidChangeTreeData.event

	constructor(private workspaceRoot: string) {}

	refresh(): void {
		this._onDidChangeTreeData.fire()
	}

	getTreeItem(element: TreeItem): vscode.TreeItem {
		return element
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No workspace open')
			return Promise.resolve([])
		}

		const notesPath = path.join(this.workspaceRoot, '.vs-notebook')
		if (!fs.existsSync(notesPath)) {
			return Promise.resolve([])
		}

		if (element && element instanceof GroupItem) {
			return Promise.resolve(element.children)
		}

		const files = fs
			.readdirSync(notesPath)
			.filter((file) => file.endsWith('.md'))

		const notes = files.map((file) => {
			const fullPath = path.join(notesPath, file)
			return new NoteItem(file, fullPath)
		})

		const config = vscode.workspace.getConfiguration('vs-notebook')
		const groupBy = config.get<string>('groupBy', 'none')

		if (groupBy === 'none') {
			return Promise.resolve(notes)
		}

		const groups = this.groupNotes(notes, groupBy)
		return Promise.resolve(groups)
	}

	async search(query: string): Promise<TreeItem[]> {
		if (!this.workspaceRoot) {
			return []
		}

		const notesPath = path.join(this.workspaceRoot, '.vs-notebook')
		if (!fs.existsSync(notesPath)) {
			return []
		}

		const files = fs.readdirSync(notesPath).filter((f) => f.endsWith('.md'))

		const lowerQuery = query.toLowerCase()

		const matches: NoteItem[] = []
		for (const file of files) {
			const fullPath = path.join(notesPath, file)
			const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase()
			if (content.includes(lowerQuery)) {
				matches.push(new NoteItem(file, fullPath))
			}
		}
		return matches
	}

	private groupNotes(notes: NoteItem[], groupBy: string): TreeItem[] {
		switch (groupBy) {
			case 'file':
				return this.groupByFile(notes)
			case 'tag':
				return this.groupByTag(notes)
			default:
				return notes
		}
	}

	private groupByFile(notes: NoteItem[]): TreeItem[] {
		const groups = new Map<string, NoteItem[]>()

		for (const note of notes) {
			const metadata = NoteItem.readFrontmatter(note.fullPath)

			const fileName = metadata.file
				? path.basename(metadata.file)
				: 'Unknown File'

			if (!groups.has(fileName)) {
				groups.set(fileName, [])
			}

			groups.get(fileName)!.push(note)
		}

		const groupItems: GroupItem[] = []
		for (const [fileName, groupNotes] of groups) {
			groupItems.push(new GroupItem(fileName, groupNotes, 'file'))
		}

		return groupItems.sort((a, b) => a.label.localeCompare(b.label))
	}

	private groupByTag(notes: NoteItem[]): TreeItem[] {
		const groups = new Map<string, NoteItem[]>()

		for (const note of notes) {
			const metadata = NoteItem.readFrontmatter(note.fullPath)
			let tags =
				metadata.tags
					?.split(',')
					.map((t) => t.trim())
					.filter(Boolean) ?? []
			let firstTag = tags.length > 0 ? tags[0] : 'Untagged'

			// If the tag is empty string, treat as "Untagged"
			if (!firstTag) {
				firstTag = 'Untagged'
			}

			// Capitalize first letter
			firstTag = firstTag.charAt(0).toUpperCase() + firstTag.slice(1)

			if (!groups.has(firstTag)) {
				groups.set(firstTag, [])
			}
			groups.get(firstTag)!.push(note)
		}

		const groupItems: GroupItem[] = []
		for (const [tag, groupNotes] of groups) {
			groupItems.push(new GroupItem(tag, groupNotes, 'tag'))
		}

		return groupItems.sort((a, b) => a.label.localeCompare(b.label))
	}
}

export class GroupItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly children: NoteItem[],
		public readonly groupType: 'file' | 'tag'
	) {
		super(label, vscode.TreeItemCollapsibleState.Expanded)

		this.tooltip = `${this.children.length} note${
			this.children.length !== 1 ? 's' : ''
		}`
		this.description = `${this.children.length}`

		// Set icon based on group type
		if (groupType === 'file') {
			this.iconPath = new vscode.ThemeIcon('file')
		} else {
			this.iconPath = new vscode.ThemeIcon('tag')
		}

		this.contextValue = 'groupItem'
	}
}

export class NoteItem extends vscode.TreeItem {
	constructor(public readonly label: string, public readonly fullPath: string) {
		super(label, vscode.TreeItemCollapsibleState.None)

		const metadata = NoteItem.readFrontmatter(fullPath)

		const tags = metadata.tags?.split(',').map((t) => t.trim()) ?? []

		if (tags.includes('bug')) {
			this.iconPath = new vscode.ThemeIcon(
				'bug',
				new vscode.ThemeColor('errorForeground')
			)
		} else if (tags.includes('todo')) {
			this.iconPath = new vscode.ThemeIcon(
				'checklist',
				new vscode.ThemeColor('charts.yellow')
			)
		} else if (tags.includes('refactor')) {
			this.iconPath = new vscode.ThemeIcon(
				'tools',
				new vscode.ThemeColor('charts.blue')
			)
		} else {
			this.iconPath = new vscode.ThemeIcon('note')
		}

		this.tooltip = `${label}\n${metadata.file ?? ''} : ${metadata.line ?? ''}${
			metadata.tags ? '\nTags: ' + metadata.tags : ''
		}`

		this.description = metadata.file
			? `${path.basename(metadata.file)} ${
					metadata.tags ? ` • ${metadata.tags}` : ''
			  }`
			: ''

		this.command = {
			command: 'vs-notebook.openNote',
			title: 'Open Note',
			arguments: [this.fullPath],
		}

		this.resourceUri = vscode.Uri.file(this.fullPath)
		this.contextValue = 'noteItem'
	}

	static readFrontmatter(filePath: string): {
		file?: string
		line?: string
		tags?: string
	} {
		try {
			const content = fs.readFileSync(filePath, 'utf-8')
			const match = content.match(/^---\n([\s\S]+?)\n---/)
			if (match) {
				const frontmatter = match[1]
				const lines = frontmatter.split('\n')
				const meta: Record<string, string> = {}
				for (const line of lines) {
					const [key, ...rest] = line.split(':')
					meta[key.trim()] = rest.join(':').trim()
				}
				return { file: meta['file'], line: meta['line'], tags: meta['tags'] }
			}
		} catch (err) {
			console.error('Failed to read frontmatter:', err)
		}
		return {}
	}
}
