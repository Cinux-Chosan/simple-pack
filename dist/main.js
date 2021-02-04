
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
        require("./src/index.js")
      } (
        // 所有模块通过参数传入
        {
  "./src/index.js": {
    "filePath": "./src/index.js",
    "code": "\"use strict\";\n\nvar _a = _interopRequireDefault(require(\"./a.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nconsole.log(_a.default);",
    "dependencies": {
      "./a.js": "src/a.js"
    }
  },
  "src/a.js": {
    "filePath": "src/a.js",
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _b = _interopRequireDefault(require(\"./b.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nvar _default = \"A\" + _b.default;\n\nexports.default = _default;",
    "dependencies": {
      "./b.js": "src/b.js"
    }
  },
  "src/b.js": {
    "filePath": "src/b.js",
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\nvar _default = \"B\";\nexports.default = _default;",
    "dependencies": {}
  }
} 
      ))