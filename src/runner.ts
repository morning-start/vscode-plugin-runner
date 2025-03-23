import * as vscode from "vscode";
import { compileCommend } from "./compile";
import * as path from "path";

const LANGUAGE_LIST = ["c", "rust"];

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

/**
 * 根据文件的语言ID获取对应的命令。
 * @param languageId - 文件的语言ID，用于从配置中查找对应的命令。
 * @returns 与语言ID对应的命令，如果未找到则返回空字符串。
 */
function getCommand(languageId: string): string {
    // 从工作区配置中获取 "runner" 部分的配置
    const config = vscode.workspace.getConfiguration("runner");
    // 深拷贝配置中的 "commands" 部分，避免直接修改原始配置
    let commands = JSON.parse(JSON.stringify(config.get("commands")));
    // 从 commands 对象中获取与 languageId 对应的命令，如果不存在则返回空字符串
    let command: string = commands[languageId] || "";
    return command;
}

/**
 * 在当前路径打开终端并执行命令
 * 
 * 此函数用于在Visual Studio Code中，根据当前文件路径打开一个终端，并在该终端中执行特定命令
 * 它首先尝试查找一个名为"Runner"的现有终端，如果找不到，则创建一个新的终端实例
 * 
 * @param command 要执行的命令，其中的"<file>"会被替换为当前文件的路径
 * @param dir 当前文件所在的目录，用于设置终端的工作目录
 * @param filePath 当前文件的路径，用于替换命令中的"<file>"部分
 */
function openTerminalAtCurrentPath(command: string,dir:string, filePath: string) {
	// 获取所有已打开的终端
	let terminals = vscode.window.terminals;
	// 尝试找到一个名为"Runner"的终端
	let shell = terminals.find((item) => item.name === "Runner");
	if (!shell) {
		// 创建终端并设置工作目录
		shell = vscode.window.createTerminal({
			name: "Runner", // 终端名称
			cwd: dir, // 设置工作目录为当前文件所在目录
		});
	}
	// 显示终端
	shell.show();
	// 发送命令到终端执行，其中"<file>"会被当前文件路径替换
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

/**
 * 运行当前文件的命令
 * 该函数根据当前文件的编程语言获取相应的执行命令，并在终端中运行该命令
 */
export function runner() {
    // 获取当前活动的文本编辑器的文档
    let file = vscode.window.activeTextEditor?.document;
    // 获取当前文件的编程语言标识符
    let languageId = getLanguageId(file);
    // 根据编程语言获取相应的执行命令
    let command: string = getCommand(languageId);

    // vscode.window.showInformationMessage(languageId);

    // 如果没有找到对应的执行命令，则显示错误消息并返回
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
    openTerminalAtCurrentPath(command,dir ,filePath);
}
