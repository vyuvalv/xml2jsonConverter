#  README
# VS Code extension `xml2jsoneditor`
Main Use case for this extension was for Salesforce sfdx xml files, to allow edit and modification of some xml.

## Features
    - Convert XML file to JSON and allow to edit using JSON EDitor

- VS Code Extension using:
    * [xml2js](https://www.npmjs.com/package/xml2js)
    * [jsoneditor](https://www.npmjs.com/package/jsoneditor) 

Working from :
- `editor/context`:
    - Any Open Editor XML/JSON file supports `right click` and will allow to view in JSON editor
- `explorer/context`:
    - Any Explorer XML/JSON file supports `right click` and will allow to view in JSON editor
- *JSON Editor* will allow to modify the JSON content as you wish - eg. edit, sort, filter...
- Extension will allow a few more option to complete the process.
    - Convert an XML file that was previously converted to JSON Back to XML.
    - Export as JSON
    - Refresh content

# Preview
![Screenshot](./docs/EditorXml_DEMO.gif)
