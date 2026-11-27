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

function makerInterfacesFunctorsDescriptors(params, typa) {
    return 'IFunctor(' + (params.map(([name, typea]) => name + ':' + "\x1b[38;5;194m" + typea + "\x1b[0m").join(', ')) + '): ' + typa;
}

function validerStrictly(object) {
    if (object.interfaces) {
        for (const i of object.interfaces) {
            if (!env.instanceof.func([object, i]))
                throw new Error('the creator of that dont remember some method');
        }
    }

    return object;
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
    if (moduleName == 'flatlist' || moduleName == 'clay::flatlist') {
        let moduleExports = {type:'obj', object: {}};
        moduleExports.object.IArrayBuffer = {type: 'interface', name: 'IArrayBuffer',  props: {
            ITEM_SIZE: 'number',
            length: 'number',
            slice: makerInterfacesFunctorsDescriptors([
                ['start', 'Number | IIndexLike'],
                ['end', 'Number | IIndexLike'],
            ], 'number'),
            at: makerInterfacesFunctorsDescriptors([
                ['position', 'Number | IIndexLike']
            ], 'number')
        }}; // interface IArrayBuffer
        moduleExports.object.IBufferLike = {type: 'interface', name: 'IBufferLike', props: {
            ...moduleExports.object.IArrayBuffer.props,
            set: makerInterfacesFunctorsDescriptors([
                ['position', 'Number | IIndexLike'],
                ['value', 'Number & ISelfSizeof']
            ], 'number'),
        }}; // interface IBufferLike extends IArrayBuffer
        moduleExports.object.IValidBufferSizeof = ClaicyLang.createEnum('IValidBufferSizeof', [
            1,2,4,8
        ]); // interface IValidBufferSizeof extends InternalDocsStrictEnum {}
        moduleExports.object.ArrayBuffer = {type: 'func',func: ([lena, bytesSizea]) => {
                let arrayDefault;
                let bytesSize = bytesSizea;

                if (ClaicyLang.CSTypeChecker.isCSArray(lena)) {
                    arrayDefault = lena.items;
                }
                else if (env.instanceof.func([lena, moduleExports.object.IArrayBuffer])) {
                    arrayDefault = lena.object.__array__;
                    bytesSize = lena.object.ITEM_SIZE;
                }

                let len = arrayDefault?.length ?? lena;

                let obj = {
                    type: 'obj',
                    object: {}
                };

                const bytesSize_valid = moduleExports.object.IValidBufferSizeof.func([bytesSize]);

                const cls = {
                    1: Uint8Array,
                    2: Uint16Array,
                    4: Uint32Array,
                    8: BigUint64Array
                };

                if (!Number.isSafeInteger(len) || len < 0) {
                    throw new TypeError('Invalid buffer length');
                }

                const TypedArray = cls[bytesSize_valid];
                const inta_array = arrayDefault !== undefined
                                ? new TypedArray(arrayDefault)
                                : new TypedArray(len);

                obj.object.__array__ = inta_array;
                obj.object.__ctr__ = moduleExports.object.ArrayBuffer;
                obj.object.ITEM_SIZE = bytesSize_valid;
                obj.object.length = len;
                obj.object.slice = {type: 'func', func([start, end]) {
                    let cat = obj.object.__ctr__.func([obj]);
                    cat.object.__array__ = cat.object.__array__.slice(start, end)
                    return cat;
                }}
                obj.object.at = {type: 'func', func([index]) {
                    return obj.object.__array__.at(index)
                }}

                obj.interfaces = [
                    moduleExports.object.IArrayBuffer
                ]

                return validerStrictly(obj);
            }
        }; // classfunc ArrayBufferLike
        moduleExports.object.BufferLike = {type: 'func', func: ([a, bytesSize]) => {
            let cat = moduleExports.object.ArrayBuffer.func([a, bytesSize]);
            cat.object.__ctr__ = moduleExports.object.BufferLike;
            cat.interfaces.push(moduleExports.object.IBufferLike);

            cat.object.set = { type: 'func', func: ([index, item]) => {
                cat.object.__array__[index] = item;
                return true;
            } }

            return validerStrictly(cat);
        }}

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
                    console.log(await env.repr.func([undefined]));
                }
                else {
                    for (const [k, v] of Object.entries(ex)) {
                        console.log((count != 1 ? `${k}:` : '') + await env.repr.func([v]));
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
