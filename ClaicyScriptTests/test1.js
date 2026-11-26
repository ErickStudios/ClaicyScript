const ClaicyScript = require("./../ClaicyScriptCompiled/ClaicyScriptPacked");
let library = ClaicyScript.exportLibrary();
let tokens = ClaicyScript.tokenize(`
// Forma correcta y segura de crear clases en ClaicyScript
interface IMiclase {
    func(this: IUserObject, miParametro: string): Self;
    func hacer(this:ISelf): string;
    var miPropiedad: string;
} // Interfaz para declarar
classfunc Miclase(miParametro) extends IMiclase {
    var cls = Object();
    cls.set("_functor_", func(this, miParametro) {
        this.set("miPropiedad", miParametro);
        this.set("hacer", func(this) {
            return this.miPropiedad;
        });
        return this;
    });
    return cls(miParametro);
} // Funcion de la clase, _functor_ hace que los objetos sean ejecutables

var miInstancia = Miclase("xd");

print(miInstancia);
    `)
let parsed = ClaicyScript.parse(tokens);
(async() => {
    await ClaicyScript.run(parsed, library);
})();