import * as vscode from "vscode";
import * as path from "path";
import {
	getProjectCommand,
	getDefaultCommandType,
	getWorkspaceRoot,
	getCurrentFile,
	executeProjectCommand,
	processProjectCommand,
} from "./utils";

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

		// 处理命令中的占位符
		const processedCommand = processProjectCommand(
			projectCommand,
			workspaceRoot,
			currentFile
		);

		// 执行项目运行命令
		await executeProjectCommand(
			processedCommand,
			workspaceRoot,
			`Run Project (${commandType})`
		);

		vscode.window.showInformationMessage(
			`✅ 正在运行项目: ${path.basename(workspaceRoot)}`
		);
	} catch (error) {
		vscode.window.showErrorMessage(`运行项目失败: ${error}`);
	}
}
