import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, Vault } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	idSeparator: string;
	titleSeparator: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	idSeparator: '_',
	titleSeparator: '-'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'create-sibling',
			name: 'Create sibling note',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return false;
				if (checking) {
					let parentDir = activeFile.parent;
					console.log('parent: ', activeFile.parent);
					console.log('parent children: ', parentDir?.children);
					if (this.isFolgezettel(activeFile.basename)) {
						console.log('isfolgezettel');
						return true;
					}
				}
				if (!checking) {
					console.log('not checking');
					this.createSiblingNote(activeFile);
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	public isFolgezettel(fileName: string): boolean {
		console.log('checking if folgezettel');
		const parts: string[] = fileName.split('_');
		if (parts.length === 3) {
			return true;
		}
		return false;
	}

	public createSiblingNote(note: TFile) {
		const parts: string[] = note.basename.split('_');
		const matchName: string = parts[0] + parts[1];
		const directory: TFolder | null = note?.parent;
		const noteId = parts[1];
		console.log(parts);

		const lastCharOfId = noteId.charCodeAt(noteId.length - 1);
		console.log(lastCharOfId);

		if (this.isDigit(lastCharOfId)) {
			const previousChar = noteId.charCodeAt(noteId.length - 2);
			if (this.isDigit(previousChar)) {
				const fullNum = noteId.slice(-2);
			}
		} else if (this.isLetter(lastCharOfId)) {
			const nextChar: string = String.fromCharCode(lastCharOfId + 1);
		}

		let relatedFiles;
		if (directory != null) {
			relatedFiles = directory.children;
			console.log("directory not null: ", relatedFiles);
		} else {
			relatedFiles = this.app.vault.getMarkdownFiles();
			console.log("directory null: ", relatedFiles);
		}
		const results = relatedFiles.filter((x) => {
			let splitName = x.name.split('_');
			let checkName = splitName[0] + splitName[1];
			if (checkName.startsWith(matchName) && checkName.length === matchName.length) {
				return x;
			};
		});

		const lastChar = results[results.length - 1].name.split('_')[1];
		const nextCharCode = lastChar.charCodeAt(lastChar.length - 1) + 1; 

		const newId = parts[0] + this.settings.idSeparator + parts[1].slice(0, -1)
			 + String.fromCharCode(nextCharCode);
		console.log('newId: ', newId);
		console.log('directoryName: ', directory?.name);

		this.createFile(directory?.name ? directory.name : '', newId); 
	}

	public createFile(path: string, id: string) {
		this.app.vault.create(path + "/" + id + ".md", "");
	}
	
	public isDigit(charCode: number): boolean {
		if (charCode >= 48 && charCode <= 57) {
			return true;
		}
		return false;
	}

	public isLetter(charCode: number): boolean {
		if (charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122) {
			return true;
		}
		return false;
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Folgezettel ID Separator')
			.setDesc('Character separating values in ID: 1_1, 1.1, 1-1, etc.')
			.addText(text => text
				.setPlaceholder('_, ., -, etc.')
				.setValue(this.plugin.settings.idSeparator)
				.onChange(async (value) => {
					this.plugin.settings.idSeparator = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('ID to Title Separator')
			.setDesc('Character separating title from ID: 1_1-Title, 1.1_Title, 1-1.Title, etc.')
			.addText(text => text
				.setPlaceholder('_, ., -, etc.')
				.setValue(this.plugin.settings.titleSeparator)
				.onChange(async (value) => {
					this.plugin.settings.titleSeparator = value;
					await this.plugin.saveSettings();
				}));
	}
}

