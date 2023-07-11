# Runner

![logo](images/terminal.png)

轻便的 runner 插件，基于 powershell 设计。方便的运行当前文件，支持多种语言。支持自定义命令。

## features

- 会自动跳转到当前文件的目录下运行
- 方便的自定义命令
- 支持多种语言
  - js, ts
  - go, c(objective-c)

对于 c 语言的运行进行了优化，将编译后的程序都放到同目录的 `out` 文件夹下，方便管理

![show](images/2023-03-31-23-35-18.png)

> 需要注意的是，文件要改成准确的 languageId。
> 在右下角的位置
> ![languageId](images/2023-03-31-22-40-58.png)

## usage

`ctrl+alt+r`：快捷键运行当前文件，

或者 `Ctrl+shift+p` 选择 `Runner: Run` 命令

或者 点击右上角运行图标

## setting

你可以非常轻松的设置一个自定义的命令

![setting](images/2023-03-31-23-40-52.png)

## Note for C

这个插件的初衷就是为了运行 C 程序，因为现有的 C 的运行插件，多少有些复杂，而且显示的程序结果带有很多命令，对初学者并不友好。

虽然这款插件解决了这个问题，但是这款插件没有 debug。。。所以我推荐同时使用 [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) 这款插件，用它的 debug 会好一些。

这里为了使 C/C++同样使用在 out 文件夹下执行文件，需要对 `.vscode/task.json` 文件做一些修改。如下：

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

## 致谢

感谢我自己 👍
