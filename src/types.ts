/**
 * 编译命令配置接口
 */
export interface CompileCommand {
	compile: string;
	run: string;
}

/**
 * 文件路径信息接口
 */
export interface PathInfo {
	dir: string;
	filePath: string;
	filename: string;
}

/**
 * 项目运行配置接口
 */
export interface ProjectCommandConfig {
	[commandType: string]: string;
}

/**
 * 运行命令配置接口
 */
export interface RunCommandConfig {
	[languageId: string]: string;
}

/**
 * 编译命令配置映射接口
 */
export interface CompileCommandConfig {
	[languageId: string]: CompileCommand;
}
