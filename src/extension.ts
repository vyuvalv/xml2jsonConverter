
import * as vscode from 'vscode';
import { XmlJsonEditorPanel } from './utils/editorWebview';

// Commands exposed on package.json contributes
const CMD_CONVERT_XML_TO_JSON = 'xml2jsoneditor.xmlToJson';
const CMD_VIEW_JSON = 'xml2jsoneditor.viewJson';
const CMD_OPEN_FILE = 'xml2jsoneditor.openFile';

export function activate(context: vscode.ExtensionContext) {
	console.log('XML to JSON Editor - Active!');

	// XML to JSON Action from Opened XML Editor File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_CONVERT_XML_TO_JSON, async (file) => {
		const panel = new XmlJsonEditorPanel(context, file, true);
		await panel.getDocumentContent(true);
		panel.createOrShowPanel();
		panel.doConvertXmlToJson();
	}));

	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_VIEW_JSON, async (file) => {
		const panel = new XmlJsonEditorPanel(context, file, true);
		await panel.getDocumentContent(true);
		panel.createOrShowPanel();
		panel.doJsonToJsonEditor();	
	}));
	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_OPEN_FILE, async (file:vscode.Uri) => {
		// const { fsPath } = arguments[0];
		// console.log('arguments');
		// console.log(item);
		// const isXml = file.fsPath.includes('.xml');
		// let doc = await vscode.workspace.openTextDocument(file.fsPath); 

		// const content = await doc.getText();
		const panel = new XmlJsonEditorPanel(context, file, false);
		await panel.getDocumentContent(false);
		panel.createOrShowPanel();
		if (panel.isXml) {
			panel.doConvertXmlToJson();
		}
		else {
			panel.doJsonToJsonEditor();	
		}
	
	}));

}

// This method is called when your extension is deactivated
export function deactivate() {}
