let main = async () => {
    const fs = require('fs');
    const fse = require('fs-extra');
    const archiver = require('archiver');

    let mkdir = (path) => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }
    let remove = (path) => {
        if (fs.existsSync(path)) {
            fse.removeSync(path);
        }
    }
    let copy = (src, dst) => {
        fse.copySync(src, dst);
    }
    let archive = (destPath, src, cwd) => {
        let archive = archiver.create('zip', {});
        let output = fs.createWriteStream(destPath);
        archive.pipe(output);
        archive.glob(src, { cwd: cwd });
        return archive.finalize();
    }

    // 初期化.
    remove("package");
    mkdir("package");

    const pkgName = "5chutil";
    const dirs = ["css", "html", "icon", "js"];
    const envFiles = ["env.js", "manifest.json"];

    // firefox, chrome 用addon
    let copyToPackageDir = (brwsr) => {
        mkdir(`package/${brwsr}`);
        dirs.forEach(d => copy(d, `package/${brwsr}/${d}`))
        envFiles.forEach(f => copy(`env/${brwsr}/${f}`, `package/${brwsr}/${f}`))
        return `package/${brwsr}`;
    };

    copyToPackageDir("firefox");
    copyToPackageDir("chrome");
    remove(`package/${pkgName}_firefox.zip`);
    remove(`package/${pkgName}_chrome.zip`);
    await Promise.all([
        archive(`package/${pkgName}_firefox.zip`, "**/*", "package/firefox"),
        archive(`package/${pkgName}_chrome.zip`, "chrome/**/*", "package")
    ]);

    // userscript
    mkdir("package/userscript");
    remove(`userscript/5chutil.userscript.js`);

    let format = fs.readFileSync("env/userscript/format.js", "utf-8");
    // placeholder '//$[[FILE:(filepath)]]' を ファイルの内容に差し替える.
    let userScript = format.replace(/\/\/\$\[\[FILE:(.*?)\]\]/g, (match, c1) => fs.readFileSync(c1, "utf-8"));
    fs.writeFileSync(`package/userscript/${pkgName}.userscript.js`, userScript);
    copy(`package/userscript/${pkgName}.userscript.js`, `userscript/${pkgName}.userscript.js`)

    console.log("finish");
};

main();