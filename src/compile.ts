import * as vscode from "vscode";
import * as path from "path";
import {
	getCompileCommand,
	getCompileOutDirName,
	processCompileCommand,
	ensureOutDir,
	removeDir,
	getCurrentPath,
} from "./utils";
import type { CompileCommand } from "./types";

export type { CompileCommand };

/**
 * 构建编译和运行的完整命令
 * @param languageId 语言ID
 * @param dir 当前文件所在目录
 * @param filePath 源文件路径
 * @param filename 源文件名（含扩展名）
 * @returns 编译和运行的命令数组，如果没有找到配置则返回 null
 */
export function buildCompileCommands(
	languageId: string,
	dir: string,
	filePath: string,
	filename: string
): { compile: string; run: string; outDir: string } | null {
	const compileConfig = getCompileCommand(languageId);
	if (!compileConfig) {
		return null;
	}

	const outDirName = getCompileOutDirName();
	const outDir = ensureOutDir(dir, outDirName);
	const outName = path.parse(filename).name;

	const compile = processCompileCommand(compileConfig.compile, filePath, outDir, outName);
	const run = processCompileCommand(compileConfig.run, filePath, outDir, outName);

	return { compile, run, outDir };
}

/**
 * 清除输出目录
 */
export function clearOutDir(): void {
	const pathInfo = getCurrentPath();
	if (!pathInfo) {
		vscode.window.showErrorMessage("无法获取当前文件路径!");
		return;
	}

	const { dir } = pathInfo;
	const outDirName = getCompileOutDirName();
	const outDir = path.join(dir, outDirName);

	if (outDir) {
		removeDir(outDir);
		vscode.window.showInformationMessage("✅ 已清除输出目录!");
	} else {
		vscode.window.showWarningMessage("输出目录不存在!");
	}
}

/**
 * 清除输出目录（旧函数名，保持兼容性）
 * @deprecated 使用 clearOutDir 代替
 */
export function clear(): void {
	clearOutDir();
}
