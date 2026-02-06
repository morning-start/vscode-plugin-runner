import * as vscode from "vscode";
import { buildCompileCommands } from "./compile";
import * as path from "path";

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
 * 获取直接运行命令
 * @param languageId 语言ID
 * @returns 对应的命令，如果未找到则返回 null
 */
function getRunCommand(languageId: string): string | null {
	const config = vscode.workspace.getConfiguration("runner");
	const commands = config.get<Record<string, string>>("runCommands") || {};
	return commands[languageId] || null;
}

/**
 * 使用 VS Code Tasks API 执行单个命令
 * 
 * @param command 要执行的命令
 * @param dir 工作目录
 * @param name 任务名称
 */
async function executeSingleCommand(command: string, dir: string, name: string): Promise<void> {
	// 创建任务定义
	const taskDefinition: vscode.TaskDefinition = {
		type: "shell",
		command: command,
	};

	// 创建 ShellExecution 来执行命令
	const execution = new vscode.ShellExecution(command, {
		cwd: dir,
	});

	// 创建任务
	const task = new vscode.Task(
		taskDefinition,
		vscode.TaskScope.Workspace,
		name,
		"runner",
		execution
	);

	// 执行任务
	await vscode.tasks.executeTask(task);
}

/**
 * 使用 VS Code Tasks API 执行编译和运行命令
 * 
 * 使用复合任务来确保编译成功后再运行
 * 
 * @param compileCommand 编译命令
 * @param runCommand 运行命令
 * @param dir 工作目录
 * @param outDir 输出目录
 */
async function executeCompileAndRun(
	compileCommand: string,
	runCommand: string,
	dir: string,
	outDir: string
): Promise<void> {
	// Windows 下使用 && 连接命令，确保编译成功后才运行
	const isWindows = process.platform === "win32";
	const separator = isWindows ? " && " : " && ";

	// 构建组合命令：先编译，成功后运行
	const combinedCommand = `${compileCommand}${separator}${runCommand}`;

	// 创建任务定义
	const taskDefinition: vscode.TaskDefinition = {
		type: "shell",
		command: combinedCommand,
	};

	// 创建 ShellExecution
	const execution = new vscode.ShellExecution(combinedCommand, {
		cwd: dir,
	});

	// 创建任务
	const task = new vscode.Task(
		taskDefinition,
		vscode.TaskScope.Workspace,
		"Compile and Run",
		"runner",
		execution
	);

	// 设置任务分组为构建
	task.group = vscode.TaskGroup.Build;

	// 执行任务
	await vscode.tasks.executeTask(task);
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
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showInformationMessage("No active editor found.");
		return null;
	}

	const document = editor.document;
	const uri = document.uri;

	// 获取完整文件路径
	const filePath = uri.fsPath;

	// 使用 path 模块解析目录路径和文件名
	const dir = path.dirname(filePath);
	const filename = path.basename(filePath);

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

		// 获取当前文件的路径信息
		const pathInfo = getCurrentPath();
		if (!pathInfo) {
			return;
		}

		const { dir, filePath, filename } = pathInfo;

		// 首先尝试获取编译命令配置（适用于 C、C++、Rust 等）
		const compileCommands = buildCompileCommands(languageId, dir, filePath, filename);

		if (compileCommands) {
			// 需要编译的语言：执行编译和运行
			await executeCompileAndRun(
				compileCommands.compile,
				compileCommands.run,
				dir,
				compileCommands.outDir
			);
		} else {
			// 尝试获取直接运行命令（适用于 JavaScript、Python 等）
			const runCommand = getRunCommand(languageId);

			if (!runCommand) {
				vscode.window.showErrorMessage(`No command configured for language: ${languageId}`);
				return;
			}

			// 替换命令中的 <file> 占位符
			const processedCommand = runCommand.replace(/<file>/g, filePath);

			// 直接运行
			await executeSingleCommand(processedCommand, dir, `Run ${languageId}`);
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to run command: ${error}`);
	}
}
