import * as xml2js from 'xml2js';
import * as vscode from 'vscode';

export function convertXmlFileToJson(fileContent:string | undefined) {
    const isXML = fileContent?.includes('<?xml');
    if(!isXML) {
      vscode.window.showErrorMessage(`Must be an XML File!`);
      return {};
    }
   
    const parser = new xml2js.Parser({
        explicitRoot: true,
        explicitArray: false,
        trim: true,
        async:true
    });
  
    return new Promise((resolve, reject) => {
      parser.parseString(`${fileContent}`, (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  export async function convertJsonFileToXml(fileContent:any) {
    // Get JSON File content to convert
    let jsonData:any = {};
    try {
        jsonData = JSON.parse(fileContent);
    } catch (error) {
      vscode.window.showErrorMessage(`Must be a valid JSON File!`);
      return {};
    }
    // Extract the first Key as Root Key
    const rootKey = Object.keys(jsonData)[0];
    // Set XML Builder Options
    const builder = new xml2js.Builder({ 
        rootName: rootKey,
        headless: false,
        renderOpts: { 
          pretty:true,
          indent:"    ",
          newline:"\n"  
        },
        xmldec:{
          encoding:"UTF-8",
          version:"1.0"
        } 
      });

    return new Promise((resolve, reject) => {
        try {
            const xml = builder.buildObject(jsonData[rootKey]);
            resolve(xml);
        } catch (error) {
            reject(error);
        }
      });
  }
 