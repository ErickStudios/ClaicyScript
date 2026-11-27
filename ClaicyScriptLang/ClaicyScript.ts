/** ClaicyScript interpreter v1.1 */
import { CSPropertyNameType, CSObjectPropertys, ClaicyScript, CSFunctionCallback, CSObject } from "./typesDefinitions/buildings"
export { CSPropertyNameType, CSObjectPropertys, ClaicyScript, CSFunctionCallback };
/** a member node, a access to node */
type MemberNode = {
    type: "Member";
    object: any;
    property: string;
};
export class ReturnException {
    value: ClaicyScript.BaseAllValues;
    constructor(value: ClaicyScript.BaseAllValues) {
        this.value = value;
    }
}
/** the typer checker */
export namespace CSTypeChecker {
    /** returns true if is a list */
    export function isCSArray(value: ClaicyScript.BaseAllValues): value is ClaicyScript.Array {
        return typeof value === "object" && value !== null && value.type === "array";
    }
    /** returns true if is a object */
    export function isCSObject(value: ClaicyScript.BaseAllValues): value is ClaicyScript.Object {
        return typeof value === "object" &&
            value !== null &&
            "type" in value &&
            value.type === "obj" &&
            "object" in value;
    }
    /** returns true if is a interface */
    export function isCSInterface(value: ClaicyScript.BaseAllValues): value is ClaicyScript.Interface {
        return typeof value === "object" &&
            value !== null &&
            "type" in value &&
            value.type === "interface" &&
            "props" in value && typeof value.props === 'object';
    }
    /** returns true if is a function */
    export function isCSFunction(value: ClaicyScript.BaseAllValues): value is ClaicyScript.Function {
        return typeof value === "object" &&
            value !== null &&
            "type" in value &&
            value.type === "func" &&
            "func" in value;
    }
    /** returns true if is a user function */
    export function isCSUserFunction(value: ClaicyScript.BaseAllValues): value is ClaicyScript.UserFunction {
        return typeof value === "object" &&
            value !== null &&
            "type" in value &&
            value.type === "userFunc" &&
            "params" in value &&
            "body" in value;
    }
}
export function interfaceError(name: CSPropertyNameType, msg: string) {
    return `at \x1b[38;5;161minterface\x1b[0m \x1b[38;5;194m${name}\x1b[0m: ${msg}`
}
export function interfaceRep(name: CSPropertyNameType, msg:string = "") {
    return `\x1b[38;5;161minterface\x1b[0m \x1b[38;5;194m${name}\x1b[0m${msg}`;
}
export function createEnum(name: CSPropertyNameType, allowedValues: ClaicyScript.BaseAllValues[]): ClaicyScript.Function {
    return {
        type: 'func',
        func: (params) => {
            const value = params[0];

            if (!allowedValues.includes(value)) {
                throw new TypeError(
                    `at \x1b[38;5;161minterface\x1b[0m \x1b[38;5;194m${name}\x1b[0m \x1b[38;5;161mextends\x1b[0m \x1b[38;5;194mInternalDocsStrictEnum\x1b[0m: '${value}' is not valid in this \x1b[38;5;194mInternalDocsStrictEnum\x1b[0m`
                );
            }

            return value;
        }
    };
}
export function errorAtCls(name: CSPropertyNameType, msg: ClaicyScript.String, before = "") {
    return `at \x1b[38;5;161mclass\x1b[0m \x1b[38;5;194m${name}\x1b[0m: (${before}${msg})`
}
export function tokenize(code: string) {
    const tokens = [];
    let i = 0;

    const isLetter = (c: string) => /[a-zA-Z_]/.test(c);
    const isNumber = (c: string) => /[0-9]/.test(c);

    while (i < code.length) {
        let c = code[i];

        if (/\s/.test(c)) {
            i++;
            continue;
        }

        if (c === "/" && code[i + 1] === "/") {
            while (i < code.length && code[i] !== "\n") {
                i++;
            }
            continue;
        }

        if (c === '"' || c === "'") {
            let quoteType = c;
            let value = "";
            i++;
            while (i < code.length && code[i] !== quoteType) {
                value += code[i++];
            }
            i++;
            tokens.push({ type: "string", value });
            continue;
        }

        if (isLetter(c)) {
            let value = "";
            while (i < code.length && (isLetter(code[i]) || isNumber(code[i]))) {
                value += code[i++];
            }
            tokens.push({ type: "identifier", value });
            continue;
        }

        if (isNumber(c)) {
            let value = "";
            while (i < code.length && isNumber(code[i])) {
                value += code[i++];
            }
            tokens.push({ type: "number", value: Number(value) });
            continue;
        }

        tokens.push({ type: "symbol", value: c });
        i++;
    }

    return tokens;
}
export function parse(tokens: ({ type: string; value: string; } | { type: string; value: number; })[]) {
    let i = 0;

    function peek(): any {
        return tokens[i];
    }

    function consume(): any {
        return tokens[i++];
    }

    function parseReturn() {
        consume(); // return

        let value = null;

        if (peek()?.value !== ";") {
            value = parseExpression();
        }

        expect(";");

        return {
            type: "Return",
            value
        };
    }

    function expect(value: string) {
        let t = consume();
        if (!t || t.value !== value) {
            throw new Error("Expected " + value);
        }
    }
    function parseFunction(): ({
        type: string,
        name: string,
        params: any[],
        body: any[]
    }) {
        consume(); // function

        let name = consume().value;

        expect("(");

        let params = [];

        while (peek() && peek().value !== ")") {
            params.push(consume().value);
            if (peek()?.value === ",") consume();
        }

        expect(")");
        expect("{");

        let body = [];

        while (peek() && peek().value !== "}") {
            let stmt = parseStatement();
            if (stmt) body.push(stmt);
        }

        expect("}");

        return {
            type: "FunctionDecl",
            name,
            params,
            body
        };
    }
    function parseClsFunction(): ({
        type: string,
        name: string,
        params: any[],
        body: any[],
        expectatives: any[]
    }) {
        consume(); // function

        let expectatives:any[] = [];
        let name = consume().value;

        expect("(");

        let params = [];

        while (peek() && peek().value !== ")") {
            params.push(consume().value);
            if (peek()?.value === ",") consume();
        }

        expect(")");

        if (peek() && peek().value === 'extends') {
            consume();
            // its going to extend varius
            if (peek() && peek().value === "(") {
                consume();
                while (peek() && peek().value !== ")") {
                    expectatives.push(consume().value);
                    if (peek()?.value === ",") consume();
                } 
                consume();
            }
            // single interface
            else {
                expectatives.push(consume().value)
            }
        }

        expect("{");

        let body = [];

        while (peek() && peek().value !== "}") {
            let stmt = parseStatement();
            if (stmt) body.push(stmt);
        }

        expect("}");

        return {
            type: "FunctionDecl",
            name,
            params,
            body,
            expectatives
        };
    }
    function parseExpression() {
        let left = parsePrimary();

        while (peek() && ["==", ">", "<"].includes(peek().value)) {
            let op = consume().value;
            let right = parsePrimary();

            left = {
                type: "BinaryOp",
                operator: op,
                left,
                right
            };
        }

        return left;
    }
    function parseIf(): any {
        consume();

        expect("(");
        let condition = parseExpression();
        expect(")");

        expect("{");

        let body = [];

        while (peek() && peek().value !== "}") {
            body.push(parseStatement());
        }

        expect("}");

        let elseBody = null;

        if (peek()?.value === "else") {
            consume();
            expect("{");

            elseBody = [];

            while (peek() && peek().value !== "}") {
                elseBody.push(parseStatement());
            }

            expect("}");
        }

        return {
            type: "If",
            condition,
            body,
            elseBody
        };
    }
    function parsePrimary(): any {
        let token = consume();

        let node;

        if (token.type === "number") {
            node = { type: "Number", value: token.value };
        }

        if (token.type === "identifier" && token.value === "func") {
            expect("(");

            let params = [];

            while (peek() && peek().value !== ")") {
                params.push(consume().value);
                if (peek()?.value === ",") consume();
            }

            expect(")");
            expect("{");

            let body = [];

            while (peek() && peek().value !== "}") {
                let stmt = parseStatement();
                if (stmt) body.push(stmt);
            }

            expect("}");

            return {
                type: "AnonymousFunction",
                params,
                body
            };
        }

        if (token.type === "identifier") {
            node = { type: "Identifier", name: token.value };
        }

        if (token.type === "string") {
            node = { type: "String", value: token.value };
        }

        let parent;

        while (peek() && peek().value === ".") {
            consume();
            let prop = consume();

            node = {
                type: "Member",
                object: node,
                property: prop.value
            };
            parent = node.object;
        }

        let acessTo = null;
        if (peek() && peek().value === ':') {
            consume();
            acessTo = consume().value;

            if (!parent) parent = node;
            
            node = {
                type: "Member",
                object: node,
                property: acessTo
            };
        }

        // call
        if (peek()?.value === "(") {
            consume();

            let args = [];

            while (peek() && peek().value !== ")") {
                args.push(parseExpression());
                if (peek()?.value === ",") consume();
            }

            expect(")");

            return {
                type: acessTo !== null ? "CallMethod" : "Call",
                parent,
                acessTo,
                callee: node,
                args
            };
        }

        return node;
    }

    function parseVar() {
        consume(); // var

        let name = consume().value;

        expect("=");

        let value = parseExpression();

        expect(";");

        return {
            type: "VarDecl",
            name,
            value
        };
    }

    function parseClass() {
        consume();
        let name = consume().value;

        expect("{");

        let body = [];

        while (peek() && peek().value !== "}") {
            body.push(parseStatement());
        }

        expect("}");

        return {
            type: "Class",
            name,
            body
        };
    }

    function parseFor() {
        consume();
        let variable = consume().value;

        expect("in");

        let inWhat = parseExpression();

        expect("{")

        let body = [];

        while (peek() && peek().value !== "}") {
            body.push(parseStatement());
        }

        expect("}");

        return {
            type: "For",
            variable,
            inWhat,
            body
        };
    }

    function parseInterface() {
        consume(); // interface
        let name = consume().value;
        let expectatives: ClaicyScript.String[] = [] as ClaicyScript.String[];

        if (peek() && peek().value === 'extends') {
            consume();
            // its going to extend varius
            if (peek() && peek().value === "(") {
                consume();
                while (peek() && peek().value !== ")") {
                    expectatives.push(consume().value);
                    if (peek()?.value === ",") consume();
                }
                consume();
            }
            // single interface
            else {
                expectatives.push(consume().value)
            }
        }

        expect("{");

        let props: Record<string, string> = {};

        while (peek() && peek().value !== "}") {
            let propName;
            let typeName;
            if (peek().value === 'var') {
                expect("var");
                propName = consume().value;
                expect(":");
                typeName = consume().value;
                if (typeof typeName === 'string') typeName = (typeName == 'String' || typeName == 'Number' || typeName == 'Boolean') ? typeName.toLowerCase() : typeName
                expect(";");
            }
            else if (peek().value === 'func') {
                expect('func');
                let paramTypes = [];
                if (peek().value == '(') propName = '_functor_';
                else propName = consume().value;
                expect('(');
                while (peek() && peek().value !== ')') {
                    if (peek().type == 'identifier') {
                        var namea = consume().value;
                        if (peek().value == ':') {
                            expect(':');
                            paramTypes.push(namea + ':' + "\x1b[38;5;194m" + consume().value + "\x1b[0m");
                        } else paramTypes.push(namea + ':' + 'any');
                        if (peek().value !== ')') 
                            expect(',');
                    }
                }
                consume();
                var typeret = 'any'
                if (peek().value == ':') {
                    expect(':');
                    typeret = consume().value;
                }
                expect(';');
                typeName = 'IFunctor' + `(${paramTypes.join(',')}): ${typeret}`;
            }

            props[propName] = typeName;
        }

        expect("}");

        return {
            type: "Interface",
            name,
            props,
            expectatives
        };
    }

    function parseStatement(): any {
        let t = peek();

        if (t.value === "interface") return parseInterface();
        if (t.value === "var") return parseVar();
        if (t.value === "return") return parseReturn();
        if (t.value === "func") return parseFunction();
        if (t.value === "classfunc") return parseClsFunction();
        if (t.value === "for") return parseFor();
        if (t.value === "if") return parseIf();
        if (t.type === "identifier") {
            let expr = parseExpression();
            expect(";");

            return {
                type: "ExprStmt",
                expr
            };
        }

        consume();
    }

    let ast = [];

    while (i < tokens.length) {
        let t = peek();

        if (t.value === "class") {
            ast.push(parseClass());
        } else {
            ast.push(parseStatement());
        }
    }

    return ast;
}
export async function run(ast: any, globalSymbolsP: any, makeOne: true): Promise<({ evalExpr: Function, recursiveInterprete: Function , callFunc: (callee: ClaicyScript.BaseAllValues, argsa: ClaicyScript.CallbackParams, scop: CSObjectPropertys) => Promise<ClaicyScript.BaseAllValues>})>;
export async function run(ast: any[], globalSymbolsP: CSObjectPropertys, makeOne?: false): Promise<CSObjectPropertys>;
export async function run(ast: any[], globalSymbolsP: CSObjectPropertys, makeOne: boolean = false): Promise<CSObjectPropertys | ({ evalExpr: Function, recursiveInterprete: Function , callFunc: (callee: ClaicyScript.BaseAllValues, argsa: ClaicyScript.CallbackParams, scop: CSObjectPropertys) => Promise<ClaicyScript.BaseAllValues>})> {
    let scopea = {};
    let globalSymbols = globalSymbolsP;

    async function callFunc(callee: ClaicyScript.BaseAllValues, argsa: ClaicyScript.CallbackParams, currentScope: CSObjectPropertys) {

        let args = [];

        for (let arg of argsa) {
            args.push(arg);
        }

        if (!(typeof callee === 'object' && 'type' in callee)) throw new Error("no callable function");
        
        let localScope: Record<string, ClaicyScript.BaseAllValues> = {};

        // asignar local scope
        for (let [k, v] of Object.entries(currentScope)) {
            localScope[k] = v;
        }

        if (callee.type === 'userFunc') {
            if (!('params' in callee && Array.isArray(callee.params))) throw new Error("no callable function");

            // asignar parámetros
            for (let i = 0; i < callee.params.length; i++) {
                localScope[callee.params[i]] = args[i];
            }

            localScope.arguments = { type: 'obj', object: {
                __claicySmarty: {type:'obj', object: {
                    iterator: {type:'func', func: (params) => args[Number(params[1])]},
                    length: {type:'func', func: (params) => args.length},
                }},
                '_functor_': {type: 'func', func: (params) => args[Number(params[0])]}
            }}

            // ejecutar cuerpo
            let vale;
            try { vale = await recursiveInterprete(callee.body, localScope); }
            catch (ex) {
                if (ex instanceof ReturnException) {
                    let result = ex.value;

                    if ('expectatives' in callee && Array.isArray(callee.expectatives) && callee.expectatives.length > 0) {
                        if (CSTypeChecker.isCSObject(result)) {
                            result.classesHeredated = [];
                            result.interfaces = [];
                        }

                        for (let ifaceName of callee.expectatives) {
                            let iface = globalSymbols[ifaceName] || localScope[ifaceName];

                            if (CSTypeChecker.isCSObject(result)) {
                                if (CSTypeChecker.isCSInterface(iface)) {
                                    result.interfaces?.push(iface);
                                }
                            }

                            if (typeof iface !== 'object') throw new Error("The interface is not a object");

                            if (!iface || iface.type !== "interface") {
                                throw new Error(`Interface ${ifaceName} not found`);
                            }

                            if (!CSTypeChecker.isCSObject(result)) {
                                throw new TypeError(`Return is not an object for interface ${ifaceName}`);
                            }

                            if (!('props' in iface)) throw new TypeError("not props in interface");

                            for (let prop in iface.props) {
                                if (!(prop in result.object)) {
                                    throw new TypeError(
                                        interfaceError(ifaceName, `'${prop}' is not in the class that implements the interface`)
                                    );
                                }

                                let expectedType = iface.props[prop];
                                let value = result.object[prop];

                                if (expectedType === "number" && typeof value !== "number") {
                                    throw new TypeError(`Property '${prop}' must be number`);
                                }

                                if (expectedType === "string" && typeof value !== "string") {
                                    throw new TypeError(`Property '${prop}' must be string`);
                                }
                            }
                        }
                    }

                    return result;
                }
                if (ex instanceof TypeError || ex instanceof RangeError) {
                    ex.message = `at \x1b[38;5;161mfunc\x1b[0m ${await evalExpr(callee, currentScope, true)}: (${ex.message})`;
                }
                throw ex;
            }
            return 'null';
        }

        if ('func' in callee && typeof callee.func == 'function') {
            let vale;
            vale = await callee.func(args, localScope);
            return vale;
        }

        console.error("No es función:", callee);

        return 'null' as ClaicyScript.String;
    }

    async function evalExpr(node: any, currentScope: any = scopea, mak = false): Promise<ClaicyScript.BaseAllValues> {
        if (node.type === "AnonymousFunction") {
            return {
                type: "userFunc",
                params: node.params,
                body: node.body
            };
        }
        
        if (node.type === "BinaryOp") {
            let left: any = await evalExpr(node.left, currentScope);
            let right: any = await evalExpr(node.right, currentScope);

            switch (node.operator) {
                case "==": return left == right;
                case ">": return left > right;
                case "<": return left < right;
            }
        }

        if (node.type === "Number") return node.value;

        if (node.type === "Identifier") {
            if (mak) return node.name;
            return globalSymbols[node.name] || currentScope[node.name];
        }

        if (node.type === "Member") {
            if (mak) return node.property;
            const prop = node.property as string;
            const obj = await evalExpr(node.object, currentScope);

            if (!CSTypeChecker.isCSObject(obj)) {
                throw new Error("Not an object");
            }
            if (typeof obj !== 'object') throw new Error("evalExpr can have a value as a not object on member");
            if (!('object' in obj && typeof obj.object == 'object' && obj.object !== null)) throw new Error("evalExpr can have a value as a not object on member");
            if (!(typeof node.property === 'string' || typeof node.property === 'number')) {
                throw new Error("invalid property");
            }
            if (obj.type === "obj" && obj.object !== null) {
                return obj.object[node.property as string];
            }
            return obj.object[node.property as string];
        }

        if (node.type === "String") return node.value;

        if (node.type === "Call" || node.type == 'CallMethod') {
            let callee = await evalExpr(node.callee, currentScope);
            let callme = [
                ...(node.type === 'CallMethod' ? [await evalExpr(node.parent, currentScope)] : [])
            ]

            if (CSTypeChecker.isCSObject(callee)) {
                if ('_functor_' in callee.object && (CSTypeChecker.isCSUserFunction(callee.object._functor_) || CSTypeChecker.isCSFunction(callee.object._functor_))) {
                    let evaluatedArgs = await Promise.all(
                        node.args.map((v:any) => evalExpr(v, currentScope))
                    );
                    evaluatedArgs = [...callme, callee, ...evaluatedArgs];

                    return await callFunc(callee.object._functor_, evaluatedArgs, currentScope)
                }
            }

            let evaluatedArgs = await Promise.all(
                node.args.map((v:any) => evalExpr(v, currentScope))
            );
            evaluatedArgs = [...callme, ...evaluatedArgs];

            return await callFunc(callee, evaluatedArgs, currentScope)
        }

        return Boolean();
    }

    async function recursiveInterprete(body: any, scope: CSObjectPropertys = scopea, globalSymbolsX = globalSymbols) {
        globalSymbols = globalSymbolsX;

        for (let stmt of body) {
            if (stmt.type === "ExprStmt") await evalExpr(stmt.expr, scope);
            if (stmt.type === "Return") {
                let value = stmt.value
                    ? await evalExpr(stmt.value, scope)
                    : 0;

                throw new ReturnException(value);
            }
            if (stmt.type === 'For') {
                let inWhat = await evalExpr(stmt.inWhat, scope);
                let forVariable = stmt.variable;
                let forBody = stmt.body;

                if (
                    CSTypeChecker.isCSObject(inWhat) &&
                    '__claicySmarty' in inWhat.object&& 
                    CSTypeChecker.isCSObject(inWhat.object.__claicySmarty)
                ) {
                    // object binding
                    let claicySmarty: ClaicyScript.Object = inWhat.object.__claicySmarty;
                    if (
                        (CSTypeChecker.isCSUserFunction(claicySmarty.object.iterator) ||
                         CSTypeChecker.isCSFunction(claicySmarty.object.iterator)) &&
                        (CSTypeChecker.isCSUserFunction(claicySmarty.object.length) ||
                         CSTypeChecker.isCSFunction(claicySmarty.object.length))
                    ) {
                        // iterator necesary functions
                        let iteratorFn: ClaicyScript.UserFunction | ClaicyScript.Function = claicySmarty.object.iterator;
                        let lengthFn: ClaicyScript.UserFunction | ClaicyScript.Function = claicySmarty.object.length;

                        // index of the thing
                        let index: ClaicyScript.Number = 0;
                        while (index < (await callFunc(lengthFn, [inWhat], scope) as ClaicyScript.Number)) {
                            // the thing
                            let thingToAssign: ClaicyScript.BaseAllValues = await callFunc(iteratorFn, [inWhat, index], scope);
                            scope[forVariable as ClaicyScript.String] = thingToAssign as ClaicyScript.BaseAllValues;

                            await recursiveInterprete(forBody, scope, globalSymbolsX);
                            index++;
                        }
                    }
                }
            }
            if (stmt.type === "Interface") {
                let inter: ClaicyScript.Interface = {
                    type: "interface",
                    props: stmt.props,
                    name: stmt.name
                };
                for (let element of stmt.expectatives) {
                    if (CSTypeChecker.isCSInterface(globalSymbols[element])) 
                        Object.assign(inter.props, globalSymbols[element].props);
                }
                Object.assign(inter.props, stmt.props);
                globalSymbols[stmt.name] = inter;
            }
            if (stmt.type === "If") {
                let cond = await evalExpr(stmt.condition, scope);

                if (cond) {
                    await recursiveInterprete(stmt.body, scope);
                } else if (stmt.elseBody) {
                    await recursiveInterprete(stmt.elseBody, scope);
                }
            }

            if (stmt.type === "FunctionDecl") {
                scope[stmt.name] = {
                    type: "userFunc",
                    params: stmt.params,
                    body: stmt.body,
                    expectatives: stmt.expectatives || []
                };
            }

            if (stmt.type === "Class") {
                let classObj = {};
                scope[stmt.name] = {
                    type: "obj",
                    object: classObj
                };
                try { await recursiveInterprete(stmt.body, classObj); }
                catch (ex) {
                    if (ex instanceof TypeError || ex instanceof RangeError || ex instanceof Error) {
                        ex.message = errorAtCls(stmt.name, ex.message);
                    }
                    throw ex;
                }
                globalSymbols[stmt.name] = scope[stmt.name];
            }

            if (stmt.type === "VarDecl") {
                scope[stmt.name] = await evalExpr(stmt.value, scope);
            }
        }
    }

    if (makeOne) {
        return { evalExpr, recursiveInterprete, callFunc };
    }

    try { await recursiveInterprete(ast); }
    catch (ex) {
        if (ex instanceof TypeError || ex instanceof Error) {
            console.log('Error', ex.message)
        }
    }

    return scopea;
}
export function exportLibrary(isGlobal = false) {
    /**
```
var true: (extern 'js').boolean;
var false: (extern 'js').boolean;
var any;
var IInternal: (extern 'js').abstract;
var IJsList: (extern 'js').Array;
var IClaicyAst: unexplicable | unknown;
interface IStringMod {
    func _repr(this: ISelfLike): String;
    func _add(this: ISelfLike, other: ISelfLike): ISelfLike;
    func _div(this: ISelfLike, other: ISelfLike): ISelfLike;
    func replaceFirst(search: ISelfLike | String, replacer: ISelfLike | String): String;
    func replaceAll(search: ISelfLike | String, replacer: ISelfLike | String): String;
    func search(query: ISelfLike | String): Number;
    func subChain(start: Number, end: Number): String;
    func split(divider: ISelfLike | String): String;
}
classfunc String(v, modeable: Boolean | INone): String | IStringMod;
classfunc Number();
interface IArray {
    var items: IJsList;
}
classfunc Array() extends IArray;
interface IUserFunction extends IInternal {
    params: IJsList;
    body: IClaicyAst;
    expectatives: Array<IInterface>;
}
interface IFunctor extends IInternal {
    func(params: IJsList, scope: any): any;
}
var IFunction = IUserFunction | IFunctor;
interface InternalDocsStrictEnum {
    allowedValues: any;
    name: String;
    func(value: any): IFunction;
}
var Boolean: InternalDocsStrictEnum = InternalDocsStrictEnum(
    true, 
    false
);
interface IOperable {
    func _add(this: ISelfLike, other: ISelfLike): ISelfLike;
    func _sub(this: ISelfLike, other: ISelfLike): ISelfLike;
    func _mul(this: ISelfLike, other: ISelfLike): ISelfLike;
    func _div(this: ISelfLike, other: ISelfLike): ISelfLike;
}
var Numberic = Number | IOperable;
class Math {
    func add(a:Numberic, b:Numberic): Numberic;
    func sub(a:Numberic, b:Numberic): Numberic;
    func div(a:Numberic, b:Numberic): Numberic;
    func mul(a:Numberic, b:Numberic): Numberic;
    func boolAnd(a: IBooleable, b: IBooleable): Boolean;
    func boolNot(a: IBooleable, b: IBooleable): Boolean;
    func boolOr(a: IBooleable, b: IBooleable): Boolean;
}
interface ITypeToolsAndChecker {
    func valid(x: IDontKnowSelf): instanceof(x, ISelf);
}
interface IUserObject {
    func set($phantomArg:This,K:String,V:any): void;
    func get($phantomArg:This,K:String): any;
    func has($phantomArg:This,K:String): K in This;
}
func instanceof(x: any, y: IInterface): instanceof(x, y);
var IString: ITypeToolsAndChecker;
var INumber: ITypeToolsAndChecker;
var IBoolean: ITypeToolsAndChecker;
classfunc Object(): IUserObject;
func repr(x: any): String;
func print(...);
func exportToGlobal(name: String, value: any);
func notDefined(name: String): Boolean;
func undef(name: String);
```
     */
    /** @type {CSObjectPropertys} */
    let globalSymbols: CSObjectPropertys = {};
    globalSymbols.true = true;
    globalSymbols.false = false;
    globalSymbols.IString = {type: 'obj', object: {
       valid: {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
            return typeof params[0] === 'string';
       }} 
    }};
    globalSymbols.INumber = {type: 'obj', object: {
       valid: {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
            return typeof params[0] === 'number';
       }} 
    }};
    globalSymbols.IBoolean = {type: 'obj', object: {
       valid: {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
            return typeof params[0] === 'boolean';
       }} 
    }};
    /** represents a array a list for store things or others lists */
    globalSymbols.Array = {type: 'func', func: (params: ClaicyScript.CallbackParams) => ({
        type: 'array',
        items: params
    } as ClaicyScript.Array)};
    /** represents a documentation strict enum */
    globalSymbols.InternalDocsStrictEnum = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        if (typeof params[0] !== 'string')
            throw new TypeError(errorAtCls("InternalDocsStrictEnum", "error on create the enum"));
        let enumName = params[0];
        if (!CSTypeChecker.isCSArray(params[1]))
            throw new TypeError(errorAtCls("InternalDocsStrictEnum", "error on create the enum"));
        let allowedValues = params[1].items;

        return createEnum(enumName, allowedValues) as ClaicyScript.Function;
    }};
    /** gets the representation of a thing */
    globalSymbols.reprBare = {type: 'func', func: async (params: ClaicyScript.CallbackParams, scope: CSObjectPropertys = {}) => {
        let ignoreReprMethods = params[0] ?? false;
        let solveToString: (thing: any, re?: boolean, tabs?: number) => Promise<string> = async (thing: any, re=false, tabs=0) => {
            let tabulated = "   ".repeat(tabs);
            if (typeof thing === "undefined" || thing == null) {
                return '\x1b[38;5;194mINone\x1b[0m';
            }
            if (Array.isArray(thing)) {
                return "[" + (await Promise.all(
                    thing.map(v => solveToString(v, true, tabs))
                )).join(",") + "]";
            }
            if (CSTypeChecker.isCSArray(thing)) {
                return await solveToString(thing.items);
            }
            if (CSTypeChecker.isCSInterface(thing)) {
                let header = interfaceRep(thing.name || '') + ' {';
                let props = thing.props;
                let reprProps = Object.entries(props as Record<string, string>).map(([k, v]) => {
                    if (v.startsWith('IFunctor(')) 
                        return `\x1b[38;5;161mfunc\x1b[0m \x1b[36m${k}\x1b[0m${v.substring(8)};`
                    return `\x1b[38;5;161mvar\x1b[0m ${k}: \x1b[38;5;194m${v}\x1b[0m;`;
                })
                return header + '\n' + (reprProps.map(v => tabulated + '   ' + v).join('\n')) + '\x1b[0m\n' + tabulated + '}';
            }
            if (CSTypeChecker.isCSFunction(thing)) {
                return "\x1b[38;5;161mfunc\x1b[0m(...)"
            }
            if (CSTypeChecker.isCSUserFunction(thing)) {
                return "\x1b[38;5;161mfunc\x1b[0m(...)"
            }
            if (CSTypeChecker.isCSObject(thing)) {
                if ('_repr' in thing.object && (
                    CSTypeChecker.isCSUserFunction(thing.object._repr) ||
                    CSTypeChecker.isCSFunction(thing.object._repr) && !ignoreReprMethods
                )) {
                    let functorRepr = thing.object._repr;
                    let fnRun = (await run([], {}, true)).callFunc;

                    return (await fnRun(functorRepr, [thing], scope)) as string;
                }
                let inta = thing.interfaces ?? [];
                let mv = inta.map(v => {
                    return interfaceRep(v.name ?? 'anonymus');
                });
                let nat = (
                    mv.length == 0 ? '' :
                    mv.length == 1 ? mv[0] + ' ' :
                    ('(' + mv.join(', ') + ')') + ' '
                )

                let description = `\x1b[38;5;194mObject\x1b[0m ${nat}{\n`;
                for (const K in thing.object) {
                    description += tabulated + '   ' + (K !== '_functor_' ? K + ': ' : '') + await solveToString(thing.object[K], true, tabs+1) + ";\n";
                }
                description += tabulated + "}";
                return description;
            }
            return ((typeof thing === 'string' && re) ? "\x1b[32m'" : '') + String(thing) + ((typeof thing === 'string' && re) ? "'\x1b[0m" : '');
        }; 
        const result = await solveToString(params[1]);

        return typeof window !== 'undefined'
            ? String(result).replace(/\x1b\[[0-?]*[ -/]*m/g, '')
            : result;
    }}
    globalSymbols.repr = { type: 'func', func: async (params: ClaicyScript.CallbackParams, scope) => {
        return (globalSymbols.reprBare as ClaicyScript.Function).func([false, params[0]]);
    } }
    /** prints one or varius values */
    globalSymbols.print = {type: 'func', func: async (params: ClaicyScript.CallbackParams) => {
        console.log(...(await params.map(async v => await (globalSymbols.repr as ClaicyScript.Function).func([v]))));
        return 0 as ClaicyScript.Number;
    }};
    const casterForUserFast = async (search: string, params: ClaicyScript.CallbackParams, scope?: CSObjectPropertys) =>{
        const [a, b] = params;

        if (CSTypeChecker.isCSObject(a)) {
            let fun = a.object[search] ?? Boolean(false);
            let fnRun = (await run([], {}, true)).callFunc;

            if ((CSTypeChecker.isCSFunction(fun) || CSTypeChecker.isCSUserFunction(fun)) && typeof scope === 'object') {
                return await fnRun(fun, params, scope);
            }
        }

        return null;
    }

    /** class for Math operations */
    globalSymbols.Math = {type: "obj", object: {
        add: {type: 'func', func: async (params: ClaicyScript.CallbackParams, scope) => {
            const [a, b] = params;

            const ab = await casterForUserFast('_add', params, scope);;
            if (ab !== null)
                return ab;

            // the two are numbers
            if (typeof a === 'number' && typeof b === 'number') return a + b as ClaicyScript.Number;
            // the two are strings
            if (typeof a === 'string' && typeof b === 'string') return a + b as ClaicyScript.String;

            throw new TypeError("Math.add expects number or string");
        }},
        sub: {type: 'func', func: async (params: ClaicyScript.CallbackParams, scope) => {
            const [a, b] = params;

            const ab = await casterForUserFast('_sub', params, scope);;
            if (ab !== null)
                return ab;

            // the two are number
            if (typeof a === 'number' && typeof b === 'number') return a - b as ClaicyScript.Number;

            throw new TypeError("Math.sub expects number");
        }},
        div: {type: 'func', func: async (params: ClaicyScript.CallbackParams, scope) => {
            const [a, b] = params;

            const ab = await casterForUserFast('_div', params, scope);;
            if (ab !== null)
                return ab;

            // the two are numbers
            if (typeof a === 'number' && typeof b === 'number') return a / b as ClaicyScript.Number;

            throw new TypeError("Math.div expects number");
        }},
        mul: {type: 'func', func: async (params: ClaicyScript.CallbackParams, scope) => {
            const [a, b] = params;

            const ab = await casterForUserFast('_mul', params, scope);;
            if (ab !== null)
                return ab;

            // the two are number
            if (typeof a === 'number' && typeof b === 'number') return a * b as ClaicyScript.Number;

            throw new TypeError("Math.mul expects number");
        }},
        boolAnd: {type: 'func', func: (params: ClaicyScript.CallbackParams, scope) => {
            return params[0] && params[1];
        }},
        boolOr: {type: 'func', func: (params: ClaicyScript.CallbackParams, scope) => {
            return params[0] || params[1];
        }},
        greater: {type: 'func', func: (params: ClaicyScript.CallbackParams, scope) => {
            return params[0] > params[1];
        }},
        less: {type: 'func', func: (params: ClaicyScript.CallbackParams, scope) => {
            return params[0] < params[1];
        }},
        boolNot: {type: 'func', func: (params: ClaicyScript.CallbackParams, scope) => {
            return !params[0];
        }},
    }};
    /** represents a boolean, a value that can be only true or false (deprecated) */
    globalSymbols.Boolean = createEnum('Boolean', [true, false]);
    /** represents a boolean, a value that can be only true or false */
    globalSymbols.boolean = globalSymbols.Boolean; // new method for create booleans
    /** represents a string, a value that contains text (deprecated) */
    globalSymbols.String = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        if (params.length >= 2) {
            if (params[1] == true) {
                let str = params[0];
                let prep: CSObject = {type: 'obj', object: {
                    _repr: { type: 'func', func: () => str },
                    replaceFirst: {type: 'func', func: ([a, b]: ClaicyScript.CallbackParams) => String(str).replace(a as string, b as string)},
                    replaceAll: {type: 'func', func: ([a, b]: ClaicyScript.CallbackParams) => String(str).replaceAll(a as string, b as string)},
                    search: {type: 'func', func: ([a]: ClaicyScript.CallbackParams) => String(str).search(a as string)},
                    subChain: {type: 'func', func: ([start, end]: ClaicyScript.CallbackParams) => String(str).slice(Number(start), Number(end))},
                    split: {type: 'func', func: ([withW]: ClaicyScript.CallbackParams) => ({ type: 'array', items: String(str).split(String(withW)) })},
                    _add: {type: 'func', func: ([these, s]) => str + String(s)}
                }};
                prep.object._div = prep.object.split;
                return prep;
            }
        }
        return String(params[0]) as ClaicyScript.String;
    }}
    /** represents a string, a value that contains text */
    globalSymbols.string = globalSymbols.String; // new method for create strings
    /** represents a number, a value that can be counted, example 1, 2, 3, ... (deprecated) */
    globalSymbols.Number = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        return Number(params[0]) as ClaicyScript.Number;
    }}
    /** represents a number, a value that can be counted, example 1, 2, 3 */
    globalSymbols.number = globalSymbols.Number; // new method for create numbers
    /** represents a object, the base of all the non binary values, a container that can be contain the things that you want */
    globalSymbols.Object = {
        type: 'func', func: (params: ClaicyScript.CallbackParams) => {
            let object: ClaicyScript.Object = { type: 'obj', object: {} };
            // package
            object.object.set = {
                type: 'func', func: (params: ClaicyScript.CallbackParams) => {
                    // packageSet
                    if (typeof params[0] !== 'string') throw new Error("Not allowed");
                    object.object[params[0]] = params[1];
                    return true as ClaicyScript.Bool;
                }
            };
            // package
            object.object.get = {
                type: 'func', func: (params: ClaicyScript.CallbackParams) => {
                    // packageGet
                    if (typeof params[0] !== 'string') throw new Error("Not allowed");
                    return object.object[params[0]] as ClaicyScript.BaseAllValues;
                }
            };
            // package
            object.object.has = {
                type: 'func', func: (params: ClaicyScript.CallbackParams) => {
                    // packageGet
                    if (typeof params[0] !== 'string') throw new Error("Not allowed");
                    return params[0] in object.object as ClaicyScript.Bool;
                }
            };
            return object as ClaicyScript.Object;
        }
    }
    /** exports a value to the global variables */
    globalSymbols.exportToGlobal = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        let exportAs = params[0];
        let exportValue = params[1];
        if (typeof exportAs !== 'string')
            throw new SyntaxError(errorAtCls("InternalNamespace", "trying to get a invalid var name"))
        globalSymbols[exportAs] = exportValue;
        return 0 as ClaicyScript.Number;
    }}
    /** if a thing are not defined */
    globalSymbols.notDefined = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        if (typeof params[0] !== 'string')
            throw new SyntaxError(errorAtCls("InternalNamespace", "trying to get a invalid var name"))

        let exportAs = params[0];
        return !(exportAs in globalSymbols);
    }}
    /** undefine a thing */
    globalSymbols.undef = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        if (typeof params[0] !== 'string')
            throw new SyntaxError(errorAtCls("InternalNamespace", "trying to get a invalid var name"))
        delete globalSymbols[params[0]];
        return 0 as ClaicyScript.Number;
    }}
    /** get a variable */
    globalSymbols.getVar = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        let exportAs = params[0];
        if (typeof exportAs !== 'string')
            throw new SyntaxError(errorAtCls("InternalNamespace", "trying to get a invalid var name"))
        return globalSymbols[exportAs];
    }}
    globalSymbols.getGlobal = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        return {
            type: 'obj',
            object: globalSymbols
        }
    }}
    /** check if a thing is a instance of a thing */
    globalSymbols.instanceof = {type: 'func', func: (params: ClaicyScript.CallbackParams) => {
        let [target, source] = params;

        if (!CSTypeChecker.isCSObject(target)) return false;

        // interfaces
        if (Array.isArray(target.interfaces)) {
            for (let iface of target.interfaces) {
                for (let prop in iface.props) {
                    if (!(prop in target.object)) {
                        return false;
                    }

                    let expectedType = iface.props[prop];
                    let value = target.object[prop];

                    if (expectedType === "number" && typeof value !== "number") {
                        return false
                    }

                    if (expectedType === "string" && typeof value !== "string") {
                        return false;
                    }
                }
                if (CSTypeChecker.isCSInterface(iface) && CSTypeChecker.isCSInterface(source) && (iface.name === source.name)) return true;
            }
        }

        return false;
    }};

    return globalSymbols;
}
//