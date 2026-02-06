import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import type { CompileCommand, PathInfo, ProjectCommandConfig, RunCommandConfig, CompileCommandConfig } from "./types";

// ==================== Config Utils ====================

/**
 * 获取 runner 配置
 * @returns runner 配置对象
 */
export function getRunnerConfig(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration("runner");
}

/**
 * 获取直接运行命令
 * @param languageId 语言ID
 * @returns 对应的命令，如果未找到则返回 null
 */
export function getRunCommand(languageId: string): string | null {
	const config = getRunnerConfig();
	const commands = config.get<RunCommandConfig>("runCommands") || {};
	return commands[languageId] || null;
}

/**
 * 获取编译命令配置
 * @param languageId 语言ID
 * @returns 编译命令配置，如果没有找到则返回 null
 */
export function getCompileCommand(languageId: string): CompileCommand | null {
	const config = getRunnerConfig();
	const compileCommands = config.get<CompileCommandConfig>("compileCommands") || {};
	return compileCommands[languageId] || null;
}

/**
 * 获取项目运行命令配置
 * @param commandType 命令类型（如 npm、yarn、pnpm）
 * @returns 对应的命令，如果未找到则返回 null
 */
export function getProjectCommand(commandType: string): string | null {
	const config = getRunnerConfig();
	const commands = config.get<ProjectCommandConfig>("projectCommands") || {};
	return commands[commandType] || null;
}

/**
 * 获取默认的项目运行命令类型
 * @returns 默认命令类型
 */
export function getDefaultCommandType(): string {
	const config = getRunnerConfig();
	return config.get<string>("projectDefaultCommand") || "npm";
}

/**
 * 获取编译输出目录名称
 * @returns 输出目录名称
 */
export function getCompileOutDirName(): string {
	const config = getRunnerConfig();
	return config.get<string>("compileOutDir") || "out";
}

// ==================== Path Utils ====================

/**
 * 获取当前文件的路径信息
 * @returns 当前文件的路径信息
 */
export function getCurrentPath(): PathInfo | null {
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
 * 获取工作区根目录
 * @returns 工作区根目录路径，如果没有打开工作区则返回 null
 */
export function getWorkspaceRoot(): string | null {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return null;
	}
	return workspaceFolders[0].uri.fsPath;
}

/**
 * 获取当前打开的文件路径
 * @returns 当前文件路径，如果没有打开文件则返回 null
 */
export function getCurrentFile(): string | null {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return null;
	}
	return editor.document.uri.fsPath;
}

/**
 * 获取文件的语言ID
 * @param file 文件对象
 * @returns 文件的语言ID
 */
export function getLanguageId(file: vscode.TextDocument | undefined): string {
	// 获取文件的语言ID
	let languageId = file?.languageId || "";
	// 如果语言ID是"objective-c"，则将其修改为"c"
	if (languageId === "objective-c") {
		languageId = "c";
	}
	// 返回文件的语言ID
	return languageId;
}

// ==================== Task Utils ====================

/**
 * 使用 VS Code Tasks API 执行单个命令
 *
 * @param command 要执行的命令
 * @param cwd 工作目录
 * @param name 任务名称
 */
export async function executeSingleCommand(
	command: string,
	cwd: string,
	name: string
): Promise<void> {
	// 创建任务定义
	const taskDefinition: vscode.TaskDefinition = {
		type: "shell",
		command: command,
	};

	// 创建 ShellExecution 来执行命令
	const execution = new vscode.ShellExecution(command, {
		cwd: cwd,
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
 * @param cwd 工作目录
 * @param outDir 输出目录
 */
export async function executeCompileAndRun(
	compileCommand: string,
	runCommand: string,
	cwd: string,
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
		cwd: cwd,
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
 * 使用 VS Code Tasks API 执行项目运行命令
 *
 * @param command 要执行的命令
 * @param workspaceRoot 工作区根目录
 * @param name 任务名称
 */
export async function executeProjectCommand(
	command: string,
	workspaceRoot: string,
	name: string
): Promise<void> {
	// 创建任务定义
	const taskDefinition: vscode.TaskDefinition = {
		type: "shell",
		command: command,
	};

	// 创建 ShellExecution 来执行命令
	const execution = new vscode.ShellExecution(command, {
		cwd: workspaceRoot,
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

// ==================== Command Utils ====================

/**
 * 处理编译命令中的占位符
 * @param command 原始命令
 * @param filePath 源文件路径
 * @param outDir 输出目录
 * @param outName 输出文件名（不含扩展名）
 * @returns 处理后的命令
 */
export function processCompileCommand(
	command: string,
	filePath: string,
	outDir: string,
	outName: string
): string {
	return command
		.replace(/<file>/g, filePath)
		.replace(/<outDir>/g, outDir)
		.replace(/<out>/g, outName);
}

/**
 * 处理项目命令中的占位符
 * @param command 原始命令
 * @param workspaceRoot 工作区根目录
 * @param filePath 当前文件路径（可选）
 * @returns 处理后的命令
 */
export function processProjectCommand(
	command: string,
	workspaceRoot: string,
	filePath: string | null
): string {
	let processedCommand = command.replace(/<workspace>/g, workspaceRoot);

	// 如果命令包含 <file> 占位符，替换它
	if (filePath) {
		processedCommand = processedCommand.replace(/<file>/g, filePath);
	}

	return processedCommand;
}

/**
 * 处理运行命令中的占位符
 * @param command 原始命令
 * @param filePath 文件路径
 * @returns 处理后的命令
 */
export function processRunCommand(command: string, filePath: string): string {
	return command.replace(/<file>/g, filePath);
}

// ==================== FS Utils ====================

/**
 * 确保目录存在，如果不存在则创建
 * @param dirPath 目录路径
 * @returns 目录路径
 */
export function ensureDir(dirPath: string): string {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
	return dirPath;
}

/**
 * 删除目录及其内容
 * @param dirPath 目录路径
 */
export function removeDir(dirPath: string): void {
	if (fs.existsSync(dirPath)) {
		// 删除目录中的所有文件
		const files = fs.readdirSync(dirPath);
		for (const file of files) {
			const filePath = path.join(dirPath, file);
			fs.unlinkSync(filePath);
		}
		fs.rmdirSync(dirPath);
	}
}

/**
 * 获取编译输出目录
 * @param dir 当前文件所在目录
 * @param outDirName 输出目录名称
 * @returns 编译输出目录的完整路径
 */
export function getCompileOutDir(dir: string, outDirName: string): string {
	return path.join(dir, outDirName);
}

/**
 * 确保编译输出目录存在
 * @param dir 当前文件所在目录
 * @param outDirName 输出目录名称
 * @returns 输出目录的完整路径
 */
export function ensureOutDir(dir: string, outDirName: string): string {
	const outDir = getCompileOutDir(dir, outDirName);
	return ensureDir(outDir);
}
