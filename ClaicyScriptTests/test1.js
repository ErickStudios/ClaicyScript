const ClaicyScript = require("./../ClaicyScriptCompiled/ClaicyScriptPacked");
let library = ClaicyScript.exportLibrary();
let tokens = ClaicyScript.tokenize(`
    classfunc myIterable(len) {
        var this = Object();
        var __claicySmarty = Object();
        __claicySmarty.set("iterator", func(this,index) {
            return index;            
        });
        __claicySmarty.set("length", func(this) {
            return this.len;
        });
        this.set("len", len);
        this.set("__claicySmarty",__claicySmarty);
        return this;
    }
    var test = myIterable(5);
    for x in test {
        print(x);
    }
    print(repr(test));
    `)
let parsed = ClaicyScript.parse(tokens);
(async() => {
    await ClaicyScript.run(parsed, library);
})();