import * as vscode from 'vscode';
import { Translate } from './actions/translate';
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "Quick Translation" is now active!');
	let outputChannel:vscode.OutputChannel;
	const translateRow = vscode.commands.registerCommand('quick-translation.translate.row', () => {
		if(!outputChannel){
			outputChannel=vscode.window.createOutputChannel("quick-translation");
			outputChannel.show();
		}
		const translate =new Translate(outputChannel, 'row');
		translate.run();
	});
	const translateSelected = vscode.commands.registerCommand('quick-translation.translate.selected', () => {
		if(!outputChannel){
			outputChannel=vscode.window.createOutputChannel("quick-translation");
			outputChannel.show();
		}
		const translate =new Translate(outputChannel, 'selected');
		translate.run();
	});
	context.subscriptions.push(translateRow);
	context.subscriptions.push(translateSelected);
}
export function deactivate() {}
