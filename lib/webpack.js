"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var babel = require("@babel/core");
var parser = require("@babel/parser");
var traverse_1 = require("@babel/traverse");
/**
 * 简版 webpack：
 * 1. 接收配置对象
 * 2. 开始任务
 * 3. 递归解析入口文件，分析依赖
 */
var Webpack = /** @class */ (function () {
    function Webpack(options) {
        this.options = options;
        this.modules = [];
    }
    Object.defineProperty(Webpack.prototype, "entry", {
        get: function () {
            return this.options.entry;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Webpack.prototype, "distFilePath", {
        get: function () {
            var output = this.options.output;
            return path.resolve(output.path, output.filename);
        },
        enumerable: false,
        configurable: true
    });
    Webpack.prototype.run = function () {
        var _a = this, entry = _a.entry, modules = _a.modules;
        var parsedModInfo = this.parse(entry);
        modules.push(parsedModInfo);
        for (var i = 0; i < modules.length; i++) {
            var mod = modules[i];
            for (var dep in mod.dependencies) {
                var depPath = mod.dependencies[dep];
                var parsedModInfo_1 = this.parse(depPath);
                modules.push(parsedModInfo_1);
            }
        }
        this.emit(modules);
    };
    Webpack.prototype.parse = function (filePath) {
        var sourceCode = fs.readFileSync(filePath, "utf-8");
        var ast = parser.parse(sourceCode, { sourceType: "module" });
        // 收集文件依赖
        var dependencies = {};
        traverse_1.default(ast, {
            ImportDeclaration: function (nodePath) {
                var value = nodePath.node.source.value;
                // 依赖的路径转换为绝对路径，使得其具有唯一性，方便递归处理直接定位到文件位置
                dependencies[value] = path.relative(process.cwd(), path.join(path.dirname(filePath), value));
            },
        });
        var code = babel.transformFromAstSync(ast, sourceCode, { presets: ["@babel/preset-env"] }).code;
        return { filePath: filePath, code: code, dependencies: dependencies };
    };
    Webpack.prototype.emit = function (modules) {
        var mods = modules.reduce(function (mods, mod) {
            var _a;
            return Object.assign(mods, (_a = {}, _a[mod.filePath] = mod, _a));
        }, {});
        var _a = this, entry = _a.entry, distFilePath = _a.distFilePath;
        var content = "\n      (function(modules) {\n        function require(modName) {\n          var mod = modules[modName];\n          // \u6784\u9020\u81EA\u5B9A\u4E49\u7684 require\u3001module\u3001exports\uFF0C\n          var module = { exports: {} }, exports = module.exports;\n          // \u6267\u884C\u6A21\u5757\u4EE3\u7801\uFF0C\u5C06\u6A21\u5757\u6570\u636E\u7ED1\u5B9A\u5230 exports \u4E2D\n          function runCode(require, exports, module) { eval(mod.code); }\n          runCode(webpackRequire, exports, module)\n          // \u5C06\u6A21\u5757\u4EE3\u7801\u66B4\u9732\u7ED9\u5916\u9762\u4F7F\u7528\n          return exports;\n\n          /** ---------------------------------------------------------------- */\n\n          function webpackRequire(modName) {\n            // \u7531\u4E8E\u6587\u4EF6\u4EE3\u7801\u4E2D\u901A\u8FC7 require \u5F15\u7528\u7684\u662F\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u4F46\u662F modules \u5BF9\u8C61\u4E2D\u662F\u6240\u6709\u6A21\u5757\u7684\u8865\u5168\u8DEF\u5F84\u4F5C\u4E3A\u952E\uFF0C\u56E0\u6B64\u9700\u8981\u5C06\u76F8\u5BF9\u8DEF\u5F84\u901A\u8FC7\u5F53\u524D\u6A21\u5757\u7684 dependencies \u8F6C\u6362\u6210\u8865\u5168\u8DEF\u5F84\n            // \u5982\u4EE3\u7801\u4E2D\u7684 require(\"./a.js\")\uFF0C\u5176\u8865\u5168\u8DEF\u5F84\u4E3A require(\"src/a.js\")\n            return require(mod.dependencies[modName]);\n          }\n        }\n        // \u4ECE\u5165\u53E3\u6587\u4EF6\u5F00\u59CB\u6267\u884C\u6574\u4E2A\u9879\u76EE\n        require(\"" + entry + "\")\n      } (\n        // \u6240\u6709\u6A21\u5757\u901A\u8FC7\u53C2\u6570\u4F20\u5165\n        " + JSON.stringify(mods, null, 2) + " \n      ))";
        fs.writeFileSync(distFilePath, content, { encoding: "utf-8" });
    };
    return Webpack;
}());
exports.default = Webpack;
