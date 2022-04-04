var GOCHUTIL = GOCHUTIL || {};
(function (global) {
    let _ = GOCHUTIL;

    _.storage = {};
    _.env = {};

    // ====== 環境依存 userscript, chrome, firefox ======
    _.env.allowCof = false;

    // ==================
    _.storage.get = async (key) => {
        var val = await chrome.storage.local.get(this.key);
        if (val && val[key]) {
            return val[key];
        }
    }

    _.storage.set = async (key, val) => {
        await chrome.storage.local.set({ [key]: val });
    }
    // ==================

}(this));