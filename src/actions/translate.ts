"use strict";

import * as http from "http";
import * as vscode from "vscode";
import * as crypto from "crypto";
import * as querystring from "querystring";
import { Youdao } from "../helper/translate-tool";



export class Translate {
  private settings: {
    appSecret: string,
    appKey: string,
    toLang: string,
    tool: string
  } = {
      appSecret: "",
      appKey: "",
      toLang: "英语",
      tool: "有道"
    };
  constructor() {
    this.getConfig();
  }
  /**调用有道翻译 */
  async run() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const content = this.getContent();
    if (content) {
      this.t();
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
    const appSecret = settings.get(`translate.${toolName}.appSecret`, "");
    const appKey = settings.get(`translate.${toolName}.appKey`, "");
    const _settings = {
      appSecret,
      appKey,
      toLang,
      tool
    };
    this.settings = _settings;
  }
  /**获取待翻译内容 */
  private getContent(): string {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return "";
    }
    const settings = vscode.workspace.getConfiguration();
    const way = settings.get("translate.select", "") as any;
    let content = "";
    switch (way) {
      case "selected":
        const selection = editor.selection;
        content = editor.document.getText(selection);
        break;
      case "row":
        const line = editor.document.lineAt(editor.selection.active.line);
        content = line.text;
        break;
    }
    return content;
  }
  private t() {
    console.log(`${this.settings.tool} 翻译`)
    switch (this.settings.tool) {
      case "YOU_DAO":
        Youdao.translate(this.getContent(), this.settings).then(this.onSuccess, this.onFail);
        break;
      case "BAI_DU":
        Youdao.translate(this.getContent(), this.settings).then(this.onSuccess, this.onFail);
        break;
    }
  }
  /**翻译成功拦截 */
  private onSuccess(inputText: string, outputText: string) {
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
