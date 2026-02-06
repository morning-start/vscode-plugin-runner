import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getCurrentPath } from "./runner";

/**
 * 编译命令配置接口
 */
export interface CompileCommand {
	compile: string;
	run: string;
}

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
 * 获取编译输出目录
 * @param dir 当前文件所在目录
 * @returns 编译输出目录的完整路径
 */
export function getCompileOutDir(dir: string): string {
	const config = vscode.workspace.getConfiguration("runner");
	const outDirName = config.get<string>("compileOutDir") || "out";
	return path.join(dir, outDirName);
}

/**
 * 确保输出目录存在
 * @param dir 当前文件所在目录
 * @returns 输出目录的完整路径
 */
export function ensureOutDir(dir: string): string {
	const outDir = getCompileOutDir(dir);
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}
	return outDir;
}

/**
 * 获取编译命令配置
 * @param languageId 语言ID
 * @returns 编译命令配置，如果没有找到则返回 null
 */
export function getCompileCommand(languageId: string): CompileCommand | null {
	const config = vscode.workspace.getConfiguration("runner");
	const compileCommands = config.get<Record<string, CompileCommand>>("compileCommands") || {};
	return compileCommands[languageId] || null;
}

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

	const outDir = ensureOutDir(dir);
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
	const outDir = getCompileOutDir(dir);

	if (fs.existsSync(outDir)) {
		// 删除目录中的所有文件
		const files = fs.readdirSync(outDir);
		for (const file of files) {
			const filePath = path.join(outDir, file);
			fs.unlinkSync(filePath);
		}
		fs.rmdirSync(outDir);
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
