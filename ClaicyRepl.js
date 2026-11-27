const { argv, cwd } = require("node:process");
const ClaicyLang = require("./ClaicyScriptCompiled/ClaicyScriptPacked.js");
const readline = require('node:readline/promises');
const path = require("node:path");

let args = argv.slice(2);
let dirfile = args[0] ? path.resolve(cwd(), args[0]) : null;
let cwda = dirfile ? path.dirname(dirfile) : cwd();

// Configuration for ClaicyScript REPL
var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
var env = ClaicyLang.exportLibrary();

// Warpper for code env
function warpClaicy(code) {
    return ClaicyLang.parse(ClaicyLang.tokenize(code));
}

env.import = {type:'func', async func([moduleName]) {
    if (moduleName == 'fs' || moduleName == 'clay::fs') {
        let moduleExports = {type:'obj', object: {}};
        const internal = require("node:fs");
        moduleExports.object.writeFile = {type: 'func', func([name, content]) {
            return internal.writeFileSync(name, content, 'ascii');
        }} // fs.writeFile(name: String, content: String): INone;
        moduleExports.object.readFile = {type: 'func', func([name]) {
            return internal.readFileSync(name, 'ascii');
        }} // fs.readFile(name: String): String;
        moduleExports.object.existsFile = {type: 'func', func([name]) {
            return internal.existsSync(name, 'ascii');
        }} // fs.existsFile(name: String): Boolean;
        return moduleExports;
    }
    else if (moduleName == 'meta' || moduleName == 'clay::meta') {
        let moduleExports = {type:'obj', object: {}};
        moduleExports.object.IMeta = {type: 'obj', object: {
            _functor_: {type: 'func', func([ta, name]) {
                if (name == 'import.meta') return cwda;
                if (name == 'this.meta') return dirfile ?? 'clay::tmp::repl.clay';
                return path.join(cwda, (name.endsWith('.clay') ? name : name + '.clay').replaceAll('/', path.sep));
            }}, // func(uri: string): IMeta;
            cwd: cwda, // var cwd: IMeta;
            args: { type: 'array', items: argv }
        }} // interface IMeta { ... } & type IMeta = String;
        return moduleExports;
    }
    const fs = require("node:fs");
    const modu = fs.readFileSync(path.join(cwda, (moduleName.endsWith('.clay') ? moduleName : moduleName + '.clay').replaceAll('/', path.sep)), 'ascii');
    const a = await ClaicyLang.run(warpClaicy(modu), env);
    const bc = a.Module;

    if (
        ClaicyLang.CSTypeChecker.isCSObject(bc) && 
        ClaicyLang.CSTypeChecker.isCSObject(bc.object.Exports)
    ) {
        return bc.object.Exports;
    }

    return { type: 'obj', object: {} }
}};

async function startRepl() {
    console.log('ClayNode.clay - ClaicyScript REPL')
    try {
        while (true) {
            let line = await rl.question("> ");
            if (line.trim() === ".exit") {
                break;
            }
            if (line.trim() === '')
                continue;
            if (!line.trim().endsWith(';')) { 
                let aka = line.trim();

                if (
                    !aka.startsWith('var ') &&
                    !aka.startsWith('class ') &&
                    !aka.startsWith('interface ') &&
                    !aka.startsWith('classfunc ')
                )
                    line = "var _tmpex = " + line + ";";
            }
            try {
                const ast = warpClaicy(line);
                const ex = await ClaicyLang.run(ast, env);
                const count = Object.entries(ex ?? {}).length;
                if (count === 0) {
                    console.log(env.repr.func([undefined]));
                }
                else {
                    for (const [k, v] of Object.entries(ex)) {
                        console.log((count != 1 ? `${k}:` : '') + env.repr.func([v]));
                    }
                }
                for (const [k, v] of Object.entries(ex)) {
                    if (k !== '_tmpex') env[k] = v;
                }
            }
            catch (err) {
                console.error("\x1b[38;5;203mError:\x1b[0m", err.message);
            }
        }
    }
    finally {
        rl.close();
    }
}

if (args.length >= 1) {

}
else void startRepl();
