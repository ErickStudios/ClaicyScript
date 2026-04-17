const ClaicyScript = require("./../ClaicyScriptCompiled/ClaicyScriptPacked");
let library = ClaicyScript.exportLibrary();
let tokens = ClaicyScript.tokenize(`
    interface Animal {
        var name: string;
        var sound: string;
        var speak: any;
    }
    classfunc Dog() extends Animal {
        var this = Object();

        this.set("name", "Firulais");
        this.set("sound", "Guau");
        this.set("speak", func() {
            print("woof");
        });
        
        return this;
    }
    classfunc Cat() extends Animal {
        var this = Object();

        this.set("name", "Michi");
        this.set("sound", "Miau");
        this.set("speak", func() {
            print("meow");
        });
        
        return this;
    }
    
    func main(Dog, Cat) {
        var dog = Dog();
        var cat = Cat();

        dog.speak();
        cat.speak();
    } main(Dog, Cat);
    `)
let parsed = ClaicyScript.parse(tokens);
(async() => {
    await ClaicyScript.run(parsed, library);
})()