var GOCHUTIL = GOCHUTIL || {};
(function (global) {
    let _ = GOCHUTIL;

    _.storage = {};
    _.env = {};

    // ====== 環境依存 userscript, chrome, firefox ======
    _.env.allowRemoveScript = true;

    // ==================
    _.storage.get = async (key) => {
        var val = await browser.storage.local.get(this.key);
        if (val && val[key]) {
            return val[key];
        }
    }

    _.storage.set = async (key, val) => {
        await browser.storage.local.set({ [key]: val });
    }
    // ==================

}(this));