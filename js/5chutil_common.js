var GOCHUTIL = GOCHUTIL || {};
(function (global) {
    let _ = GOCHUTIL;

    _.classes = {};

    _.classes.setting = function (key, initValue) {
        this.key = key;
        this.initValue = initValue;
        this.setting = initValue;
    };

    _.classes.setting.prototype.load = async function () {
        await new Promise(async r => {
            try {
                let val = await _.storage.get(this.key);
                if (val) {
                    this.setting = val;
                }
                r();
            } catch (e) {
                console.error(e);
            }
        });
    };

    _.classes.setting.prototype.save = async function () {
        await new Promise(async r => {
            try {
                await _.storage.set(this.key, this.setting);
                r();
            } catch (e) {
                console.error(e);
            }
        });
    };

    _.classes.setting.prototype.set = async function (val) {
        this.setting = val;
        await this.save();
    };

    _.classes.setting.prototype.get = function () {
        return this.setting
    };

    _.classes.setting.prototype.reset = async function () {
        this.setting = this.initValue;
        await this.save();
    };

    // ==================

    _.classes.arraySetting = function (key, initValue, maxSize = 100) {
        _.classes.setting.call(this, key, initValue);
        this._maxSize = maxSize;
        this.checkSet = new Set(initValue.map(e => this.toSetElement(e)));
    };

    _.classes.arraySetting.prototype = Object.create(_.classes.setting.prototype);

    _.classes.arraySetting.prototype.toSetElement = function (e) {
        return e;
    };

    _.classes.arraySetting.prototype.compare = function (e, v) {
        return e == v;
    };

    _.classes.arraySetting.prototype.load = async function () {
        await _.classes.setting.prototype.load.call(this);
        this.checkSet = new Set(this.setting.map(e => this.toSetElement(e)));
    };

    _.classes.arraySetting.prototype.add = async function (val) {
        var ret = [];
        if (!val) {
            return ret;
        }
        this.checkSet.add(this.toSetElement(val));
        this.setting.push(val);
        if (this.setting.length > this._maxSize) {
            ret = Array(this.setting.length - this._maxSize).fill().map(e => this.setting.shift());
            ret.forEach(r => this.checkSet.delete(this.toSetElement(r)));
        }
        await this.save();
        return ret;
    };

    _.classes.arraySetting.prototype.remove = async function (val) {
        if (!val) {
            return;
        }
        this.checkSet.delete(this.toSetElement(val));
        this.setting = this.setting.filter(v => !this.compare(v, val));
        await this.save();
    };

    _.classes.arraySetting.prototype.list = function () {
        return this.setting;
    }

    _.classes.arraySetting.prototype.contains = function (val) {
        if (!val) {
            return false;
        }
        return this.checkSet.has(this.toSetElement(val));
    };

    _.classes.arraySetting.prototype.maxSize = function () {
        return this._maxSize;
    };

    _.classes.arraySetting.prototype.replaceString = function (str, replacer) {
        return this.setting.reduce((p, c) => p.replaceAll(c, replacer(c)), str);
    };

    // ==================

    _.classes.dateAndIDSetting = function (key, initValue, maxSize = 100) {
        _.classes.arraySetting.call(this, key, initValue, maxSize);
    };

    _.classes.dateAndIDSetting.prototype = Object.create(_.classes.arraySetting.prototype);

    _.classes.dateAndIDSetting.prototype.toSetElement = function (dateAndID) {
        return dateAndID.date + ":" + dateAndID.id;
    };

    _.classes.dateAndIDSetting.prototype.compare = function (e, v) {
        return e.id == v.id && e.date == v.date;
    };

    _.classes.dateAndIDSetting.prototype.create = function (date, id) {
        if (date && date.length > 0 && id && id.length > 0) {
            return { date: date, id: id };
        } else {
            return undefined;
        }
    };

    // ==================

    _.classes.wordSetting = function (key, initValue, maxSize = 100) {
        _.classes.arraySetting.call(this, key, initValue, maxSize);
    };

    _.classes.wordSetting.prototype = Object.create(_.classes.arraySetting.prototype);

    _.classes.wordSetting.prototype.match = function (msg) {
        return this.setting.some(w => msg.indexOf(w) >= 0);
    };

    // div.ad--bottom, div.ad--right > *, div#banner, div[id^="horizontalbanners"], div#AD_e4940a622def4b87c34cd9b928866823_1, div#ads-ADU-DYQA7DD0, div.footer.push + div, iframe[src$="://cache.send.microad.jp/js/cookie_loader.html"]
    let defaultDeleteSelectors = ``;

    let defaultCustomCss = `div.list_popup { line-height: 15px; }
div.list_popup span { font-size: 13px; }
div.list_popup span.control_link { font-size: 12px; }
div.list_popup div.meta { white-space: nowrap; }
div.list_popup div.post { margin-bottom: 4px; padding:4px; }
div.list_popup div.post div.message { padding: 2px 0 1px; }`;

    // ==================

    let defaultAppSetting = {
        stop: false,
        hideNgMsg: false,
        dontPopupMouseoverNgMsg: false,
        autoscrollWhenNewPostLoad: false,
        autoEmbedContents: false,
        blurImagePopup: false,
        idManyCount: 5,
        koro2ManyCount: 5,
        ipManyCount: 5,
        refPostManyCount: 3,
        newPostMarkDisplaySeconds: 30,
        autoloadIntervalSeconds: 60,
        allowUnforcusAutoloadCount: 10,
        waitSecondsForAppendNewPost: 10,
        customCss: defaultCustomCss,
        deleteSelectors: defaultDeleteSelectors
    };
    let appSetting = Object.assign({}, defaultAppSetting);

    _.settings = {
        ng: {
            names: new _.classes.arraySetting("settings.ng.names", []),
            trips: new _.classes.arraySetting("settings.ng.trips", []),
            slips: new _.classes.arraySetting("settings.ng.slips", []),
            koro2s: new _.classes.arraySetting("settings.ng.korokoros", []),
            ips: new _.classes.arraySetting("settings.ng.ips", []),
            dateAndIDs: new _.classes.dateAndIDSetting("settings.ng.dateAndID", []),
            words: new _.classes.wordSetting("settings.ng.words", [], 30),

            init: async function () {
                await Promise.all(Object.values(this).filter(v => typeof (v) !== 'function' && v["load"] && typeof (v["load"]) === 'function').map(v => v.load()));
            },

            reset: async function () {
                await Promise.all(Object.values(this).filter(v => typeof (v) !== 'function' && v["reset"] && typeof (v["reset"]) === 'function').map(v => v.reset()));
            }
        },

        app: new _.classes.setting("settings.app", defaultAppSetting),

        init: async function () {
            await Promise.all([this.ng.init(), this.app.load()]);
            this.app.set(Object.assign(appSetting, this.app.get()));
        },

        reset: async function () {
            await Promise.all([this.ng.reset(), this.app.reset()]);
        }
    };

    _.init = async function () {
        await _.settings.init();
    };

    let timers = {};
    _.timeStart = (name) => {
        timers[name] = timers[name] || {};
        timers[name].start = performance.now();
    };
    _.timeStop = (name) => {
        timers[name].elapsed = timers[name]?.elapsed || 0;
        timers[name].elapsed += performance.now() - timers[name].start;
        timers[name].start = undefined;
    };
    _.timeLog = () => {
        Object.entries(timers).forEach(([k, v]) => {
            console.log(`time ${k} : ${v.elapsed} ms`);
        });
    };
}(this));
