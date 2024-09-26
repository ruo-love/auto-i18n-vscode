import * as vscode from 'vscode';
import { Translate } from './actions/translate';
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "i18n-auto" is now active!');
	let outputChannel:vscode.OutputChannel;
	const disposable = vscode.commands.registerCommand('i18n-auto.translate', () => {
		if(!outputChannel){
			outputChannel=vscode.window.createOutputChannel("i18n-auto");
			outputChannel.show();
		}
		const translate =new Translate(outputChannel);
		translate.run();
	});
	context.subscriptions.push(disposable);
}
export function deactivate() {}
