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
 * 使用 VS Code Tasks API 执行命令
 * 
 * 此函数使用 VS Code 官方的 Tasks API 来执行命令，这是比操作终端更可靠的方式
 * 它会自动处理工作目录，并在输出面板中显示结果
 * 
 * @param command 要执行的命令，其中的"<file>"会被替换为当前文件的路径
 * @param dir 当前文件所在的目录，用于设置任务的工作目录
 * @param filePath 当前文件的路径，用于替换命令中的"<file>"部分
 */
async function executeCommandViaTasks(command: string, dir: string, filePath: string) {
	// 替换命令中的 <file> 占位符
	const processedCommand = command.replace("<file>", filePath || "");
	
	// 创建任务定义
	const taskDefinition: vscode.TaskDefinition = {
		type: "shell",
		command: processedCommand,
	};
	
	// 创建 ShellExecution 来执行命令
	const execution = new vscode.ShellExecution(processedCommand, {
		cwd: dir, // 设置工作目录
	});
	
	// 创建任务
	const task = new vscode.Task(
		taskDefinition,
		vscode.TaskScope.Workspace,
		"Runner",
		"runner",
		execution
	);
	
	// 执行任务
	try {
		await vscode.tasks.executeTask(task);
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to execute task: ${error}`);
	}
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
export async function runner() {
    try {
        // 获取当前活动的文本编辑器的文档
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        
        const file = editor.document;
        // 获取当前文件的编程语言标识符
        const languageId = getLanguageId(file);
        // 根据编程语言获取相应的执行命令
        let command: string = getCommand(languageId);

        // 如果没有找到对应的执行命令，则显示错误消息并返回
        if (!command) {
            vscode.window.showErrorMessage(`No command for ${languageId} !`);
            return;
        }

        // 获取当前文件的路径信息
        const pathInfo = getCurrentPath();
        if (!pathInfo) {
            return;
        }
        
        const { dir, filePath, filename } = pathInfo;

        // 需要编译再执行的文件
        if (LANGUAGE_LIST.includes(languageId)) {
            command = compileCommend(command, dir, filename);
        }

        // 使用 Tasks API 执行命令
        await executeCommandViaTasks(command, dir, filePath);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to run command: ${error}`);
    }
}