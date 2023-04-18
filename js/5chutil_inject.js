(() => {
    'use strict';
    let completed = false;
    let override = () => {
        if (typeof jQuery === "undefined" || completed) return;
        let jq = jQuery;
        (() => {
            // 不要なイベント.
            const ignoreEvents = [
                // ポップアップ処理.
                { element: document, type: "mouseenter", selector: "a" },
                { element: document, type: "mouseleave", selector: "a" },
                { element: document, type: "mouseover", selector: "a" },
                { element: document, type: "mouseout", selector: "a" },
                { element: document, type: "click", selector: ".uid" }
            ];

            const orig = jq.fn.on;
            // 無視するためHookする.
            jq.fn.on = function (...args) {
                if (ignoreEvents.some(ignore => ignore.element == this?.[0] && ignore.type == args?.[0] && ignore.selector == args?.[1])) {
                    // 無視.
                    return this;
                } else {
                    return orig.apply(this, args);
                }
            };

            // poppup, highlight 処理を実行しないようにイベントを削除する.
            ignoreEvents.forEach(i => $._data(i.element, "events")?.[i.type]
                ?.filter(e => e.selector == i.selector)
                .forEach(e => $(i.element).off(e.type, e.selector)));
        })();

        (() => {
            // 自力やるか機能を止めるため、ready() で 5ch側で実行させないスクリプト.
            let ignoreScripts = [
                // uid クリック時のハイライト処理イベント登録.
                scr => scr.match(/\.on\(\s*['"`]click['"`],\s*['"`]\.uid['"`].*highlightpost/s),
                // ポップアップ処理.
                scr => scr.match(/\.on\(.*mouseenter.+mouseleave/s),
                // back-link 作成処理.
                scr => scr.match(/<span[^>]+class=['"`]back-links['"`]/s),
                // サムネイルの表示処理.
                scr => scr.match(/thumb1\.5ch\.net.+thumbnails.+thumb5ch/s)
            ];
            const orig = jq.fn.ready;
            jq.fn.ready = function (...args) {
                if (ignoreScripts.some(ig => ig(args?.[0]?.toString() ?? ""))) {
                    // 無視.
                    return this;
                } else {
                    return orig.apply(this, args);
                }
            }
        })();
        completed = true;
    };

    // このタイミングではjQueryオブジェクトが生成されてない場合もあるので、DOMContentLoaded でも再トライ.
    document.addEventListener('DOMContentLoaded', (event) => {
        override();
    });
    override();

})();
