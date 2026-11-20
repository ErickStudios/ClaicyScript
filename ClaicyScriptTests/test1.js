const ClaicyScript = require("./../ClaicyScriptCompiled/ClaicyScriptPacked");
let library = ClaicyScript.exportLibrary();
let tokens = ClaicyScript.tokenize(`
// Como crear una clase adecuadamente en ClaicyScript (forma recomendada) ex: Miclase
interface IMiclase {
    func Self(this: IObject, miParametroString): Miclase;
    func hacer(this: IMiclase): any;
    var miPropiedad: string;
}

classfunc Miclase(miParametroString) extends IMiclase {
    var thisClass = Object();

    thisClass.set('Self', func(this, miParametro) { 
        this.set('miPropiedad', miParametro);
        this.set('hacer', func(this) {
            print(this.miPropiedad);
        });

        return this;
    });

    return thisClass:Self(miParametroString);
}

var miClaseInstancia = Miclase('hola chicos');
miClaseInstancia:hacer();
    `)
let parsed = ClaicyScript.parse(tokens);
(async() => {
    await ClaicyScript.run(parsed, library);
})();