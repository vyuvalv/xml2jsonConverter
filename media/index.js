// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  // create the editor
  const container = document.getElementById("jsoneditor");
  const options = {
    "mode":"tree",	
    "modes": ["tree","code","form","preview"],
    "search": true,
    "mainMenuBar":true,
    "navigationBar":true,
    "statusBar":true
  };
  const editor = new JSONEditor(container, options);
  let jsonContent;
  let fileType;
  // Listen to messages from vscode
  window.addEventListener("message", (event) => {
    const { type, content, fileName } = event.data;
    jsonContent = content;
    fileType = type;
    console.log(`Received content from ${type} file as JSON`);
    
      document.getElementById('filetitle').innerHTML = fileName;
      // get json
      editor.set(jsonContent);
      editor.expandAll();
      editor.focus();
    });

    // Build and Post Message to vscode
    function submitMessage(e, actionName="writexml") {
			
      e.preventDefault();
      e.stopPropagation();
      
      const updatedJson = editor.get();
      console.log(updatedJson);

      let eventType = 'xmlfile';
      switch (actionName) {
        case "writexml":
          eventType = 'xmlfile';
          break;
        case "writejson":
          eventType = 'jsonfile';
          break;
        case "refresh":
          eventType = 'refreshfile';
          break;
        default:
          eventType = 'xmlfile';
          break;
      }
      // value must be string
      vscode.postMessage({
        type: eventType,
        originalType: fileType,
        value: JSON.stringify(updatedJson)
        });
    };

    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(item => {
      item.addEventListener('click', (e) => { submitMessage(e, item.id); }, false);
    });

})();
