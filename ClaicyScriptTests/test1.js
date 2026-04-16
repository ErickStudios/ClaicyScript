const ClaicyScript = require("./../ClaicyScriptCompiled/ClaicyScriptPacked");
let library = ClaicyScript.exportLibrary();
let tokens = ClaicyScript.tokenize(`
    var x = Object();
    func Preload(x1) {
        x1.set("count", 5);
    }
    func Main(Preload, x1) {
        Preload(x1);
        print(x1);
    } Main(Preload, x);
    `)
let parsed = ClaicyScript.parse(tokens);
(async() => {
    await ClaicyScript.run(parsed, library);
})()