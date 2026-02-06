import * as vscode from "vscode";
import { buildCompileCommands } from "./compile";
import {
	getRunCommand,
	getCurrentPath,
	getLanguageId,
	executeSingleCommand,
	executeCompileAndRun,
	processRunCommand,
} from "./utils";

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
			const processedCommand = processRunCommand(runCommand, filePath);

			// 直接运行
			await executeSingleCommand(processedCommand, dir, `Run ${languageId}`);
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to run command: ${error}`);
	}
}
