import * as vscode from "vscode";
import * as fs from "fs";
import { compileCommend } from "./compile";


const LANGUAGE_LIST = ["c", "rust"];
let lastDir: string = "";

// 获取文件languageId
function getLanguageId(file: vscode.TextDocument | undefined): string {
	let languageId = file?.languageId || "";
	if (languageId === "objective-c") {
		languageId = "c";
	}
	return languageId;
}

function getCommand(languageId: string): string {
	const config = vscode.workspace.getConfiguration("runner");
	let commands = JSON.parse(JSON.stringify(config.get("commands")));
	let command: string = commands[languageId] || "";
	return command;
}

function run(command: string, dir: string, filePath: string) {
	let terminals = vscode.window.terminals;
	let shell = terminals.find((item) => item.name === "Runner");
	if (!shell) {
		shell = vscode.window.createTerminal("Runner");
		lastDir = "";
	}
	shell.show();
	if (lastDir !== dir) {
		shell.sendText(`cd "${dir}"`);
		lastDir = dir as string;
	}
	// 全部替换
	shell.sendText(command.replace("<file>", filePath || ""));
}



export function getCurrentPath(file: vscode.TextDocument | undefined): {
	dir: string;
	filePath: string;
	filename: string;
} {
	let path = file?.fileName as string;
	let dir = path.substring(0, path.lastIndexOf("\\"));
	let filePath = path.substring(path.lastIndexOf("\\") + 1);
	let filename = filePath.substring(0, filePath.lastIndexOf("."));
	return { dir, filePath, filename };
}

export function runner() {
	let file = vscode.window.activeTextEditor?.document;
	let languageId = getLanguageId(file);
	let command: string = getCommand(languageId);

	// vscode.window.showInformationMessage(languageId);

	if (!command) {
		return vscode.window.showErrorMessage(`No command for ${languageId} !`);
	}

	// TODO 获取当前文件的文件夹路径
	let { dir, filePath, filename } = getCurrentPath(file);

	// 需要编译再执行的文件
	if (LANGUAGE_LIST.includes(languageId)) {
		command = compileCommend(command, dir, filename);
	}
	// console.log(languageId in LANGUAGE_LIST);

	// 展示消息
	// vscode.window.showInformationMessage(languageId);

	// TODO 打开terminal
	// 切换到当前文件的文件夹路径
	// 运行命令
	run(command, dir, filePath);
}
