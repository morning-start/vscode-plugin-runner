# Runner

![logo](images/terminal.png)

Lightweight runner extension based on powershell design. Easy to run the current file, support multiple languages. Supports custom commands.

## features

- The system automatically jumps to the directory of the current file
- Convenient custom commands
- Multiple languages are supported
- js, ts
- go, c(objective-c)

The operation of the c language is optimized, and the compiled programs are placed under the 'out' folder in the same directory for easy management

![show](images/2023-03-31-23-35-18.png)

&gt; Note that the file should be changed to the exact languageId.
&gt; It's in the lower right corner
&gt; ![languageId](images/2023-03-31-22-40-58.png)

## usage

`ctrl+alt+r` : shortcut key to run the current file,

Or `Ctrl+shift+p` select the `Runner: Run` command

Or click the run icon in the top right corner

## setting

You can set a custom command very easily

![setting](images/2023-03-31-23-40-52.png)

## Note for C

The original intention of this extension is to run C programs, because the existing C extension is somewhat complex, and the program results are displayed with a lot of commands, which is not friendly to beginners.

Although this plugin solves this problem, this plugin does not debug... So I recommend at the same time the use of [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) this plugin, use it to debug will be better.

Here, in order for C/C++ to also be used to execute files in the out folder, you need to make some changes to the `.vscode/task.json` file. As follows:

```json
{
	"tasks": [
		{
			"type": "cppbuild",
			"label": "C/C++: gcc.exe 生成活动文件",
			"command": "D:\\Language\\C\\Cygwin\\bin\\gcc.exe",
			"args": [
				"-fdiagnostics-color=always",
				"-g",
				"${file}",
				"-o",
				"${fileDirname}\\out\\${fileBasenameNoExtension}.exe"
			],
			"options": {
				"cwd": "${fileDirname}"
			},
			"problemMatcher": ["$gcc"],
			"group": {
				"kind": "build",
				"isDefault": true
			},
			"detail": "调试器生成的任务。"
		}
	],
	"version": "2.0.0"
}
```

## Thanks

Thank myself 👍