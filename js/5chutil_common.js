var GOCHUTIL = GOCHUTIL || {};
(function (global) {
    const _ = GOCHUTIL;
    _.classes = {};

    _.classes.setting = function (key, initValue = {}) {
        this.key = key;
        this.initValue = initValue;
        this.setting = initValue;
    };

    // =================
    // Date extension;
    let yyToYYYY = yy => {
        if (!yy) return;
        let y100 = Math.floor(new Date().getFullYear() / 100) * 100;
        return ((new Date().getFullYear() % 100) < parseInt(yy)) ? y100 : y100 - 100;
    };

    Object.defineProperty(Date.prototype, "format", {
        value: function (format) {
            format = format.replace(/yyyy/g, this.getFullYear());
            format = format.replace(/yy/g, this.getFullYear() % 100);
            format = format.replace(/MM/g, ('0' + (this.getMonth() + 1)).slice(-2));
            format = format.replace(/dd/g, ('0' + this.getDate()).slice(-2));
            format = format.replace(/HH/g, ('0' + this.getHours()).slice(-2));
            format = format.replace(/mm/g, ('0' + this.getMinutes()).slice(-2));
            format = format.replace(/ss/g, ('0' + this.getSeconds()).slice(-2));
            format = format.replace(/SSS/g, ('00' + this.getMilliseconds()).slice(-3));
            return format;
        }
    });
    Object.defineProperty(Date, "parseString", {
        value: function (str, format) {
            if (!str) {
                return;
            }
            format = format.replace(/yyyy/g, "(?<y4>[12][0-9]{3})");
            format = format.replace(/yy/g, "(?<y2>[0-9]{2})");
            format = format.replace(/MM/g, "(?<MM>[01][0-9])");
            format = format.replace(/dd/g, "(?<dd>[0-3][0-9])");
            format = format.replace(/HH/g, "(?<HH>[0-2][0-9])");
            format = format.replace(/mm/g, "(?<mm>[0-6][0-9])");
            format = format.replace(/ss/g, "(?<ss>[0-6][0-9])");
            format = format.replace(/SSS/g, "(?<SSS>[0-9]{1,3})");
            let m = str.match(new RegExp(format));
            if (m) {
                let now = new Date();
                return new Date(
                    parseInt(m.groups["y4"] ?? yyToYYYY(parseInt(m.groups["y2"])) ?? now.getFullYear()),
                    parseInt((m.groups["MM"]) ?? now.getMonth() + 1) - 1,
                    parseInt(m.groups["dd"] ?? now.getDate()),
                    parseInt(m.groups["HH"] ?? 0),
                    parseInt(m.groups["mm"] ?? 0),
                    parseInt(m.groups["ss"] ?? 0),
                    parseInt(m.groups["SSS"] ?? 0)
                );
            }
        }
    });

    // list extension;
    const first = function () { return this?.[0]; };
    const last = function () { return this?.[this?.length - 1]; };
    Object.defineProperty(NodeList.prototype, "first", { value: first });
    Object.defineProperty(NodeList.prototype, "last", { value: last });
    Object.defineProperty(Array.prototype, "first", { value: first });
    Object.defineProperty(Array.prototype, "last", { value: last });

    // Generator extension;
    const genProto = Object.getPrototypeOf(Object.getPrototypeOf((function* () { })()));
    Object.defineProperty(genProto, "filter", { value: function* (predicate) { for (let v of this) if (predicate(v)) yield v; } });
    Object.defineProperty(genProto, "map", { value: function* (f) { for (let v of this) yield f(v) } });
    Object.defineProperty(genProto, "flatten", { value: function* () { for (let v of this) for (let v2 of v) yield v2 } });
    Object.defineProperty(genProto, "flatMap", { value: function (f) { return this.map(f).flatten(); } });
    Object.defineProperty(genProto, "first", { value: function () { for (let v of this) return v; } });
    Object.defineProperty(genProto, "find", { value: function (predicate) { return this.filter(predicate).first(); } });
    Object.defineProperty(genProto, "toArray", { value: function () { return Array.from(this) } });
    Object.defineProperty(genProto, "take", { value: function* (count) { for (let v of this) { if (--count < 0) break; yield v; } } });

    // Element extension;
    Object.defineProperty(Element.prototype, "prevElemAll", { value: function* () { let elm = this; while (elm = elm.previousElementSibling) yield elm; } });
    // =================

    _.classes.setting.prototype.load = async function () {
        try {
            let val = await _.storage.get(this.key);
            if (val) {
                this.setting = val;
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    _.classes.setting.prototype.save = async function () {
        try {
            await _.storage.set(this.key, this.setting);
            // なんでか this.setting の値が一瞬書き戻るので、読み直す.
            await this.load();
        } catch (e) {
            console.error(e);
            throw e;
        }
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

    _.classes.arraySetting = function (key, initValue = [], maxSize = 100) {
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

    _.classes.arraySetting.prototype.save = async function () {
        await _.classes.setting.prototype.save.call(this);
        this.checkSet = new Set(this.setting.map(e => this.toSetElement(e)));
    };

    _.classes.arraySetting.prototype.add = async function (val) {
        var ret = [];
        if (!val) {
            return ret;
        }
        this.setting.push(val);
        if (this._maxSize > 0 && this.setting.length > this._maxSize) {
            ret = Array(this.setting.length - this._maxSize).fill().map(e => this.setting.shift());
        }
        await this.save();
        return ret;
    };

    _.classes.arraySetting.prototype.remove = async function (val) {
        if (!val) {
            return;
        }
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

    let toArray = (f) => {
        try { return [f()]; } catch (e) { return []; }
    }

    _.classes.regexSetting = function (key, initValue, maxSize = 100) {
        _.classes.arraySetting.call(this, key, initValue, maxSize);
        this.regexArray = this.setting.flatMap(e => toArray(() => new RegExp(e)));
    };

    _.classes.regexSetting.prototype = Object.create(_.classes.arraySetting.prototype);

    _.classes.regexSetting.prototype.load = async function () {
        await _.classes.arraySetting.prototype.load.call(this);
        this.regexArray = this.setting.flatMap(e => toArray(() => new RegExp(e)));
    };

    _.classes.regexSetting.prototype.save = async function () {
        await _.classes.arraySetting.prototype.save.call(this);
        this.regexArray = this.setting.flatMap(e => toArray(() => new RegExp(e)));
    };

    _.classes.regexSetting.prototype.match = function (val) {
        if (!val) {
            return false;
        }
        return this.regexArray.some(r => r.test(val));
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

    let defaultCustomCss = ``;

    // ==================

    let defaultAppSetting = {
        stop: false,
        hideNgMsg: false,
        dontPopupMouseoverNgMsg: false,
        autoscrollWhenNewPostLoad: false,
        autoEmbedContents: false,
        blurImagePopup: false,
        expandRefPosts: true,
        popupOnClick: false,
        closeOtherPopupOnClick: false,
        pinnablePopup: true,
        fixOnPinned: true,
        showOpenLeft: true,
        persistLeftPaneStat: true,
        floatFeature: false,
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
            slips: new _.classes.regexSetting("settings.ng.slips", []),
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

        ui: new _.classes.setting("settings.ui", {}),

        pageTransitionParam: new _.classes.setting("settings.pageTransitionParam", {}),

        init: async function () {
            await Promise.all([this.ng.init(), this.app.load(), this.ui.load(), this.pageTransitionParam.load()]);
            this.app.set(Object.assign(appSetting, this.app.get()));
        },

        reset: async function () {
            await Promise.all([this.ng.reset(), this.app.reset(), this.ui.reset(), this.pageTransitionParam.reset()]);
        }
    };

    _.util = {
        similarity: {
            ngramize: function (str, n) {
                // n-gram.
                return new Set(Array.from(str.matchAll(/[A-Z]+[a-z]*|[A-Z]*[a-z]+|'[A-Z]*[a-z]*|[0-9]+|[^A-Za-z0-9'"!\?\-:;,\.\s\n]+/g))
                    .flatMap(m => m[0].charCodeAt(0) <= 0xFE ? [m[0]] : Array.from({ length: m[0].length - n + 1 }, (_, i) => i).map(i => m[0].substring(i, i + n))));
            },

            cosineSimilarity: function (vec1, vec2) {
                let dot = (vec1, vec2) => vec1.map((v, i) => vec1[i] * vec2[i]).reduce((p, c) => p + c, 0.0);
                let abs = vec => Math.sqrt(vec.reduce((p, c) => p + (c * c), 0.0));
                return dot(vec1, vec2) / (abs(vec1) * abs(vec2));
            },

            // bi-gram でベクタ化してからコサイン類似度を産出.
            compare: function (left, right) {
                let lGram = this.ngramize(left, 2);
                let rGram = this.ngramize(right, 2);
                let marged = Array.from(new Set(Array.from(lGram).concat(Array.from(rGram))));
                let vec = gram => marged.map(g => gram.has(g) ? 1 : 0);
                return this.cosineSimilarity(vec(lGram), vec(rGram));
            }
        },

        _cacheUrl: {},
        parseUrl: function (url) {
            const origUrl = url;
            if (this._cacheUrl[origUrl] !== undefined) {
                return this._cacheUrl[origUrl] ?? undefined;
            }
            if (!url.match(/^https?:\/\/([^./]+?\.5ch\.net)/)) {
                this._cacheUrl[origUrl] = null;
                return;
            }
            if (url.indexOf("?") > -1) {
                url = url.slice(0, url.indexOf("?"));
            }
            let mThreadUrl = url.match(/^(?<protocol>https?):\/\/(?<subDomain>[^./]+?)\.(?<domain>[^./]+\.[^./]+?)\/test\/read.cgi\/(?<boardId>[^/]+)\/(?<threadId>[0-9]{10})(\/(?<resLink>(l(?<last>[0-9]{1,3})|(?<from>[0-9]{0,3})-(?<to>[0-9]{0,3})|(?<num>[0-9]{1,3}))(?<without1>[nN]?))|.*)/);
            let mTopUrl = url.match(/^(?<protocol>https?):\/\/(?<subDomain>[^./]+?)\.(?<domain>[^./]+\.[^./]+?)\/(?<boardId>[^/]+?)\/(\?.*|)$/);
            let mSubbackUrl = url.match(/^(?<protocol>https?):\/\/(?<subDomain>[^./]+?)\.(?<domain>[^./]+\.[^./]+?)\/(?<boardId>[^/]+?)\/subback.html$/);
            let pat = [{ m: mThreadUrl, type: "thread", toUrl: "toThread" }, { m: mTopUrl, type: "top", toUrl: "toTop" }, { m: mSubbackUrl, type: "subback", toUrl: "toSubback" }].find(e => e.m);
            if (!pat) {
                this._cacheUrl[origUrl] = null;
                return;
            }
            let ret = ["protocol", "subDomain", "boardId", "threadId", "domain", "resLink", "last", "from", "to", "num", "without1"].reduce((p, c) => (p[c] = pat.m.groups[c], p), {});
            ret.type = pat.type;
            ret.toUrl = pat.toUrl;
            ret.without1 = ret.without1 ? true : false;
            ret.origin = new URL(url).origin;
            ret.toSubback = function () { return `${this.toTop()}subback.html`; };
            ret.toTop = function () { return `${this.protocol}://${this.subDomain}.${this.domain}/${this.boardId}/`; };
            ret.toThread = function (threadId) { return `${this.protocol}://${this.subDomain}.${this.domain}/test/read.cgi/${this.boardId}/${threadId ?? this.threadId}/`; };
            ret.toResUrl = function (threadId, resLink) { return this.toThread(threadId) + (resLink ?? this.resLink ?? "1"); };
            ret.normalize = function () {
                return this[this.toUrl]();
            };
            this._cacheUrl[origUrl] = ret;
            return ret;
        },

        normalizeUrl: function (url) {
            return this.parseUrl(url)?.normalize();
        },

        parseDoc: function (doc, normalizedUrl) {
            let resCount = parseInt(doc.querySelectorAll("div.post")?.last()?.querySelector("div.meta span.number")?.textContent);
            let firstDate = Date.parseString(doc.querySelectorAll("div.post")?.first()?.querySelector("span.date")?.textContent, "yyyy/MM/dd\\(.\\) HH:mm:ss");
            let lastDate = Date.parseString(doc.querySelectorAll(resCount >= 1000 ? "#\\31 000" : "div.post")?.last()?.querySelector("span.date")?.textContent, "yyyy/MM/dd\\(.\\) HH:mm:ss");
            let now = new Date();
            return {
                url: normalizedUrl,
                title: doc.querySelector("h1.title")?.textContent?.replaceAll("\n", ""),
                resCount: resCount,
                firstCommentDate: firstDate?.getTime(),
                lastCommentDate: lastDate?.getTime(),
                registerDate: now.getTime(),
                lastUpdateDate: now.getTime()
            }
        }
    }

    _.history = {
        settings: new _.classes.setting("history", { histories: [], lastUpdate: 0 }, 0),

        init: async function () {
            await this.load();
        },

        load: async function () {
            await this.settings.load();
            this.keyMap = this.settings.get().histories.reduce((p, c) => (p[c.key] = c, p), {});
        },

        newKey: function () {
            let newKey = new Date().getTime();
            while (this.keyMap[newKey]) {
                newKey++;
            }
            return newKey;
        },

        reload: async function () {
            let lastUpdate = this.settings.get().lastUpdate;
            await this.load();
            if (lastUpdate < this.settings.get().lastUpdate) {
                setTimeout(() => this.onUpdated(), 0);
            }
        },

        onUpdated: function () {
        },

        add: async function (url, doc) {
            await this.load();
            let normalizedUrl = _.util.normalizeUrl(url);
            if (!normalizedUrl) {
                throw new Error("invalied url");
            }
            let history = _.util.parseDoc(doc, normalizedUrl);
            history.key = this.newKey();
            let setting = this.settings.get();
            setting.histories.push(history);
            setting.histories = setting.histories.slice(-1000);
            setting.lastUpdate = new Date().getTime();
            await this.settings.set(setting);
            await this.reload();
            setTimeout(() => this.onUpdated(), 0);
            return history;
        },

        delete: async function (key) {
            await this.load();
            let setting = this.settings.get();
            setting.histories = setting.histories.filter(h => h.key != key);
            setting.lastUpdate = new Date().getTime();
            await this.settings.set(setting)
            await this.load();
            setTimeout(() => this.onUpdated(), 0);
        },

        deleteAll: async function () {
            await this.load();
            let setting = this.settings.get();
            setting.histories = [];
            setting.lastUpdate = new Date().getTime();
            await this.settings.set(setting)
            await this.load();
            setTimeout(() => this.onUpdated(), 0);
        },

        reverseList: function (count, key) {
            let setting = this.settings.get();
            let list = setting.histories.slice().reverse();
            key = key ? parseInt(key) : Number.POSITIVE_INFINITY;
            return list.filter(h => parseInt(h.key) < key).slice(0, count);
        }
    }

    _.bookmark = {
        settings: new _.classes.setting("bookmark", { bookmarks: [], lastUpdate: 0 }, 0),

        init: async function () {
            await this.load();
            let bm = this.find(location.href);
            if (bm) {
                let current = _.util.parseDoc(document, _.util.normalizeUrl(location.href));
                if (current.resCount > bm.resCount) {
                    let setting = this.settings.get();
                    Object.assign(this.urlMap[bm.url], bm);
                    setting.lastUpdate = new Date().getTime();
                    await this.settings.set(setting);
                }
            }
            let handle = setInterval(() => this.reload().catch(e => { clearInterval(handle); console.log("polling off"); }), 10000);
        },

        load: async function () {
            await this.settings.load();
            this.urlMap = this.settings.get().bookmarks.reduce((p, c) => (p[c.url] = c, p), {});
        },

        reload: async function () {
            let lastUpdate = this.settings.get().lastUpdate;
            await this.load();
            if (lastUpdate < this.settings.get().lastUpdate) {
                setTimeout(() => this.onUpdated(), 0);
            }
        },

        onUpdated: function () {
        },

        add: async function (url, doc, name) {
            let normalizedUrl = _.util.normalizeUrl(url);
            if (!normalizedUrl) {
                throw new Error("invalied url");
            }
            await this.load();
            if (this.urlMap[normalizedUrl]) {
                throw new Error("already resistered");
            }
            doc = doc ?? await _.coFetchHtml(normalizedUrl + "l1");
            await this.load();
            if (this.urlMap[normalizedUrl]) {
                throw new Error("already resistered");
            }
            let bm = _.util.parseDoc(doc, normalizedUrl);
            bm.name = name;
            bm.lastResCount = bm.resCount;
            let setting = this.settings.get();
            setting.bookmarks.push(bm);
            setting.lastUpdate = new Date().getTime();
            await this.settings.set(setting);
            await this.load();
            setTimeout(() => this.onUpdated(), 0);
            return bm;
        },

        update: async function (url, doc) {
            let normalizedUrl = _.util.normalizeUrl(url);
            if (!normalizedUrl) {
                throw new Error("invalied url");
            }
            await this.load();
            if (!this.urlMap[normalizedUrl]) {
                throw new Error("already deleted");
            }
            doc = doc ?? await _.coFetchHtml(normalizedUrl + "l2");
            await this.load();
            if (!this.urlMap[normalizedUrl]) {
                throw new Error("already deleted");
            }
            let bm = _.util.parseDoc(doc, normalizedUrl);
            this.urlMap[bm.url].lastResCount = this.urlMap[bm.url].resCount;
            bm.registerDate = this.urlMap[bm.url].registerDate;
            let setting = this.settings.get();
            Object.assign(this.urlMap[bm.url], bm);
            setting.lastUpdate = new Date().getTime();
            await this.settings.set(setting);
            await this.load();
            setTimeout(() => this.onUpdated(), 0);
            return bm;
        },

        delete: async function (url) {
            await this.load();
            let setting = this.settings.get();
            let normalized = _.util.normalizeUrl(url);
            setting.bookmarks = setting.bookmarks.filter(bm => bm.url != normalized);
            setting.lastUpdate = new Date().getTime();
            await this.settings.set(setting)
            await this.load();
            setTimeout(() => this.onUpdated(), 0);
        },

        find: function (url) {
            return this.urlMap[_.util.normalizeUrl(url)];
        },

        list: function () {
            return this.settings.get().bookmarks;
        }
    }

    _.thread = {
        parseSubback: function (doc, origin) {
            let baseHref = doc.querySelector("base").getAttribute("href");
            return Array.from(doc.querySelectorAll("#trad a")).map(e => ({ mThreadId: e.getAttribute("href").match(/([0-9]{10})\/l50/), mText: e.textContent.match(/([0-9]+): (.*)\(([0-9]{1,4})\)$/) }))
                .filter(e => e.mThreadId && e.mText)
                .map(e => ({
                    number: e.mText[1],
                    threadId: e.mThreadId[1],
                    url: `${origin}${baseHref}${e.mThreadId[1]}`,
                    title: e.mText[2],
                    resCount: e.mText[3]
                }));
        },

        parseHeadline: function (doc) {
            return Array.from(doc.querySelectorAll("body > a"))
                .filter(a => a.previousSibling.nodeType === Node.TEXT_NODE && a.previousSibling.textContent.match(/^\s+[12][0-9]{3}\/[01][0-9]\/[0-3][0-9] [0-2][0-9]:[0-6][0-9]:[0-6][0-9]\s+$/))
                .map((a, i) => ({ number: (i + 1).toString(), parsedUrl: _.util.parseUrl(a.getAttribute("href")), title: a.textContent }))
                .filter(e => e.parsedUrl)
                .map(e => ({
                    number: e.number,
                    threadId: e.parsedUrl.threadId,
                    url: e.parsedUrl.normalize(),
                    title: e.title,
                    resCount: undefined
                }));
        },

        list: async function (url) {
            let parsed = _.util.parseUrl(url);
            if (parsed.subDomain == "headline") {
                let doc = await _.coFetchHtml(parsed.toTop());
                return this.parseHeadline(doc, parsed.origin);
            } else {
                let doc = await _.coFetchHtml(parsed.toSubback());
                return this.parseSubback(doc, parsed.origin);
            }
        },

        listSimilar: async function (threadUrl, title) {
            const similarityThreashold = 0.3;
            let parsed = _.util.parseUrl(threadUrl);
            // タイトルの類似度でソート. 次スレ検索の場合、スレ作成日時/レス数/スレ内にリンク有無等も考慮した方がいい？
            let sortScore = s => (s.resCount < 1000 ? 1 : 0) + s.similarity;
            return (await this.list(threadUrl))
                .map(t => Object.assign(t, { similarity: _.util.similarity.compare(title, t.title) }))
                .filter(s => s.similarity > similarityThreashold && s.threadId != parsed.threadId)
                .sort((l, r) => sortScore(r) - sortScore(l));
        },
    }

    _.bbsmenu = {
        settings: new _.classes.setting("bbsmenu", {}),
        init: async function () {
            await this.settings.load();
        },
        get: async function () {
            let cache = await this.settings.get();
            let expire = new Date();
            expire.setDate(expire.getDate() - 1);
            if (cache && cache.genres && cache.lastUpdate && cache.lastUpdate > expire.getTime()) {
                // await this.load();
                return cache.genres;
            } else {
                return await this.load();
            }
        },
        reset: async function () {
            this.settings.reset();
        },
        load: async function () {
            let doc = await _.coFetchHtml("https://menu.5ch.net/bbsmenu.html");
            console.log("load bbsmenu");
            let genres = Array.from(doc.querySelectorAll("body a"))
                .map(e => ({
                    url: e.getAttribute("href"),
                    parsedUrl: _.util.parseUrl(e.getAttribute("href")),
                    name: e.textContent,
                    genre: e.prevElemAll().find(e => e.tagName.toLowerCase() == "b")?.textContent
                }))
                .filter(e => e.parsedUrl && e.parsedUrl.domain == "5ch.net") // bbspink は除外.
                .map(e => ({ url: e.parsedUrl.normalize(), name: e.name, genre: e.genre, subDomain: e.parsedUrl.subDomain, domain: e.parsedUrl.domain, boardId: e.parsedUrl.boardId, originalUrl: e.url }))
                .reduce((p, c) => {
                    let boards = [];
                    if (p.length == 0 || p[p.length - 1].name != c.genre) {
                        p.push({ name: c.genre, boards: boards });
                    } else {
                        boards = p[p.length - 1].boards;
                    }
                    boards.push(c);
                    return p;
                }, []);
            genres = genres.filter(g => g.name).filter(g => g.boards.length > 0);
            await this.settings.set({ lastUpdate: new Date().getTime(), genres: genres });
            return genres;
        }
    }

    _.init = async function () {
        await _.settings.init();
        await _.bookmark.init();
        await _.history.init();
        await _.bbsmenu.init();
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
