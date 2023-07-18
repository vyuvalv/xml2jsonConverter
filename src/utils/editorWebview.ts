import * as vscode from 'vscode';
import { convertXmlFileToJson, convertJsonFileToXml } from './xmlHelper';
/**
 * Manages JSON Editor webview panels
 */
export class XmlJsonEditorPanel {
  public static readonly viewType = 'jsonEditorView';
  private _panel: vscode.WebviewPanel|undefined;
  private readonly _context: vscode.ExtensionContext;
  private _webview:vscode.Webview|undefined;
  private  _activeEditor:vscode.TextEditor|undefined;
  private _disposables: vscode.Disposable[] = [];
  public currentFileContent: any;
  private _formattedFilePath: any;
  private _curentFilePath: any;
  public isXml: boolean;
  private isActiveEditor: boolean;

  public constructor(context: vscode.ExtensionContext, file:vscode.Uri, useActiveEditor:boolean ) {
    this._context = context;
    // Set File Path and Title Properties
    this._curentFilePath = file.fsPath;
    this.isXml = this._curentFilePath.includes('.xml');
    this._formattedFilePath = this._curentFilePath.split('/').pop();
    this.isActiveEditor = useActiveEditor;
  }

  public createOrShowPanel(): vscode.WebviewPanel {
    const alternateColumn = this.isActiveEditor && this._activeEditor?.viewColumn === vscode.ViewColumn.One ? vscode.ViewColumn.Two : vscode.ViewColumn.One;
		// If we already have a panel, show it.
		if (this._panel) {
			this._panel.reveal(alternateColumn);
			return this._panel;
		}
		// Otherwise, create a new panel.
		this._panel = vscode.window.createWebviewPanel(
			XmlJsonEditorPanel.viewType,
			this._formattedFilePath,
			alternateColumn,
			{
				localResourceRoots: [this._context.extensionUri],
				enableScripts: true,
				retainContextWhenHidden: true
			} 
    );

    this._webview = this._panel.webview;
    this._webview.html = this._getHtmlForWebview();

	  // Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    // Handle messages from the webview
    this._webview.onDidReceiveMessage(
    async (data) => {
					// get Event Schema - { type: string, value:string }
          switch (data.type) {
            case 'xmlfile':
              try {
                vscode.window.showInformationMessage(`Writing XML File`);
                const xmlData:any = await convertJsonFileToXml(data.value);
                await this.openDoc( xmlData, 'xml' );
              } catch (error) {
                vscode.window.showErrorMessage(`Could not open XML file!`);
              }
              break;
            case 'jsonfile':
              try {
                const jsonContent: any = JSON.stringify(JSON.parse(data.value), null, ' ');
                vscode.window.showInformationMessage(`Writing Json file`);
                await this.openDoc(jsonContent, 'json');
                
              } catch (error) {
                vscode.window.showErrorMessage(`Could not open Json file!`);
              }
            break;
            case 'refreshfile':
              try {
                vscode.window.showInformationMessage(`Refreshing active file content`);
                this.doRefresh(data.originalType);
              } catch (error) {
                vscode.window.showErrorMessage(`Could not refresh file!`);
              }
            break;
            default:
              vscode.window.showInformationMessage(`No Such command ${data.type}`);
          }
			},
			null,
			this._disposables
    );
    return this._panel;
  }

  public async getDocumentContent(useActiveEditor:boolean) { 
    if(useActiveEditor){
      this._activeEditor = vscode.window.activeTextEditor;
      this.currentFileContent = this._activeEditor?.document.getText();
    }
    else {
      const doc = await vscode.workspace.openTextDocument(this._curentFilePath); 
      this.currentFileContent = await doc.getText();
    }
  }

	public dispose() {
		// Clean up our resources
		this._panel?.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
  }

  // Open a new Editor 
  private async openDoc(documentContent:any, language:string) {
      // create a new document editor with content
      const newDoc = await vscode.workspace.openTextDocument({
        content: documentContent,
        language: language
      });
      await vscode.window.showTextDocument(newDoc);
  }

  // Refresh content from active editor
  private doRefresh(fileType:string) { 
    switch (fileType) {
      case 'xml':
        this.doConvertXmlToJson();
        break;
      case 'json':
        this.doJsonToJsonEditor();
        break;
    }

  }
	// XML to JSON Action from Opened XML Editor File
  public doConvertXmlToJson(fileContent?:any) {
    vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Converting XML Content to JSON",
			cancellable: true
		}, async (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled XML conversion");
			});

      progress.report({ increment: 0 });

      if (!this.currentFileContent) {
        this.currentFileContent = fileContent;
        vscode.window.showErrorMessage(`Could not found Content in File!`);
      }
      const jsonData = await convertXmlFileToJson(this.currentFileContent);
      progress.report({  increment: 50, message: "Converting xml to json" });
      // Update Content to Webview
      this.updateWebview(jsonData, this._formattedFilePath, 'xml');
			progress.report({ increment: 100, message: "Opening JSON Editor" });	
		});
  }
  // View JSON Action from Opened JSON File
  public doJsonToJsonEditor(fileContent?:any) {
    vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Open JSON file in JSON Editor",
			cancellable: true
		}, async (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled operation");
      });
      
      if (!this.currentFileContent) {
        this.currentFileContent = fileContent;
        vscode.window.showErrorMessage(`Could not found Content in File!`);
      }
      progress.report({ increment: 0, message: "Opening JSON Editor" });
      // Update Content to Webview
      const jsonData = JSON.parse(this.currentFileContent);
      this.updateWebview(jsonData, this._formattedFilePath, 'json');
			progress.report({ increment: 100, message: "Open" });	
		});
	}

  private updateWebview(content: any, fileName:string, fileType:string) { 
      // Update Content to Webview
      this._webview?.postMessage({
        type:fileType,
        content:content,
        fileName: fileName
      });
  }
  private _getHtmlForWebview() {
    // Load Scripts and CSS from media folder
    const scriptUri = this._webview?.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'jsoneditor.min.js'));
    const scriptMainUri = this._webview?.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'index.js'));
    const stylesJsonEditorUri = this._webview?.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'jsoneditor.min.css'));
    const stylesMainUri = this._webview?.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'main.css'));
    const nonce = getNonce();
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
                    <button id="refresh" class="nav-button red-back" >
                      <span class="nav-button-front red-front">&#x21bb; Refresh </span>
                    </button>
                    <button id="writejson" class="nav-button" >
                      <span class="nav-button-front">&#9827; Write JSON </span>
                    </button>
                    <button id="writexml" class="nav-button" >
                      <span class="nav-button-front">&#9824; Write XML </span>
                    </button>
                  </div>
                </div>
                <div id="jsoneditor" style="width: 100%; height: 800px;"></div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
                <script nonce="${nonce}" src="${scriptMainUri}"></script>	
              </body>
            </html>`;
  }

}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

