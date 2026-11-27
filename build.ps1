tsc
esbuild .\ClaicyRepl.js --bundle --format=cjs --platform=node --outfile=ClaicyScriptCompiled/ClaicyScriptRepl.js
esbuild ClaicyScriptCompiled/LibraryClaicyScript.js --bundle --format=esm --outfile=ClaicyScriptCompiled/ClaicyScriptPacked.js