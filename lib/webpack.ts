import * as fs from "fs";
import * as path from "path";
import * as babel from "@babel/core";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

interface BasicConfig {
  entry: string;
  output: {
    filename: string;
    path: string;
  };
}

type ModInfo = ReturnType<Webpack["parse"]>;

/**
 * 简版 webpack：
 * 1. 接收配置对象
 * 2. 开始任务
 * 3. 递归解析入口文件，分析依赖
 */

export default class Webpack {
  modules: ModInfo[] = [];

  constructor(private options: BasicConfig) {}

  get entry(): string {
    return this.options.entry;
  }

  get distFilePath(): string {
    const { output } = this.options;
    return path.resolve(output.path, output.filename);
  }

  run() {
    const { entry, modules } = this;
    const parsedModInfo = this.parse(entry);
    modules.push(parsedModInfo);

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      for (const dep in mod.dependencies) {
        const depPath = mod.dependencies[dep];
        const parsedModInfo = this.parse(depPath);
        modules.push(parsedModInfo);
      }
    }
    this.emit(modules);
  }

  parse(filePath: string) {
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    const ast = parser.parse(sourceCode, { sourceType: "module" });
    // 收集文件依赖
    const dependencies = {};
    traverse(ast, {
      ImportDeclaration(nodePath) {
        const { value } = nodePath.node.source;
        // 依赖的路径转换为绝对路径，使得其具有唯一性，方便递归处理直接定位到文件位置
        dependencies[value] = path.relative(process.cwd(), path.join(path.dirname(filePath), value));
      },
    });
    const { code } = babel.transformFromAstSync(ast, sourceCode, { presets: ["@babel/preset-env"] });
    return { filePath, code, dependencies };
  }

  emit(modules: ModInfo[]) {
    const mods = modules.reduce((mods, mod) => Object.assign(mods, { [mod.filePath]: mod }), {});
    const { entry, distFilePath } = this;
    const content = `
      (function(modules) {
        function require(modName) {
          var mod = modules[modName];
          // 构造自定义的 require、module、exports，
          var module = { exports: {} }, exports = module.exports;
          // 执行模块代码，将模块数据绑定到 exports 中
          function runCode(require, exports, module) { eval(mod.code); }
          runCode(webpackRequire, exports, module)
          // 将模块代码暴露给外面使用
          return exports;

          /** ---------------------------------------------------------------- */

          function webpackRequire(modName) {
            // 由于文件代码中通过 require 引用的是相对路径，但是 modules 对象中是所有模块的补全路径作为键，因此需要将相对路径通过当前模块的 dependencies 转换成补全路径
            // 如代码中的 require("./a.js")，其补全路径为 require("src/a.js")
            return require(mod.dependencies[modName]);
          }
        }
        // 从入口文件开始执行整个项目
        require("${entry}")
      } (
        // 所有模块通过参数传入
        ${JSON.stringify(mods, null, 2)} 
      ))`;

    fs.writeFileSync(distFilePath, content, { encoding: "utf-8" });
  }
}
