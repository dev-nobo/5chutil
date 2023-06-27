var GOCHUTIL = GOCHUTIL || {};
(function (global) {
    let _ = GOCHUTIL;

    _.storage = {};
    _.env = {};

    // ====== 環境依存 userscript, chrome, firefox ======
    _.env.allowRemoteScript = false;
    _.env.controlShowOpenLeft = true;

    // ==================
    let b = chrome;

    _.storage.get = async (key) => {
        var val = await b.storage.local.get(this.key);
        if (val && val[key]) {
            return val[key];
        }
    }

    _.storage.set = async (key, val) => {
        await b.storage.local.set({ [key]: val });
    }

    _.storage.clear = async () => {
        await b.storage.local.clear();
    }

    _.injectJs = () => {
        let scr = document.createElement('script');
        scr.setAttribute('type', 'text/javascript');
        scr.setAttribute('src', b.runtime.getURL('js/5chutil_inject.js'));
        document.documentElement?.appendChild(scr);
    };

    _.coFetchHtml = async (url, option) => {
        let resp = await b.runtime.sendMessage({ function: "coFetchHtml", params: { url: url, option: option } });
        if (resp.reject) {
            throw new Error(resp.reject.message);
        }
        if (!resp.resolve.ok) {
            let e = new Error(`http status error. response http status code : ${resp.resolve.status}`);
            e.status = resp.resolve.status;
            throw e;
        }
        return new DOMParser().parseFromString(resp.resolve.html, "text/html");
    }
    // ==================

}(this));