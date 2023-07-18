
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
		progress(
			"Open XML file in JSON Editor",
			panel.getDocumentContent(true),
			panel.createOrShowPanel()
		);
		try {
			vscode.window.showInformationMessage(`Opening file in JSON Editor`);
			panel.doConvertXmlToJson();
		} catch (error) {
			vscode.window.showErrorMessage(`Could not open XML file!`);
		}
	}));

	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_VIEW_JSON, async (file) => {
		const panel = new XmlJsonEditorPanel(context, file, true);
		progress(
			"Open JSON file in JSON Editor",
			panel.getDocumentContent(true),
			panel.createOrShowPanel()
		);
		try {
			vscode.window.showInformationMessage(`Opening file in JSON Editor`);
			panel.doJsonToJsonEditor();	
		} catch (error) {
			vscode.window.showErrorMessage(`Could not open JSON file!`);
		}
	}));

	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_OPEN_FILE, async (file:vscode.Uri) => {
		const panel = new XmlJsonEditorPanel(context, file, false);
		await panel.getDocumentContent(false);
		vscode.window.showInformationMessage(`Opening file in JSON Editor`);
		panel.createOrShowPanel();
		if (panel.isXml) {
			try {
				panel.doConvertXmlToJson();
			} catch (error) {
				vscode.window.showErrorMessage(`Could not open XML file!`);
			}
			
		}
		else {
			try {
				panel.doJsonToJsonEditor();	
			} catch (error) {
				vscode.window.showErrorMessage(`Could not open JSON file!`);
			}
		}
	}));

}

// This method is called when your extension is deactivated
export function deactivate() { }

async function progress(title: string, step1: any, step2: any) { 
	vscode.window.withProgress({
	  location: vscode.ProgressLocation.Notification,
	  title: title,
	  cancellable: true
	}, async (progress, token) => {
  
	  token.onCancellationRequested(() => {
		console.log("User canceled operation");
	  });
  
		progress.report({ increment: 0, message: "Start" });
			await step1();
		progress.report({ increment: 50, message: "Progress" });
			await step2();
	 	 progress.report({ increment: 100, message: "Done" });	
	});
  }
