import * as vscode from 'vscode';
import { convertXmlFileToJson, convertJsonFileToXml } from './xmlHelper';
/**
 * Manages JSON Editor webview panels
 */
export class XmlJsonEditorPanel {
  public static readonly viewType = 'jsonEditorView';
  private _panel?: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private _webview?:vscode.Webview;
  private _disposables: vscode.Disposable[] = [];
  private  _activeEditor?:vscode.TextEditor;
  public originalFileContent: any;
  public convertedFileContent: any;
  public editorTitle: any;
  public isXml: boolean;
  private _curentFilePath: any;
  private _editorColumn: vscode.ViewColumn;

  public constructor(context: vscode.ExtensionContext, file:vscode.Uri, useActiveEditor:boolean ) {
    this._context = context;
    // Set File Path and Title Properties
    this._curentFilePath = file.fsPath;
    this.isXml = this._curentFilePath.includes('.xml');
    // Format file path for title
    this.editorTitle = this._curentFilePath.split('/').pop();
    this._editorColumn = vscode.ViewColumn.One;
  }

  public createOrShowPanel(): vscode.WebviewPanel {
    this._editorColumn = this._activeEditor?.viewColumn === vscode.ViewColumn.One ? vscode.ViewColumn.Two : vscode.ViewColumn.One;
		// If we already have a panel, show it.
		if (this._panel) {
			this._panel.reveal(this._editorColumn);
			return this._panel;
		}
		// Otherwise, create a new panel.
		this._panel = vscode.window.createWebviewPanel(
			XmlJsonEditorPanel.viewType,
			this.editorTitle,
			this._editorColumn,
			{
				localResourceRoots: [this._context.extensionUri],
				enableScripts: true,
				retainContextWhenHidden: true
			} 
    );
    // sets webview  
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


  public async getContentFromActiveEditor() { 
    this._activeEditor = vscode.window.activeTextEditor;
    if (!this._activeEditor) {
      return;
    }
    return await this._activeEditor?.document.getText();
  }

  public async getContentFromExplorerFile(filePath?:string) { 
    if (!this._curentFilePath) {
      this._curentFilePath = filePath;
    }
    const doc = await vscode.workspace.openTextDocument(this._curentFilePath); 
    return await doc.getText();
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
        this.doConvertXmlToJson(this.originalFileContent, true);
        break;
      case 'json':
        const jsonData = JSON.parse(this.originalFileContent);
        this.updateWebview(jsonData, this.editorTitle, 'json');
        break;
    }

  }
	// XML to JSON Action from Opened XML Editor File
  public async doConvertXmlToJson(fileContent?:any, doUpdate?:boolean) {
    let jsonData;
    if (!this.originalFileContent) {
      this.originalFileContent = fileContent;
    }
    try {
      jsonData = await convertXmlFileToJson(this.originalFileContent);
      // Update Content to Webview
      if(doUpdate){
        this.updateWebview(jsonData, this.editorTitle, 'xml');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Could not convert file! Bad XML`);
    }
    return jsonData;
  }

  public updateWebview(content: any, fileName:string, fileType:string) { 
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

