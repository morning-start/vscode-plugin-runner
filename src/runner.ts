import * as vscode from "vscode";
import * as fs from "fs";
import { compileCommend } from "./compile";
import * as path from "path";

const LANGUAGE_LIST = ["c", "rust"];
let lastDir: string = "";

/**
 * 获取文件的语言ID
 * @param file 文件对象
 * @returns 文件的语言ID
 */
function getLanguageId(file: vscode.TextDocument | undefined): string {
	// 获取文件的语言ID
	let languageId = file?.languageId || "";
	// 如果语言ID是"objective-c"，则将其修改为"c"
	if (languageId === "objective-c") {
		languageId = "c";
	}
	// 返回文件的语言ID
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
	const pathInfo = getCurrentPath(); // 获取当前文件路径信息
	if (!pathInfo) {
		return; // 如果没有活动编辑器或路径信息，直接退出
	}

	if (!shell) {
		// 创建终端并设置工作目录
		shell = vscode.window.createTerminal({
			name: "Current File Terminal", // 终端名称
			cwd: pathInfo.dir, // 设置工作目录为当前文件所在目录
		});
	}
	shell.show();
	// 全部替换
	shell.sendText(command.replace("<file>", filePath || ""));
}

/**
 * 获取当前文件的路径信息
 * @returns 当前文件的路径信息
 */
export function getCurrentPath(): {
	dir: string;
	filePath: string;
	filename: string;
} | null {
	const editor = vscode.window.activeTextEditor; // 获取当前活动的编辑器
	if (!editor) {
		vscode.window.showInformationMessage("No active editor found.");
		return null;
	}

	const document = editor.document; // 获取当前文档
	const uri = document.uri; // 获取文档的 URI

	// 获取完整文件路径
	const filePath = uri.fsPath;

	// 使用 path 模块解析目录路径和文件名
	const dir = path.dirname(filePath); // 获取目录路径
	const filename = path.basename(filePath); // 获取文件名

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
	let { dir, filePath, filename } = getCurrentPath()!;

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
