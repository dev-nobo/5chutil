var GOCHUTIL = GOCHUTIL || {};
(function (global) {
    let _ = GOCHUTIL;

    _.storage = {};
    _.env = {};

    // ====== 環境依存 userscript, chrome, firefox ======
    _.env.allowRemoteScript = true;

    // ==================
    let b = chrome || browser;

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
        let body = document.getElementsByTagName('body')[0];
        let scr = document.createElement('script');
        scr.setAttribute('type', 'text/javascript');
        scr.setAttribute('src', b.runtime.getURL('js/5chutil_inject.js'));
        body?.appendChild(scr);
    };
    // ==================

}(this));