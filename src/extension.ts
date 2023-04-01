// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { json } from "stream/consumers";
import * as vscode from "vscode";
import * as fs from "fs";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "runner" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand("runner.run", () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage("Hello World from runner!");
		// TODO 获取配置
		const config = vscode.workspace.getConfiguration("runner");
		let message = JSON.stringify(config.get("commands"));
		let commands = JSON.parse(message);
		let languageId = vscode.window.activeTextEditor?.document.languageId || "";
		// 如果languageId是objective-c将文件改为c
		if (languageId === "objective-c") {
			languageId = "c";
		}
		let command = commands[languageId] || "";

		// vscode.window.showInformationMessage(languageId);

		if (!command) {
			return vscode.window.showErrorMessage(`No command for ${languageId} !`);
		}

		// TODO 获取当前文件的文件夹路径
		let path = vscode.window.activeTextEditor?.document.fileName;
		let dir = path?.substring(0, path.lastIndexOf("\\"));
		let file = path?.substring(path.lastIndexOf("\\") + 1);
		// vscode.window.showInformationMessage(file || "");
		// 如果file是c则替换为没有扩展名
		if (file?.endsWith(".c")) {
			let filename = file.substring(0, file.lastIndexOf("."));
			// 创建out文件夹
			let outDir = "out";
			if (!fs.existsSync(`${dir}\\${outDir}`)) {
				fs.mkdirSync(`${dir}\\${outDir}`);
			}
			// 补充command -o file ; ./file
			command = `${command} -o ${outDir}/${filename} ; ${outDir}/${filename}`;
		}

		// TODO 打开terminal, 并切换到当前文件的文件夹路径
		// 判断当前是否有terminal Runner
		let terminals = vscode.window.terminals;
		let shell =
			terminals.find((item) => item.name === "Runner") ||
			vscode.window.createTerminal("Runner");
		shell.show();
		shell.sendText(`cd ${dir}`);
		// 全部替换
		shell.sendText(command.replace("<file>", file || ""));
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
