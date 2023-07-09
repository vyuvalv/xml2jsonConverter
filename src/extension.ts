
import * as vscode from 'vscode';
import {convertXmlFileToJson, convertJsonFileToXml} from './utils/xmlHelper';

// Commands exposed on package.json contributes
const CMD_CONVERT_XML_TO_JSON = 'xml2jsoneditor.xmlToJson';
const CMD_CONVERT_JSON_TO_XML = 'xml2jsoneditor.jsonToXML';
const CMD_VIEW_JSON = 'xml2jsoneditor.viewJson';

export function activate(context: vscode.ExtensionContext) {
	console.log('XML to JSON Editor - Active!');

	// XML to JSON Action from Opened XML Editor File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_CONVERT_XML_TO_JSON, ()=>{

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Converting XML Content to JSON",
			cancellable: true
		}, async (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled XML conversion");
			});

			progress.report({ increment: 0 });
			const activeEditor = getActiveEditor();
			progress.report({ increment: 30, message: "Get Active Editor" });
			const openFileContent = await activeEditor.document.getText();
			progress.report({  increment: 50, message: "Converting xml to json" });
			// vscode.window.showInformationMessage(`Converting xml to json`);
			const jsonData = await convertXmlFileToJson(openFileContent);
			progress.report({  increment: 80, message: "Opening JSON Editor" });
			const panel = await openWebviewPanel(context);
				// Update Content to Webview
				panel.webview.postMessage({
					message:jsonData,
					fileName:activeEditor.document.uri.fsPath
				});

			progress.report({ increment: 100, message: "Open" });	
		});
	

		
	}));

	// View JSON Action from Opened JSON File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_VIEW_JSON, async () => {
		
		const panel = openWebviewPanel(context);

		const activeEditor = getActiveEditor();
		const openFileContent = activeEditor.document.getText();
		const jsonData = JSON.parse(openFileContent);
		// Update Content to Webview
		panel.webview.postMessage({
			message:jsonData,
			fileName:activeEditor.document.uri.fsPath
		});
			
	}));

	// JSON to XML Action from Opened JSON Editor File
	context.subscriptions.push(vscode.commands.registerCommand(CMD_CONVERT_JSON_TO_XML, async ()=>{
		const activeEditor = getActiveEditor();
		const openFileContent = activeEditor.document.getText();
		vscode.window.showInformationMessage(`Converting Json to xml`);
		//  'Layout'
		const xmlData:any = await convertJsonFileToXml(openFileContent);
		await openDoc(xmlData,'xml');
	}));

	
	function openWebviewPanel(context:vscode.ExtensionContext):vscode.WebviewPanel{
		 // Webview
		 const panel = vscode.window.createWebviewPanel(
			'jsonViewer', // Identifies the type of the webview. Used internally
			'JSON Viewer', // Title of the panel displayed to the user
			vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
			{
				localResourceRoots: [context.extensionUri],
				enableScripts: true,
				retainContextWhenHidden: true
			} // Webview options. More on these later.
			);

			// Listen to Messages from UI Panel
			panel.webview.onDidReceiveMessage( async (data) => {
			
				switch (data.type) {
					case 'xmlfile':
							vscode.window.showInformationMessage(`Converting Json to xml`);
							const xmlData:any = await convertJsonFileToXml(data.value);
							await openDoc(xmlData,'xml');
						break;
					case 'jsonfile':
						vscode.window.showInformationMessage(`open Json file`);
						// const jsonContent = JSON.parse(data.value);
						await openDoc(data.value,'json');
					break;
					case 'refreshfile':
						vscode.window.showInformationMessage(`Try to refresh`);
						
					break;
					default:
						vscode.window.showInformationMessage(`No Such command ${data.type}`);
				}
			});

			panel.webview.html = getWebviewContent(context, panel.webview);
		return panel;
	}
	
	/**
	 * @description - Get the open file content from the active editor
	 * @returns - Open file content
	 */
	function getActiveEditor():any {
		// Create and show a new webview
		const activeEditor = vscode.window.activeTextEditor;
		// const activeEditor = await vscode.workspace.openTextDocument();

		if (!activeEditor) {
			return;
		}
	return activeEditor;
	}

	/** 
	 * Open Editor Document with Content in specific Language 
	 * */
	async function openDoc(documentContent:any, language:string){
		// create a new document editor with content
		const newDoc = await vscode.workspace.openTextDocument({
			content: documentContent,
			language: language
		});
		await vscode.window.showTextDocument(newDoc);
	}
	/**
	 * @description - Get the webview content
	 * @param context 
	 * @param webview 
	 * @returns - html content
	 */
	function getWebviewContent(context:vscode.ExtensionContext, webview: vscode.Webview) {
		// Load Scripts and CSS from media folder
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'jsoneditor.min.js'));
		const scriptMainUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'index.js'));
		const stylesJsonEditorUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'jsoneditor.min.css'));
		const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css'));
		
		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesJsonEditorUri}" rel="stylesheet" type="text/css">
				<link href="${stylesMainUri}" rel="stylesheet" type="text/css">
			</head>
			<body>
				<div class="top-bar">
					<h1 id="filetitle" class="panel-file-title"></h1>
					<div class="panel-actions">
						<button id="refresh" class="nav-button" >Refresh</button>
						<button id="writejson" class="nav-button" >Write JSON</button>
						<button id="writexml" class="nav-button" >Write XML</button>
					</div>
				</div>
				<div id="jsoneditor" style="width: 100%; height: 800px;"></div>

				<script src="${scriptUri}"></script>
				<script src="${scriptMainUri}"></script>	
			</body>
		</html>`;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
