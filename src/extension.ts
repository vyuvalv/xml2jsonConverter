
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
		
		// Start Progress bar
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "XML-2-JSON",
			cancellable: true
		}, async (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled XML conversion");
			});
			// init panel
			const panel = new XmlJsonEditorPanel(context, file, true);
			progress.report({ increment: 0, message: "Retreiving content from file" });
			// Retrieving content from activeEditor
			panel.originalFileContent = await panel.getContentFromActiveEditor();
			progress.report({ increment: 25, message: "Converting and formatting content" });
			
			try {
				progress.report({ increment: 50, message: "Loading content to webview" });
				// Convert
				panel.convertedFileContent = await panel.doConvertXmlToJson(panel.originalFileContent, false);
				
				
				// update
				if (!isJsonString(JSON.stringify(panel.convertedFileContent))) {
					vscode.window.showErrorMessage(`Does not find content`);
				}
				else {
					progress.report({ increment: 80, message: "Creating webview" });
					await panel.createOrShowPanel();
					panel.updateWebview(panel.convertedFileContent, panel.editorTitle, 'xml');
					progress.report({ increment: 100, message: "Opening JSON Editor" });
				}
			

			} catch (error) {
				vscode.window.showErrorMessage(`Could not open XML file!`);
			}
		
		
			
		});
	}));

	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_VIEW_JSON, async (file) => {
		
		// Start Progress bar
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "JSON-2-JSON",
			cancellable: true
		}, async (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled JSON conversion");
			});
			// init panel
			const panel = new XmlJsonEditorPanel(context, file, true);
			progress.report({ increment: 0, message: "Retreiving content from file" });
			// Retrieving content from activeEditor
			panel.originalFileContent = await panel.getContentFromActiveEditor();
			progress.report({ increment: 25, message: "Converting and formatting content" });
			
			try {
				progress.report({ increment: 50, message: "Loading content to webview" });
				// Convert
				panel.convertedFileContent = JSON.parse(panel.originalFileContent);

				if (!isJsonString(JSON.stringify(panel.convertedFileContent))) {
					vscode.window.showErrorMessage(`Something wrong with the JSON file!`);
				}
				else {
					progress.report({ increment: 80, message: "Creating webview" });
					await panel.createOrShowPanel();
					// update
					panel.updateWebview(panel.convertedFileContent, panel.editorTitle, 'json');
					progress.report({ increment: 100, message: "Opening JSON Editor" });
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Could not open JSON file!`);
			}
			
			
		});
	}));

	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_OPEN_FILE, async (file:vscode.Uri) => {
		// Start Progress bar
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "FILE-2-JSON",
			cancellable: true
		}, async (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled XML conversion");
			});
			// init panel
			const panel = new XmlJsonEditorPanel(context, file, false);
			progress.report({ increment: 0, message: "Retreiving content from file" });
			// Retrieving content from activeEditor
			panel.originalFileContent = await panel.getContentFromExplorerFile();
	
			progress.report({ increment: 50, message: "Loading content to webview" });
			try {
				// Convert
				if (panel.isXml) {
					panel.convertedFileContent = await panel.doConvertXmlToJson(panel.originalFileContent, false);
				}
				else {
					panel.convertedFileContent = JSON.parse(panel.originalFileContent);
				}
					
				if (!isJsonString(JSON.stringify(panel.convertedFileContent))) {
					vscode.window.showErrorMessage(`Could not find any content in file`);
				}	
				else {
					progress.report({ increment: 80, message: "Creating webview" });
					await panel.createOrShowPanel();
					// update
					panel.updateWebview(panel.convertedFileContent, panel.editorTitle, 'json');
					progress.report({ increment: 100, message: "Opening JSON Editor" });
				}
			
					
			} catch (error) {
				vscode.window.showErrorMessage(`Could not open file!`);
			}
		});
		
		
	}));

}

// This method is called when your extension is deactivated
export function deactivate() { }

function isJsonString(str:string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}