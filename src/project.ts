import * as vscode from "vscode";
import * as path from "path";

/**
 * 获取项目运行命令配置
 * @param commandType 命令类型（如 npm、yarn、pnpm）
 * @returns 对应的命令，如果未找到则返回 null
 */
function getProjectCommand(commandType: string): string | null {
	const config = vscode.workspace.getConfiguration("runner");
	const commands = config.get<Record<string, string>>("projectCommands") || {};
	return commands[commandType] || null;
}

/**
 * 获取默认的项目运行命令类型
 * @returns 默认命令类型
 */
function getDefaultCommandType(): string {
	const config = vscode.workspace.getConfiguration("runner");
	return config.get<string>("projectDefaultCommand") || "npm";
}

/**
 * 获取工作区根目录
 * @returns 工作区根目录路径，如果没有打开工作区则返回 null
 */
function getWorkspaceRoot(): string | null {
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
function getCurrentFile(): string | null {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return null;
	}
	return editor.document.uri.fsPath;
}

/**
 * 使用 VS Code Tasks API 执行项目运行命令
 *
 * @param command 要执行的命令
 * @param workspaceRoot 工作区根目录
 * @param filePath 当前文件路径
 * @param name 任务名称
 */
async function executeProjectCommand(
	command: string,
	workspaceRoot: string,
	filePath: string | null,
	name: string
): Promise<void> {
	// 替换命令中的占位符
	let processedCommand = command.replace(/<workspace>/g, workspaceRoot);

	// 如果命令包含 <file> 占位符，替换它
	if (filePath) {
		processedCommand = processedCommand.replace(/<file>/g, filePath);
	}

	// 创建任务定义
	const taskDefinition: vscode.TaskDefinition = {
		type: "shell",
		command: processedCommand,
	};

	// 创建 ShellExecution 来执行命令
	const execution = new vscode.ShellExecution(processedCommand, {
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

/**
 * 选择项目运行命令类型
 * @returns 用户选择的命令类型
 */
async function selectCommandType(): Promise<string | null> {
	const config = vscode.workspace.getConfiguration("runner");
	const commands = config.get<Record<string, string>>("projectCommands") || {};
	const defaultType = getDefaultCommandType();

	const items = Object.keys(commands).map((key) => ({
		label: key,
		description: commands[key],
		picked: key === defaultType,
	}));

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: "选择项目运行命令类型",
		ignoreFocusOut: true,
	});

	if (!selected) {
		return null;
	}

	return selected.label;
}

/**
 * 运行项目
 * 该函数根据配置运行整个项目，支持 <workspace> 和 <file> 占位符
 */
export async function runProject(): Promise<void> {
	try {
		// 获取工作区根目录
		const workspaceRoot = getWorkspaceRoot();
		if (!workspaceRoot) {
			vscode.window.showErrorMessage("请先打开一个工作区文件夹!");
			return;
		}

		// 选择命令类型
		const commandType = await selectCommandType();
		if (!commandType) {
			return;
		}

		// 获取项目运行命令
		const projectCommand = getProjectCommand(commandType);
		if (!projectCommand) {
			vscode.window.showErrorMessage(
				`未找到 ${commandType} 类型的项目运行命令配置`
			);
			return;
		}

		// 获取当前文件路径（如果命令需要 <file> 占位符）
		const currentFile = getCurrentFile();
		if (projectCommand.includes("<file>") && !currentFile) {
			vscode.window.showErrorMessage("当前命令需要打开一个文件!");
			return;
		}

		// 执行项目运行命令
		await executeProjectCommand(
			projectCommand,
			workspaceRoot,
			currentFile,
			`Run Project (${commandType})`
		);

		vscode.window.showInformationMessage(
			`✅ 正在运行项目: ${path.basename(workspaceRoot)}`
		);
	} catch (error) {
		vscode.window.showErrorMessage(`运行项目失败: ${error}`);
	}
}
