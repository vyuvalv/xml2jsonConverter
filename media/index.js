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

    window.addEventListener("message", (event) => {
      jsonContent = event.data.message;
      const fileName = event.data.fileName;
      document.getElementById('filetitle').innerHTML = fileName;
      // get json
      editor.set(jsonContent);
      editor.expandAll();
      editor.focus();
    });

 
    function submitMessage(e, actionName="xmlfile") {
			
      e.preventDefault();
      e.stopPropagation();
      console.log('shoot');
      const updatedJson = editor.get();
      console.log(updatedJson);

      vscode.postMessage({
        type: actionName,
        value: JSON.stringify(updatedJson),
        rootKey:'Layout'
        });
    };

  document.getElementById("writexml")?.addEventListener("click", (e) => {
    submitMessage(e, "xmlfile");
  });
  document.getElementById("writejson")?.addEventListener("click", (e) => {
    submitMessage(e, "jsonfile");
  });
  document.getElementById("refresh")?.addEventListener("click", (e) => {
    submitMessage(e, "refreshfile");
  });
})();
