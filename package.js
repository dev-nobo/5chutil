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

    // firefox, chrome 用addon
    let copyToPackageDir = (brwsr) => {
        mkdir(`package/${brwsr}`);
        copy("css", `package/${brwsr}/css`);
        copy("html", `package/${brwsr}/html`);
        copy("icon", `package/${brwsr}/icon`);
        copy("js", `package/${brwsr}/js`);
        copy(`env/${brwsr}/env.js`, `package/${brwsr}/env.js`);
        copy(`env/${brwsr}/manifest.json`, `package/${brwsr}/manifest.json`);
        return `package/${brwsr}`;
    };

    copyToPackageDir("firefox");
    copyToPackageDir("chrome");
    remove("package/5chutil_firefox.zip");
    remove("package/5chutil_chrome.zip");
    await Promise.all([
        archive("package/5chutil_firefox.zip", "**/*", "package/firefox"),
        archive("package/5chutil_chrome.zip", "chrome/**/*", "package")
    ]);

    // userscript
    mkdir("package/userscript");
    remove("userscript/5chutil.userscript.js");

    let format = fs.readFileSync("env/userscript/format.js", "utf-8");
    // placeholder '//$[[FILE:(filepath)]]' を ファイルの内容に差し替える.
    let userScript = format.replace(/\/\/\$\[\[FILE:(.*?)\]\]/g, (match, c1) => fs.readFileSync(c1, "utf-8"));
    fs.writeFileSync("package/userscript/5chutil.userscript.js", userScript);
    copy("package/userscript/5chutil.userscript.js", "userscript/5chutil.userscript.js")

    console.log("finish");
};

main();