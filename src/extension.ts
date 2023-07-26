// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from "vscode";
import { runner as run } from "./runner";
import { clear } from "./compile";
import { createTask as fixTask } from "./compile";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "runner" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let runner = vscode.commands.registerCommand("runner.run", run);
	let clearOutDir = vscode.commands.registerCommand(
		"runner.clearOutDir",
		clear
	);
	// let task = vscode.commands.registerCommand("runner.fixTask", fixTask);

	// let task = vscode.commands.registerCommand("runner.createTask", createTask);
	context.subscriptions.push(runner, clearOutDir);
}

// This method is called when your extension is deactivated
export function deactivate() {}
