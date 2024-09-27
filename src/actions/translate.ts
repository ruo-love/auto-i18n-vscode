"use strict";

import * as vscode from "vscode";
import { Baidu, Youdao } from "../helper/translate-tool";

export class Translate {
  private way:string;
  private settings: {
    appSecret: string,
    appKey: string,
    toLang: string,
    tool: string
  } = {
      appSecret: "",
      appKey: "",
      toLang: "英语",
      tool: ""
    };
  private out: vscode.OutputChannel; 
  constructor(out: vscode.OutputChannel, way:'row'|'selected') {
    this.out = out;
    this.way = way;
    this.getConfig();
  }
  /**run */
  async run() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const content = this.getContent();
    if (content) {
      this.translate(content);
    } else {
      vscode.window.showErrorMessage("翻译内容不能为空");
    }
  }
  private ToolMap = {
    "有道": "YOU_DAO",
    "百度": "BAI_DU"
  };
  /**获取settings */
  private getConfig() {
    const settings = vscode.workspace.getConfiguration();
    const toolName = settings.get("translate.tool", "") as keyof typeof this.ToolMap;
    const tool = this.ToolMap[toolName];
    const toLang = settings.get("translate.toLang", '英文');
    const app_secret_path = `${tool}.appSecret`;
    const app_key_path =`${tool}.appKey`;
    const appSecret = settings.get(app_secret_path, "");
    const appKey = settings.get(app_key_path, "");
    const _settings = {
      appSecret,
      appKey,
      toLang,
      tool
    };
    this.settings = _settings;
    return _settings;
  }
  /**获取待翻译内容 */
  private getContent(): string {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return "";
    }
    let content = "";
    switch (this.way) {
      case "selected":
        const selection = editor.selection;
        content = editor.document.getText(selection);
        break;
      case "row":
        const line = editor.document.lineAt(editor.selection.active.line);
        content = line.text;
        break;
    }
    return content.trim();
  }
  /**翻译 */
  private async translate(content:string) {
    try{
      let res={};
      switch (this.settings.tool) {
        case "YOU_DAO":
          res=  await Youdao.translate(content, this.settings);
          break;
        case "BAI_DU":
          res= await Baidu.translate(content, this.settings);
          break;
      }
      this.onSuccess(res);
    }catch(err){
      this.onFail(err);
    }
  
  }
  /**翻译成功拦截 */
  private onSuccess({inputText, outputText,response}:any) {
    vscode.env.clipboard
      .writeText(outputText)
      .then(() => {
        vscode.window.showInformationMessage(
          "Translation success"
        );
      });
      this.out.clear();
      this.out.appendLine(inputText);
      this.out.appendLine(outputText);
  }
  /**翻译失败拦截 */
  private onFail(e: any) {
    vscode.window.showErrorMessage(e.message);
  }
}
