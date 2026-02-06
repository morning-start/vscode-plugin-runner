# File Runner

![logo](images/terminal.png)

一款轻量级的 VS Code 文件运行插件，基于命令行功能。支持快速运行单文件代码，内置多种编程语言支持，同时允许用户自定义运行命令。

## 功能特性

- **一键运行**：通过快捷键 `Ctrl+Alt+R`（Mac: `Cmd+Alt+R`）或点击编辑器右上角的运行按钮，快速运行当前文件
- **多语言支持**：内置支持 JavaScript、TypeScript、Python、Go、C、C++、Rust、Kotlin 等多种编程语言
- **编译型语言支持**：自动处理编译流程，先编译后运行，编译输出保存在 `out` 目录
- **自定义命令**：支持用户自定义运行命令和编译命令
- **智能识别**：根据文件语言 ID 自动选择对应的运行方式

## 支持的语言

### 解释型语言（直接运行）

| 语言          | 默认命令                   |
| ------------- | -------------------------- |
| JavaScript    | `node <file>`            |
| TypeScript    | `ts-node <file>`         |
| Python        | `python <file>`          |
| Go            | `go run <file>`          |
| Kotlin Script | `kotlinc -script <file>` |

### 编译型语言（编译后运行）

| 语言   | 编译命令                                                  | 运行命令                         |
| ------ | --------------------------------------------------------- | -------------------------------- |
| C      | `gcc <file> -o <outDir>/<out>`                          | `<outDir>/<out>`               |
| C++    | `g++ <file> -o <outDir>/<out>`                          | `<outDir>/<out>`               |
| Rust   | `rustc <file> -o <outDir>/<out>`                        | `<outDir>/<out>`               |
| Kotlin | `kotlinc <file> -include-runtime -d <outDir>/<out>.jar` | `java -jar <outDir>/<out>.jar` |

> **注意**：Objective-C 文件（`.m`）会被识别为 C 语言进行处理。

## 使用方法

### 快速开始

1. 打开需要运行的代码文件
2. 按下 `Ctrl+Alt+R`（Mac: `Cmd+Alt+R`）或点击编辑器右上角的 ▶️ 运行按钮
3. 查看终端输出结果

### 清除输出目录

运行命令 **Clear Out Dir** 可以清除当前文件所在目录的 `out` 文件夹，方便整理编译输出文件。

## 配置说明

### 直接运行命令配置 (`runner.runCommands`)

适用于解释型语言，配置格式为 `languageId: command`。

使用 `<file>` 作为文件路径占位符。

```json
{
  "runner.runCommands": {
    "javascript": "node <file>",
    "typescript": "ts-node <file>",
    "python": "python <file>",
    "go": "go run <file>",
    "kotlinscript": "kotlinc -script <file>"
  }
}
```

![直接运行命令配置](images/直接运行命令配置.png)

### 编译运行命令配置 (`runner.compileCommands`)

适用于编译型语言，支持以下占位符：

- `<file>`: 源文件路径
- `<out>`: 输出文件名（不含扩展名）
- `<outDir>`: 输出目录

```json
{
  "runner.compileCommands": {
    "c": {
      "compile": "gcc <file> -o <outDir>/<out>",
      "run": "<outDir>/<out>"
    },
    "cpp": {
      "compile": "g++ <file> -o <outDir>/<out>",
      "run": "<outDir>/<out>"
    },
    "rust": {
      "compile": "rustc <file> -o <outDir>/<out>",
      "run": "<outDir>/<out>"
    },
    "kotlin": {
      "compile": "kotlinc <file> -include-runtime -d <outDir>/<out>.jar",
      "run": "java -jar <outDir>/<out>.jar"
    }
  }
}
```

### 编译输出目录 (`runner.compileOutDir`)

设置编译输出的目录名称（相对路径），默认为 `out`。

```json
{
  "runner.compileOutDir": "out"
}
```

### C 语言项目结构示例

![C语言编译的项目结构示例](images/C语言编译的项目结构示例.png)

### Kotlin 编译后的项目结构示例

![kotlin编译后的项目结构示例](images/kotlin编译后的项目结构示例.png)

## 如何获取 Language ID

![LanguageId指南](images/LanguageId指南.png)

在 VS Code 中，点击右下角的文件类型标识，即可查看当前文件的 Language ID。

## 快捷键

| 快捷键                         | 命令     | 说明         |
| ------------------------------ | -------- | ------------ |
| `Ctrl+Alt+R` / `Cmd+Alt+R` | Run Code | 运行当前文件 |

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 许可证

[MIT](LICENSE)
