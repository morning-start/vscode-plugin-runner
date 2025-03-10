import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getCurrentPath } from "./runner";

export function compileCommend(
	command: string,
	dir: string,
	filename: string
): string {
	// 创建out文件夹
	let outDir = "out";
	if (!fs.existsSync(path.join(dir, "out"))) {
		fs.mkdirSync(path.join(dir, "out"));
	}
	// 补充command -o file ; ./file
	command = `${command} -o ${outDir}/${filename}.exe \n .\\${outDir}\\${filename}`;

	return command;
}
export function clear() {
	let file = vscode.window.activeTextEditor?.document;
	let { dir, filePath, filename } = getCurrentPath()!;
	let out = path.join(dir, "out");
	if (fs.existsSync(out)) {
		fs.readdirSync(out).forEach((file) => {
			fs.unlinkSync(`${out}\\${file}`);
		});
		fs.rmdirSync(out);
		vscode.window.showInformationMessage("✅已经清除out文件夹中的文件!");
	} else {
		vscode.window.showErrorMessage("out文件夹不存在!");
	}
}

/**
 * Gets the path of the .vscode folder in the current working directory.
 * Returns null if the .vscode folder does not exist.
 */
function getVscodeFolderPath(): string | undefined {
	const workspaceFolderPath = vscode.workspace.workspaceFolders?.[0]?.uri
		?.fsPath as string;
	
	const vscodeFolderPath = path.join(workspaceFolderPath, ".vscode");

	if (
		fs.existsSync(vscodeFolderPath) &&
		fs.statSync(vscodeFolderPath).isDirectory()
	) {
		return vscodeFolderPath;
	} else {
		return undefined;
	}
}

/**
 * Reads the content of the task.json file in the specified directory.
 * Returns the content as a string, or null if the file does not exist.
 */
function readTaskJsonContent(directory: string): string | undefined {
	const taskJsonPath = path.join(directory, "task.json");

	if (fs.existsSync(taskJsonPath) && fs.statSync(taskJsonPath).isFile()) {
		const content = fs.readFileSync(taskJsonPath, "utf8");
		return content;
	} else {
		return undefined;
	}
}

export function createTask() {
	// 获取工作目录下.vscode文件
	const vscodeFolderPath = getVscodeFolderPath();
	let task = readTaskJsonContent(vscodeFolderPath as string);
	if (typeof task === "undefined") {
		vscode.window.showErrorMessage(".vscode/task.json文件不存在!");
		return;
	}
	console.log(task);
}
