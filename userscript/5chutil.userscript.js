// ==UserScript==
// @name         5chutil
// @namespace    5chutil
// @version      0.1.1.9
// @description  5ch のスレッドページに NG や外部コンテンツ埋め込み等の便利な機能を追加する
// @author       5chutil dev
// @match        *://*.5ch.net/test/read.cgi/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @license MIT
// ==/UserScript==

var GOCHUTIL = GOCHUTIL || {};

(function (global) {
    let _ = GOCHUTIL;

    _.storage = {};
    _.env = {};

    // ====== 環境依存 userscript, chrome, firefox ======
    _.env.allowRemoteScript = true;

    // ==================

    if (typeof GM_getValue === 'undefined')
        _.storage.get = GM.getValue
    else
        _.storage.get = GM_getValue

    if (typeof GM_setValue === 'undefined')
        _.storage.set = GM.setValue
    else
        _.storage.set = GM_setValue

    let listValues;
    if (typeof GM_listValues === 'undefined')
        listValues = GM.listValues
    else
        listValues = GM_listValues

    let deleteValue;
    if (typeof GM_deleteValue === 'undefined')
        deleteValue = GM.deleteValue
    else
        deleteValue = GM_deleteValue

    _.storage.clear = async () => {
        let keys = await listValues;
        keys.forEach(async k => await deleteValue(k));
    }

    //// 5chutil.css
    const gochutilcss = `
:root {
    --wait-animation-span: 10s;
    --wait-appendnew-animation-span: 10s;
}

div.message.abone span.abone {
    display: none;
}

div.message div#ng_word_control {
    float: right;
    margin-left: 10px;
}

span.control_link {
    font-size: 13px;
    font-family: monospace;
}

span.control_link a {
    text-decoration: underline !important;
}

span.count_link.many a {
    color: #bb2020;
}

span.mail {
    font-weight: bold;
    margin-right: 5px;
}

span.number.ref_posts a {
    text-decoration: underline !important;
}

span.number.ref_posts.many a {
    color: #bb2020;
}

div.message.abone span.abone_message a {
    font-weight: bold;
}

div.message span.ng_word_wrapper {
    background-color: #ff6060;
}

div.img_popup div.img_container {
    position: relative;
}

div.img_popup div.img_container img {
    max-width: 800px;
    max-height: 600px;
    min-width: 250px;
    min-height: 150px;
}

div.img_popup div.img_container.blur img {
    filter: blur(10px);
}

div.img_popup div.img_container div.remove_blur {
    display: none;
}

div.img_popup div.img_container.blur div.remove_blur {
    position: absolute;
    display: block;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    width: 100%;
    z-index: 1;
    display: flex;
    cursor: default;
    overflow: hidden;
    justify-content: center;
    align-items: center;
    font-size: 160%;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 2px 2px 10px #555,
        -2px 2px 10px #555,
        2px -2px 10px #555,
        -2px -2px 10px #555;
}

div.message span.embed {
    padding: 5px;
    display: inline-block;
    border: 1px solid #464646;
    background-color: #ffffff;
    transition: background-color .3s ease-out;
}

div.message span.embed a {
    color: #485269;
    text-decoration: none !important;
}

div.message span.embed:hover {
    background-color: #eee;
}

.backgroundwidthprogress {
    position: relative;
    z-index: 0;
}

.backgroundwidthprogress::before {
    position: absolute;
    content: "";
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
    height: 100%;
    width: 100%;
    background-color: transparent;
}

.backgroundwidthprogress::after {
    position: absolute;
    content: "";
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
    height: 100%;
    width: 0%;
    background-color: #aaaaaa;
    animation: width 1s forwards linear;
}

div.popup {
    overflow: auto;
}

div.processing_container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 21;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.2);
}

div.processing_container div {
    margin: 0;
    z-index: 22;
    background-color: #dddddd;
    border-radius: 10px;
    height: 80px;
    width: 250px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
}

div.processing_container div span.message {
    padding: 0 0 0 45px;
    height: 48px;
    font-size: 36px;
}

span.appendnewposts {
    margin-left: 10px;
    background-color: #fff;
    transition: background-color .3s ease-out;
    display: inline-block
}

span.appendnewposts a {
    color: #485269;
    display: inline-block;
    width: 200px;
    padding: 10px;
    border: 1px solid #333;
}

span.appendnewposts:hover {
    background-color: #eee;
}

span.appendnewposts.disabled {
    background-color: #aaa;
    transition: none;
}

span.appendnewposts.disabled:hover {
    background-color: #aaa;
}

span.appendnewposts.disabled_exit {
    background-color: #fff;
    transition: none;
}

span.appendnewposts.disabled a.backgroundwidthprogress::after {
    background-color: #fff;
    animation-duration: calc(var(--wait-appendnew-animation-span)) !important;
}

span.autoload_newposts {
    margin-left: 10px;
    padding: 10px;
    border: 1px solid #333;
    background-color: #fff;
}

span.autoload_newposts.backgroundwidthprogress {
    background-color: transparent;
}

span.autoload_newposts.backgroundwidthprogress::before {
    background-color: #ddd;
}

span.autoload_newposts.backgroundwidthprogress::after {
    background-color: #fff;
    animation-duration: calc(var(--wait-animation-span));
}

div.newposts span.error_msg {
    color: #bb2020;
}

div.new {
    position: relative;
}

div.new::after {
    position: absolute;
    content: "";
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
    height: 100%;
    width: 100%;
    filter: blur(15px);
    background: linear-gradient(to left, #3f3f3f, #464646, #666666, #808080, #adadad, #808080, #666666, #464646, #3f3f3f);
    background-size: 200% 200%;
    animation: animateGlow 1.25s linear infinite, animateGlowIn 3s linear;
}

div.new.removingnew::after {
    filter: blur(0px);
    animation: animateGlow 1.25s linear infinite, animateGlowOut 3s linear;
}

div.meta span.back-links.gochutil {
    display: inline-block;
}

.loader {
    position: relative;
}

.loader::after {
    content: "";
    font-size: 8px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    position: absolute;
    animation: load5 1.1s infinite ease;
    transform: translateZ(0);
}

@keyframes load5 {

    0%,
    100% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 1.0), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2), 2.5em 0em 0 0em rgba(0, 0, 0, 0.2), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.2), 0em 2.5em 0 0em rgba(0, 0, 0, 0.2), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.2), -2.6em 0em 0 0em rgba(0, 0, 0, 0.5), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.7);
    }

    12.5% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.7), 1.8em -1.8em 0 0em rgba(0, 0, 0, 1.0), 2.5em 0em 0 0em rgba(0, 0, 0, 0.2), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.2), 0em 2.5em 0 0em rgba(0, 0, 0, 0.2), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.2), -2.6em 0em 0 0em rgba(0, 0, 0, 0.2), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.5);
    }

    25% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.5), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.7), 2.5em 0em 0 0em rgba(0, 0, 0, 1.0), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.2), 0em 2.5em 0 0em rgba(0, 0, 0, 0.2), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.2), -2.6em 0em 0 0em rgba(0, 0, 0, 0.2), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2);
    }

    37.5% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.2), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.5), 2.5em 0em 0 0em rgba(0, 0, 0, 0.7), 1.75em 1.75em 0 0em rgba(0, 0, 0, 1.0), 0em 2.5em 0 0em rgba(0, 0, 0, 0.2), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.2), -2.6em 0em 0 0em rgba(0, 0, 0, 0.2), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2);
    }

    50% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.2), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2), 2.5em 0em 0 0em rgba(0, 0, 0, 0.5), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.7), 0em 2.5em 0 0em rgba(0, 0, 0, 1.0), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.2), -2.6em 0em 0 0em rgba(0, 0, 0, 0.2), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2);
    }

    62.5% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.2), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2), 2.5em 0em 0 0em rgba(0, 0, 0, 0.2), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.5), 0em 2.5em 0 0em rgba(0, 0, 0, 0.7), -1.8em 1.8em 0 0em rgba(0, 0, 0, 1.0), -2.6em 0em 0 0em rgba(0, 0, 0, 0.2), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2);
    }

    75% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.2), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2), 2.5em 0em 0 0em rgba(0, 0, 0, 0.2), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.2), 0em 2.5em 0 0em rgba(0, 0, 0, 0.5), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.7), -2.6em 0em 0 0em rgba(0, 0, 0, 1.0), -1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2);
    }

    87.5% {
        box-shadow: 0em -2.6em 0em 0em rgba(0, 0, 0, 0.2), 1.8em -1.8em 0 0em rgba(0, 0, 0, 0.2), 2.5em 0em 0 0em rgba(0, 0, 0, 0.2), 1.75em 1.75em 0 0em rgba(0, 0, 0, 0.2), 0em 2.5em 0 0em rgba(0, 0, 0, 0.2), -1.8em 1.8em 0 0em rgba(0, 0, 0, 0.5), -2.6em 0em 0 0em rgba(0, 0, 0, 0.7), -1.8em -1.8em 0 0em rgba(0, 0, 0, 1.0);
    }
}

@keyframes animateGlow {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 200% 50%;
    }
}

@keyframes animateGlowIn {
    0% {
        filter: blur(0px);
    }

    100% {
        filter: blur(15px);
    }
}

@keyframes animateGlowOut {
    0% {
        filter: blur(15px);
    }

    100% {
        filter: blur(0px);
    }
}

@keyframes width {
    0% {
        width: 0%;
    }

    100% {
        width: 100%;
    }
}
`;
    //// options.html
    const optionshtml = `
<html lang="ja">

<head>
    <title>5chutil settings</title>
    <meta charset="utf-8" />
    <script src="../js/jquery-3.6.0.min.js"></script>
    <script src="../env.js"></script>
    <script src="../js/5chutil_common.js"></script>
    <script src="../js/options.js"></script>
    <link rel="stylesheet" href="../css/options.css">
</head>

<body>
    <header>
        <h1>5chutil</h1>
    </header>
    <main>
        <h2>動作設定</h2>
        <section>
            <div>
                <ul>
                    <li><input type="checkbox" id="stop" class="app stop" /><label for="stop">動作を停止する</label></li>
                    <li><input type="checkbox" id="hideNgMsg" class="app hideNgMsg" /><label for="hideNgMsg">NGは非表示にする</label></li>
                    <li><input type="checkbox" id="dontPopupMouseoverNgMsg" class="app dontPopupMouseoverNgMsg" /><label for="dontPopupMouseoverNgMsg">あぼーんをマウスオーバーでポップアップしない<br>(クリックではポップアップする)</label></li>
                    <li><input type="checkbox" id="autoscrollWhenNewPostLoad" class="app autoscrollWhenNewPostLoad" /><label for="autoscrollWhenNewPostLoad">新着取得時にスクロールする</label></li>
                    <li><input type="checkbox" id="autoEmbedContents" class="app autoEmbedContents" /><label for="autoEmbedContents">自動でimgur等の外部データの埋め込み処理を行う</label></li>
                    <li><input type="checkbox" id="blurImagePopup" class="app blurImagePopup" /><label for="blurImagePopup">画像のポップアップをぼかす(ぼかし画像クリックでぼかし解除)</label></li>
                    <li>IDが<input type="number" maxlength="2" class="app idManyCount" min="1" max="99" />個以上は赤くする&nbsp;<button type="button" class="app save idManyCount">保存</button></li>
                    <li>Korokoro(SLIP)が<input type="number" maxlength="2" class="app koro2ManyCount" min="1" max="99" />個以上は赤くする&nbsp;<button type="button" class="app save koro2ManyCount">保存</button></li>
                    <li>IP(SLIP)が<input type="number" maxlength="2" class="app ipManyCount" min="1" max="99" />個以上は赤くする&nbsp;<button type="button" class="app save ipManyCount">保存</button></li>
                    <li>参照POSTが<input type="number" maxlength="2" class="app refPostManyCount" min="1" max="99" />個以上は赤くする&nbsp;<button type="button" class="app save refPostManyCount">保存</button></li>
                    <li>自動ロード間隔<input type="number" maxlength="4" class="app autoloadIntervalSeconds" min="60" max="3600" />秒&nbsp;<button type="button" class="app save autoloadIntervalSeconds">保存</button></li>
                    <li>非アクティブ時の許容自動ロード回数<input type="number" maxlength="2" class="app allowUnforcusAutoloadCount" min="1" max="99" />回&nbsp;<button type="button" class="app save allowUnforcusAutoloadCount">保存</button></li>
                    <li>カスタムCSS<br><textarea class="app customCss" wrap="off" rows="10" cols="60" ></textarea><br><button type="button" class="app save customCss">保存</button></li>
                    <li>削除セレクタ<input style="margin-left: 50px; width:200px; color:transparent; border:none;" value='div.ad--bottom, div.ad--right > *, div#banner, div[id^="horizontalbanners"], div#AD_e4940a622def4b87c34cd9b928866823_1, div#ads-ADU-DYQA7DD0, div.footer.push + div, iframe[src$="://cache.send.microad.jp/js/cookie_loader.html"]' /><br>
                        <textarea class="app deleteSelectors" wrap="off" rows="4" cols="60" ></textarea><br><button type="button" class="app save deleteSelectors">保存</button></li>
                </ul>
            </div>
            <span class="notes">※ 設定変更時は5chページ要リロード</span><br>
            <button type="button" class="app reset">動作設定を全てデフォルトに戻す</button>
        </section>
        <h2>NG 設定</h2>
        <section>
            <h3>NG Name</h3>
            <section>
                <form>
                    <div>
                        <select class="ng name" multiple>
                        </select>
                    </div>
                    <div>
                        <button type="button" class="ng name remove">削除</button>&nbsp;<button type="button" class="ng name clear">クリア</button>
                    </div>
                    <div>
                        <span class="notes">※最大<span class="ng name max"></span>件まで、超過登録時に古いものから削除されます</span>
                    </div>
                </form>
            </section>
            <h3>NG Trip</h3>
            <section>
                <form>
                    <div>
                        <select class="ng trip" multiple>
                        </select>
                    </div>
                    <div>
                        <button type="button" class="ng trip remove">削除</button>&nbsp;<button type="button" class="ng trip clear">クリア</button>
                    </div>
                    <div>
                        <span class="notes">※最大<span class="ng trip max"></span>件まで、超過登録時に古いものから削除されます</span>
                    </div>
                </form>
            </section>
            <h3>NG Korokoro(SLIP)</h3>
            <section>
                <form>
                    <div>
                        <select class="ng koro2" multiple>
                        </select>
                    </div>
                    <div>
                        <button type="button" class="ng korkoro2 remove">削除</button>&nbsp;<button type="button" class="ng koro2 clear">クリア</button>
                    </div>
                    <div>
                        <span class="notes">※最大<span class="ng koro2 max"></span>件まで、超過登録時に古いものから削除されます</span>
                    </div>
                </form>
            </section>
            <h3>NG IP(SLIP)</h3>
            <section>
                <form>
                    <div>
                        <select class="ng ip" multiple>
                        </select>
                    </div>
                    <div>
                        <button type="button" class="ng ip remove">削除</button>&nbsp;<button type="button" class="ng ip clear">クリア</button>
                    </div>
                    <div>
                        <span class="notes">※最大<span class="ng ip max"></span>件まで、超過登録時に古いものから削除されます</span>
                    </div>
                </form>
            </section>
            <h3>NG ID and DATE</h3>
            <section>
                <form>
                    <div>
                        <select class="ng dateAndID" multiple>
                        </select>
                    </div>
                    <div>
                        <input type="number" maxlength="2" class="ng dateAndID days" value="30" min="1" max="99" />日以前を全て<button type="button" class="ng dateAndID select">選択</button>
                    </div>
                    <div>
                        <button type="button" class="ng dateAndID remove">削除</button>&nbsp;<button type="button" class="ng dateAndID clear">クリア</button>
                    </div>
                    <div>
                        <span class="notes">※最大<span class="ng dateAndID max"></span>件まで、超過登録時に古いものから削除されます</span>
                    </div>
                </form>
            </section>
            <h3>NG Words</h3>
            <section>
                <form>
                    <div>
                        <select class="ng word" multiple>
                        </select>
                    </div>
                    <div>
                        <input type="text" maxlength="10" class="ng word input" /><button type="button" class="ng word add">追加</button>
                    </div>
                    <div>
                        <button type="button" class="ng word remove">削除</button>&nbsp;<button type="button" class="ng word clear">クリア</button>
                    </div>
                    <div>
                        <span class="notes">2文字以上9文字以下</span><br/>
                        <span class="notes">※最大<span class="ng word max"></span>件まで、超過登録時に古いものから削除されます</span>
                    </div>
                </form>
            </section>
            <span class="notes">※ 設定変更時は5chページ要リロード</span>
        </section>
    </main>
</body>

</html>
`;
    //// options.js
    const optionsjs = function () {/*
$(() => {
    var _ = GOCHUTIL;

    _.initOptions = () => {
        let initializeCheckboxSetting = (propName) => {
            $(`input.app.${propName}`).prop("checked", _.settings.app.get()[propName]);

            $(`input.app.${propName}`).off("change");
            $(`input.app.${propName}`).on("change", async function () {
                let setting = _.settings.app.get();
                setting[propName] = $(this).is(":checked");
                await _.settings.app.set(setting);
            });
        }
        initializeCheckboxSetting("stop");
        initializeCheckboxSetting("hideNgMsg");
        initializeCheckboxSetting("dontPopupMouseoverNgMsg");
        initializeCheckboxSetting("autoscrollWhenNewPostLoad");
        initializeCheckboxSetting("autoEmbedContents");
        initializeCheckboxSetting("blurImagePopup");

        let initializeNumberSetting = (propName) => {
            let $input = $(`input.app.${propName}`);
            $input.val(_.settings.app.get()[propName]);
            $(`button.app.save.${propName}`).off("click");
            $(`button.app.save.${propName}`).on("click", async function () {
                let num = parseInt($input.val());
                let min = parseInt($input.attr("min"));
                let max = parseInt($input.attr("max"));
                if (num && !num.isNaN && min <= num && num <= max) {
                    let setting = _.settings.app.get();
                    setting[propName] = num;
                    await _.settings.app.set(setting);
                } else {
                    window.alert(`${min}～${max}で設定してください。`);
                }
            });
        }
        initializeNumberSetting("idManyCount");
        initializeNumberSetting("koro2ManyCount");
        initializeNumberSetting("ipManyCount");
        initializeNumberSetting("refPostManyCount");
        initializeNumberSetting("autoloadIntervalSeconds");
        initializeNumberSetting("allowUnforcusAutoloadCount");

        let initializeTextareaSetting = (propName) => {
            let $text = $(`textarea.app.${propName}`);
            $text.val(_.settings.app.get()[propName]);
            $(`button.app.save.${propName}`).off("click");
            $(`button.app.save.${propName}`).on("click", async function () {
                let setting = _.settings.app.get();
                setting[propName] = $text.val();
                await _.settings.app.set(setting);
            });
        }

        initializeTextareaSetting("customCss");
        initializeTextareaSetting("deleteSelectors");

        $("button.app.reset").off("click");
        $("button.app.reset").on("click", async function () {
            await _.settings.app.reset();
            _.initOptions();
        });

        let vToOption = (v, valueToOption) => {
            let o = valueToOption(v);
            o.data("value", v);
            return o
        }

        let initialiezeNG = (className, lister, valueToOption, handler, maxSize) => {
            $(`select.ng.${className}`).find("option").remove();
            $(`select.ng.${className}`)
                .append(lister().map(v => vToOption(v, valueToOption)))
                .on("change", function () {
                    $(`button.ng.${className}.remove`).prop("disabled", $(`select.ng.${className}`).find("option:selected").length == 0);
                });

            $(`button.ng.${className}.remove`).off("click");
            $(`button.ng.${className}.remove`).on("click", async function () {
                if ($(`select.ng.${className}`).find("option:selected").length > 0) {
                    $(`select.ng.${className}`).find("option:selected").remove();
                    $(`select.ng.${className}`).trigger("change");
                    await handler($(`select.ng.${className}`).find("option").map((i, e) => $(e).data("value")).get());
                }
            });

            $(`button.ng.${className}.clear`).off("click");
            $(`button.ng.${className}.clear`).on("click", async function () {
                if (window.confirm("すべて削除します。よろしいですか。")) {
                    $(`select.ng.${className}`).find("option").remove();
                    $(`select.ng.${className}`).trigger("change");
                    await handler([]);
                }
            });

            $(`span.ng.${className}.max`).text(maxSize);
        }

        let wordValueToOpt = v => $(`<option data-word="${v}">${v}</option>`);
        initialiezeNG("name", () => _.settings.ng.names.list(), v => $(`<option>${v}</option>`), v => _.settings.ng.names.set(v), _.settings.ng.names.maxSize());
        initialiezeNG("trip", () => _.settings.ng.trips.list(), v => $(`<option>${v}</option>`), v => _.settings.ng.trips.set(v), _.settings.ng.trips.maxSize());
        initialiezeNG("koro2", () => _.settings.ng.koro2s.list(), v => $(`<option>${v}</option>`), v => _.settings.ng.koro2s.set(v), _.settings.ng.koro2s.maxSize());
        initialiezeNG("ip", () => _.settings.ng.ips.list(), v => $(`<option>${v}</option>`), v => _.settings.ng.ips.set(v), _.settings.ng.ips.maxSize());
        initialiezeNG("dateAndID", () => _.settings.ng.dateAndIDs.list(), v => $(`<option data-date="${v.date}" data-uid="${v.id}" >Date:${v.date}&nbsp;|&nbsp;ID:${v.id}</option>`), v => _.settings.ng.dateAndIDs.set(v), _.settings.ng.dateAndIDs.maxSize());
        initialiezeNG("word", () => _.settings.ng.words.list(), wordValueToOpt, v => _.settings.ng.words.set(v), _.settings.ng.words.maxSize());

        $("button.ng.dateAndID.select").off("click");
        $("button.ng.dateAndID.select").on("click", function () {
            let $input = $("input.ng.dateAndID.days");
            let num = parseInt($input.val());
            let min = parseInt($input.attr("min"));
            let max = parseInt($input.attr("max"));
            if (num && !num.isNaN && min <= num && num <= max) {
                let now = new Date();
                let to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - num);
                let ymdTo = to.getFullYear() + "/" + ("00" + (to.getMonth() + 1)).slice(-2) + "/" + ("00" + to.getDate()).slice(-2);
                $("select.ng.dateAndID").find("option").each((i, e) => {
                    let $opt = $(e)
                    if ($opt.data("date") <= ymdTo) {
                        $opt.prop("selected", true);
                    }
                });
            } else {
                window.alert(`${min}～${max}で設定してください。`);
            }
        });

        $("button.ng.word.add").off("click");
        $("button.ng.word.add").on("click", async function () {
            let word = $("input.ng.word.input").val();
            if (word && _.settings.ng.words.contains(word) || word.length < 2 || word.length > 9) {
                window.alert("未登録かつ2文字以上9文字以下で入力してください。");
            } else {
                $("select.ng.word").append(vToOption(word, wordValueToOpt));
                let del = await _.settings.ng.words.add(word);
                del.forEach(d => $(`option[data-word = "${d}"]`).remove());
                $("input.ng.word.input").val("");
                $("input.ng.word.input").trigger("change");
            }
        });
    };

    let main = () => {
        _.initOptions();
    };

    _.init().then(r => main());
});

*/}.toString().split(/\/\*|\*\//)[1];

    //// options.css
    const optionscss = `
body {
    font-size: 1.15rem;
    line-height: 1.5;
    margin: 0;
    background-color: #ffffff;
}

header {
    border-bottom: 1px solid;
    background-color: #ddddff;
    text-align: center;
    padding: 0 1rem 0rem 1rem;
}

main {
    padding: 0 10px 2rem 10px;
}

h1, h2, h3 {
    line-height: 1.1;
    margin: 0;
}

h1 {
    font-size: 3rem;
    padding: 10px 0;
}

h2 {
    font-size: 2.6rem;
    margin-top: 1rem;
    padding: 3px;
    background-color: #eeeeee;
}

h3 {
    font-size: 2rem;
    margin-top: 1rem;
}

select {
    min-width: 300px;
    max-width: 500px;
    height: 100px;
}

input[type="number"] {
    width: 80px;
}

div {
    margin-top: 5px;
}

li {
    white-space: nowrap;
}

span.notes {
    white-space: nowrap;
}
`;

    _.addStyle = ($html, css) => {
        let $head = $html.find('head');
        if ($head.length > 0) {
            $head.append($('<style type="text/css">').html(css))
        }
    };
    _.addScript = ($html, js) => {
        let $head = $html.find('head');
        if ($head.length > 0) {
            $head.append($('<script type="text/javascript">').html(js))
        }
    };

    _.addStyle($("html"), gochutilcss);

    let parser = new DOMParser();
    let doc = parser.parseFromString(optionshtml, "text/html");
    let $optionshtml = $(doc).find("html");
    $optionshtml.find("head script").remove();
    $optionshtml.find("head link").remove();

    $optionshtml.find("head").append(`<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" type="text/javascript"></script>`);
    unsafeWindow.GOCHUTIL = _;
    $optionshtml.find("head").append(`
<script type="text/javascript">
    var GOCHUTIL = window.parent.GOCHUTIL;
</script>`);
    _.addStyle($optionshtml, optionscss);
    _.addScript($optionshtml, optionsjs);

    let $optionView = $(`
<div id="gochutil_option_view" class="gochutil_option_container" style="display: none; position: fixed; top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;z-index: 11;">
    <div class="gochutil_option_container_bg" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; z-index: 12; display: block;" />
    <div class="gochutil_option" style="position:absolute; height:auto; width:450; z-index:13; display:inline-block;"><iframe frameborder="0" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; border:2px black solid;"></iframe></div>
</div>`);
    $optionView.find("iframe").attr("srcdoc", $optionshtml.html());

    var $settingLink = $(`<div id="gochutil_setting" style="position: fixed;"><a href="javascript:void(0);">5chutil設定</a></div>`);

    $(() => {
        let top = $("nav.navbar-fixed-top").height() + 10;
        let right = 230;

        $("body").on("click", "#gochutil_setting", function () {
            if ($("#gochutil_option_view").css("display") == "none") {
                _.initOptions();
                $("#gochutil_option_view div.gochutil_option").height(Math.min(800, $(window).height() - top - $settingLink.height() - 5 - 20));
                $("#gochutil_option_view div.gochutil_option").width(Math.min(600, $(window).width() - (right * 2)));
                $("#gochutil_option_view").css("display", "block");
            } else {
                $("#gochutil_option_view").css("display", "none");
            }
        });
        $("body").on("click", "#gochutil_option_view div.gochutil_option_container_bg", function () {
            $("#gochutil_option_view").css("display", "none");
        });

        $("body").append($optionView);
        $("body").append($settingLink);

        $settingLink.css("top", top);
        $settingLink.css("right", right);
        let $option = $optionView.find("div.gochutil_option");
        $option.css("top", top + $settingLink.height() + 5);
        $option.css("right", right);
    })

    //// 5chutil_inject.js
    const gochutil_injectjs = function () {/*
$(() => {
    let intervals = {};
    let counts = {};
    let removeEvent = ($obj, target) => $._data($obj.get(0), "events")?.[target.type]?.filter(e => e.selector == target.selector).reduce((p, c) => p.add($obj.off(c.type, c.selector), $obj.off(c.origType, c.selector)), $());
    // poppup, highlight 処理を実行しないようにイベントを削除する.
    [{ type: "mouseover", selector: "a" }, { type: "mouseout", selector: "a" }, { type: "click", selector: ".uid" }]
        .filter(t => !removeEvent($(document), t))
        .forEach(t => intervals[t] = setInterval(() => {
            counts[t] = (counts[t] ?? 0) + 1;
            if (removeEvent($(document), t) || counts[t] > 10) {
                clearInterval(intervals[t]);
            }
        }, 1000));
});

*/}.toString().split(/\/\*|\*\//)[1];

    _.injectJs = () => {
        $('body').append(`<script type="text/javascript">${gochutil_injectjs}</script>`);
    };
}(this));

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
}(this));


$(() => {
    let _ = GOCHUTIL;
    let main = () => {
        let rName = /^<b>(.*?) *<\/b>/;
        let rTrip = /(◆[./0-9A-Za-z]{8,12})/;
        let rSlip = /(\(.+? ([*A-Za-z0-9+/]{4}-[*A-Za-z0-9+/=]{4}).*?\))/;
        let rKoro2 = /([*A-Za-z0-9+/]{4}-[*A-Za-z0-9+/=]{4})/;
        let rIp = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/;
        let rUid = /^ID:([^ ]{8,16})$/;
        let rDate = /^([0-9]{4}\/[0-9]{2}\/[0-9]{2}).*$/;
        let rReplyHref = /\/([0-9]{1,3})$/;
        let rAnotherThreadHref = /(https?:\/\/.+\.5ch\.net\/test\/read.cgi\/[^/]+\/[0-9]+\/)$/


        let threadUrl = ($("#zxcvtypo").val().startsWith("//") ? location.protocol : "") + $("#zxcvtypo").val() + "/";

        let postValueCache = {};

        _.injectJs();

        let getPostId = ($post) => {
            return $post.attr("data-id");
        }

        let addStyle = ($html, css) => {
            let $body = $html.find('body');
            if ($body.length > 0) {
                $body.append($('<style type="text/css">').html(css))
            }
        };

        if (_.settings.app.get().customCss) {
            addStyle($("html"), _.settings.app.get().customCss);
        }

        if (_.settings.app.get().hideNgMsg) {
            addStyle($("html"), `div.post.abone, div.post.abone + br { display: none !important; }`);
        }

        if (_.settings.app.get().deleteSelectors) {
            _.settings.app.get().deleteSelectors.replace(/\r\n|\r/g, "\n").split("\n").filter(l => l).forEach(l => $(l).remove());
        }

        // 投稿データの解析 <div class="post">.
        let parsePost = ($post) => {
            let spanName = $post.find("span.name").html();
            let num = $post.find("span.number").text();

            let mValue = (m) => {
                if (m && m.length > 0 && m[1] && m[1].length > 0) {
                    return m[1]
                }
            }

            let postId = getPostId($post);
            let name = mValue(spanName.match(rName));
            let trip = mValue(spanName.match(rTrip));
            let slip = mValue(spanName.match(rSlip));
            let koro2 = mValue(slip?.match(rKoro2));
            let ip = mValue(slip?.match(rIp));

            let dateAndID = undefined;

            let mdate = $post.find("span.date").text().match(rDate);
            let muid = $post.find("span.uid").text().match(rUid);
            if (mdate && mdate.length > 0 && muid && muid.length > 0) {
                dateAndID = _.settings.ng.dateAndIDs.create(mdate[1], muid[1]);
            }

            let msg = $post.find("div.message span").not(".abone_message").text();

            return {
                postId: postId,
                num: num,
                name: name,
                trip: trip,
                slip: slip,
                koro2: koro2,
                ip: ip,
                dateAndID: dateAndID,
                msg: msg
            }
        }

        // 解析データの取得.
        let getPostValue = ($post) => {
            let postId = getPostId($post);
            if (!postValueCache[postId]) {
                initializePost($post);
                postValueCache[postId] = parsePost($post);
            }
            return postValueCache[postId];
        }

        // 投稿データがNGか判定.
        let matchNGPost = (value) => {
            return {
                name: _.settings.ng.names.contains(value.name),
                trip: _.settings.ng.trips.contains(value.trip),
                slip: _.settings.ng.slips.contains(value.slip),
                koro2: _.settings.ng.koro2s.contains(value.koro2),
                ip: _.settings.ng.ips.contains(value.ip),
                id: _.settings.ng.dateAndIDs.contains(value.dateAndID),
                word: _.settings.ng.words.match(value.msg),
                any: function () {
                    return Object.values(this).filter(e => typeof (e) === 'boolean').some(v => v);
                }
            }
        }

        // 制御用リンクタグ生成.
        let createControlLink = (className, text, noLink = false) => {
            let alink = noLink ? text : `<a href="javascript:void(0)">${text}</a>`;
            return $(`<span class="control_link ${className}">[${alink}]</span>`);
        }

        // NG制御用リンクタグ生成.
        let createNGControlLink = (ng, className, displayTargetName, titleTargetName) => {
            let controlClassName = ng ? "remove" : "add";
            let displayPrefix = ng ? "-" : "+";
            if (!titleTargetName) {
                titleTargetName = displayTargetName;
            }
            let allClass = `ng_control_link ${controlClassName} ${className}`;
            let text = `${displayPrefix}${displayTargetName}`;
            let link = createControlLink(allClass, text);
            link.attr("title", `${displayPrefix}${titleTargetName}`)
            return link;
        }

        // 埋め込み処理.
        let embedElem = ($a, $contents) => {
            let cotentsHtml = $("<div>").append($contents).html();
            let $container = $(`<span class="embed"><a href="javascript:void(0);" class="embed">コンテンツを埋め込む</a><span>`).attr("data-embed-content", cotentsHtml);

            if ($a.next().length == 0) {
                $a.parent().append("<br>").append($container);
            } else if ($a.next().is("br")) {
                $a.next().after($container);
            } else {
                $a.after($container).after("<br>");
            }
            $container.last().after("<br>");
        }

        $(document).on("click", "span.embed a", function () {
            let $span = $(this).closest("span.embed");
            $span.after($span.attr("data-embed-content"));
            $span.remove();
        });

        let onScrollInEmbedContents = () => {
            setTimeout(() => {
                // 画面内の埋め込みコンテンツを表示する.
                if (_.settings.app.get().autoEmbedContents) {
                    $("span.embed").each((i, e) => {
                        let $e = $(e);
                        margin = 10;
                        if ($e.offset().top + $e.height() >= $(window).scrollTop() - margin && $e.offset().top <= $(window).scrollTop() + $(window).height() + margin) {
                            $e.find("a").trigger("click");
                        }
                    })
                }
            }, 100);
        }

        $(window).on("scroll", function () {
            onScrollInEmbedContents();
        });

        $(window).on("resize", function () {
            onScrollInEmbedContents();
        });

        if (_.env.allowRemoteScript) {
            $("head").append(`<script>window.twttr = (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0],
                  t = window.twttr || {};
                if (d.getElementById(id)) return t;
                js = d.createElement(s);
                js.id = id;
                js.src = "https://platform.twitter.com/widgets.js";
                fjs.parentNode.insertBefore(js, fjs);
              
                t._e = [];
                t.ready = function(f) {
                  t._e.push(f);
                };
              
                return t;
              }(document, "script", "twitter-wjs"));
              </script>`);
            $("body").append(`
            <div id="fb-root"></div>
            <script async defer crossorigin="anonymous" src="https://connect.facebook.net/ja_JP/sdk.js#xfbml=1&version=v13.0" nonce="7DajCODV"></script>
            `);
        }

        let twitterIdNumber = 0;

        let parseImgurId = (href) => {
            let match = href.match(/\/\/(m\.|i\.|)imgur\.com\/(a\/|gallery\/|)([0-9a-zA-Z]{7}).*$/);
            return match && (match[2] != "" ? "a/" : "") + match[3];
        }

        let initializePost = async ($post) => {
            if ($post.attr("data-initialized")) {
                return;
            }
            // direct link 化
            $post.find("div.message a").not(".reply_link").not(".directlink").each((i, e) => {
                let $a = $(e);
                const redirectorUrl = "http://jump.5ch.net/?";
                let href = $a.attr("href");
                if (href.startsWith(redirectorUrl)) {
                    $a.addClass("directlink");
                    $a.attr("data-original-href", href);
                    $a.attr("data-direct-href", href.slice(redirectorUrl.length));
                    $a.attr("href", href.slice(redirectorUrl.length));
                    $a.attr("data-original-referrerpolicy", $a.attr("referrerpolicy") ?? "");
                    $a.attr("referrerpolicy", "no-referrer");
                }
            });

            $post.find("div.message a.directlink").each((i, e) => {
                let $a = $(e);
                let imgurid = parseImgurId($a.attr("href"));
                let twitter = $a.attr("href").match(/\/\/twitter\.com\/[^\/]+?\/status\/([0-9]+).*$/);
                let insta = $a.attr("href").match(/\/\/www\.instagram\.com\/(p|reel)\/([^\/]+?)\/.*$/);
                let facebook = $a.attr("href").match(/\/\/(m|www)\.facebook.com\/(?<id1>[^\/]+?)\/posts\/(?<id2>[^\/?]+).*$/);
                let youtube = $a.attr("href").match(/\/\/(www|m)\.youtube.com\/.*[?&]v=(?<id>[^&]+).*$/) || $a.attr("href").match(/\/\/youtu.be\/(?<id>[^&]+)$/);

                if (!$a.attr("data-embed")) {
                    $a.attr("data-embed", true);
                    if (imgurid) {
                        // imgur の埋め込み化.
                        if (_.env.allowRemoteScript) {
                            embedElem($a, $(`<blockquote class="imgur-embed-pub" lang="en" data-id="${imgurid}" data-context="false" ><a href="//imgur.com/${imgurid}"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>`));
                        } else {
                            // iframeで無理やり表示する.
                            embedElem($a,
                                $(`<iframe frameborder="0" scrolling="no" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" class="imgur-embed-iframe-pub imgur-embed-iframe-pub-${imgurid.replace("/", "-")}-false-400"
                            src="https://imgur.com/${imgurid}/embed?pub=true&amp;context=false&amp;w=400" id="imgur-embed-iframe-pub-${imgurid.replace("/", "-")}" style="height: 330px; width: 450px; margin: 10px 0px; padding: 0px;"></iframe>`));
                        }
                    }
                    else if (twitter && $post.attr("id")) {
                        // twitter の埋め込み化.
                        let tweetid = twitter[1];
                        let containerId = "tweet_container-" + $post.attr("id") + "-" + i;
                        if (_.env.allowRemoteScript) {
                            embedElem($a, $(`<div id="${containerId}" class="twitter embed"></div><script id="test">window.twttr.ready(() => twttr.widgets.createTweet("${tweetid}", document.getElementById("${containerId}"), { lang:"ja" }));</script>`));
                        } else {
                            // iframeで無理やり表示する.
                            embedElem($a,
                                $(`<iframe id="twitter-widget-${twitterIdNumber}" scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen="true" class="" style="position: static; visibility: visible; width: 550px; height: 500px; display: block; flex-grow: 1;" title="Twitter Tweet"
                            src="https://platform.twitter.com/embed/Tweet.html?dnt=false&amp;embedId=twitter-widget-${twitterIdNumber}&amp;frame=false&amp;hideCard=false&amp;hideThread=false&amp;id=${tweetid}&amp;lang=ja&amp;width=550px" data-tweet-id="${tweetid}"></iframe>`));
                            twitterIdNumber++;
                        }
                    } else if (insta) {
                        // instagram の埋め込み.
                        if (_.env.allowRemoteScript) {
                            embedElem($a, $(`<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/${insta[1]}/${insta[2]}/" style="width:450px;"></blockquote><script async src="//www.instagram.com/embed.js"></script>`));
                        } else {
                            // iframeで無理やり表示する.
                            embedElem($a, $(`<iframe src="https://www.instagram.com/${insta[1]}/${insta[2]}/embed/captioned/" style="width:450px;" scrolling="no" frameborder="0" allowtransparency="true"></iframe>`));
                        }
                    } else if (_.env.allowRemoteScript && facebook) {
                        // facebook の埋め込み.
                        let id1 = facebook.groups["id1"], id2 = facebook.groups["id2"];
                        if (_.env.allowRemoteScript) {
                            embedElem($a, $(`<div class="fb-post" data-lazy="true" data-href="https://www.facebook.com/${id1}/posts/${id2}/" data-width="450" data-show-text="true"></div><script type="text/javascript">FB.XFBML.parse();</script>`));
                        } else {
                            // iframe でどう埋め込むか不明. ここには入らない.
                            // TODO: 対応する.
                            embedElem($a, $(`<iframe width="450px" frameborder="0" allowtransparency="true" allowfullscreen="true" scrolling="no" allow="encrypted-media" src="https://www.facebook.com/plugins/post.php?channel=https%3A%2F%2Fstaticxx.facebook.com%2Fx%2Fconnect%2Fxd_arbiter%2F%26is_canvas%3Dfalse%26relation%3Dparent.parent&amp;href=https%3A%2F%2Fwww.facebook.com%2F${id1}%2Fposts%2F${id2}%2F&amp;locale=ja_JP&amp;sdk=joey&amp;show_text=true&amp;width=450" style="border: none; width: 450px; visibility: visible;" class=""></iframe>`));
                        }
                    } else if (youtube) {
                        // youtube の埋め込み.
                        embedElem($a, $(`<iframe src="//www.youtube.com/embed/${youtube.groups["id"]}" width="640" height="360" scrolling="no" frameborder="0" allowfullscreen></iframe>`));
                    } else {
                        $a.removeAttr("data-embed");
                    }
                }
            });

            // MailTo を別Link化
            if ($post.find("span.mail").length == 0) {
                $mailTo = $post.find("span.name").find("a");
                let href = $mailTo.attr("href");
                if (!href) {
                    $post.find("span.name").after(`<span class="mail"></span>`)
                } else if (href == "mailto:sage") {
                    $post.find("span.name").after(`<span class="mail">[sage]</span>`)
                } else {
                    $post.find("span.name").after(`<span class="mail"><a href="${href}">[Mail]</a></span>`)
                }
                $mailTo.contents().unwrap();
                $mailTo.remove();
            }

            $post.find("span.name small").contents().unwrap();
            $post.find("span.name small").remove();

            // reply link のリンク先のID設定.
            $post.find("div.message a.reply_link").each((i, e) => {
                let $a = $(e);
                if (!$a.attr("data-href-id")) {
                    let match = $a.attr("href").match(rReplyHref);
                    let replyPid = match && match[1];
                    $a.attr("data-href-id", replyPid);
                }
            });

            // 別スレへのリンク.
            $post.find("div.message a").not(".reply_link").not(".ref_another_thread").each((i, e) => {
                let $a = $(e);
                let match = $a.attr("href")?.match(rAnotherThreadHref);
                if (match) {
                    $a.addClass("ref_another_thread");
                    $a.attr("data-href-thread", match[1]);
                }
            });

            // thumbnailer.
            $post.find("div.thumb5ch").remove();
            $post.find("a.thumbnail").remove();
            $post.find("div.message a.directlink").each(async (i, e) => {
                let $a = $(e);
                let imgUrl = $a.attr("href");
                if (imgUrl.match(/\.(gif|jpg|jpeg|tiff|png)/i)) {
                    let b64Url = await blobToBase64(new Blob([imgUrl]));
                    let url = `https://thumb1.5ch.net/thumbnails/${location.hostname.split(".")[0]}/${b64Url.substr(b64Url.length - 250)}.png?imagelink=${encodeURIComponent(imgUrl)}`;
                    fetchDataUrl(url)
                        .then(dataUrl => {
                            $a.find('div[div="thumb5ch"]').remove();
                            let $clone = $a.clone().addClass("thumbnail_gochutil");
                            $clone.html("").append($("<div></div>").addClass("thumb5ch gochutil").attr("div", "thumb5ch").append($("<img></img>").addClass("thumb_i").attr("src", dataUrl)));
                            $a.after($clone);
                        })
                        .catch(err => { if (err.httpStatus != 202) console.error(err); });
                }
            });

            $post.attr("data-initialized", true);
        }

        $(document).on("click", "a.href_id", function () { scrollToPid($(this).attr("data-href-id")); });

        let scrollToPid = (pid) => {
            if (pid) {
                $('body,html').scrollLeft($("#" + pid).offset().left);
                $('body,html').animate({ scrollTop: $("#" + pid).offset().top - $("nav.navbar-fixed-top").height() - 10 }, 400, 'swing');
            }
        }

        // リモートスクリプトが使えない場合には、自力でメッセージ処理をしてiframeの高さ調整.
        // サービス側の仕様が変わったら動かなくなるので、できればブラックボックスのままリモートスクリプトに処理させたい...
        if (!_.env.allowRemoteScript) {
            let findOwnerIFrame = (source) => Array.from(document.getElementsByTagName("iframe")).find(elm => elm["contentWindow"] == source);
            window.addEventListener('message', function (e) {
                if (e.origin.match(/^https?:\/\/platform\.twitter\.com$/)) {
                    // twitter.
                    if (e?.data["twttr.embed"]?.id && e.data["twttr.embed"]?.method == "twttr.private.resize") {
                        e.data["twttr.embed"]?.params?.filter(p => p.height).forEach(p => {
                            // $(`iframe#${e.data["twttr.embed"].id}`).height(p.height);
                            $(findOwnerIFrame(e.source)).height(p.height);
                        });
                    }
                } else if (e.origin.match(/^https?:\/\/imgur\.com$/)) {
                    // imgur.
                    let data = JSON.parse(e?.data);
                    if (data?.message == "resize_imgur" && data?.height && data?.width && data?.href) {
                        // let imgurid = parseImgurId(data.href.replace(/\/embed?.*/, ""));
                        // if (imgurid) {
                        //    $(`iframe#imgur-embed-iframe-pub-${imgurid.replace("/", "-")}`).width(data.width).height(data.height);
                        //}
                        $(findOwnerIFrame(e.source)).width(data.width).height(data.height);
                    }
                } else if (e.origin.match(/^https?:\/\/www\.instagram\.com$/)) {
                    // instagram.
                    let data = JSON.parse(e?.data);
                    if (data?.type == "MEASURE" && data?.details?.height) {
                        $(findOwnerIFrame(e.source)).height(data.details.height);
                    }
                } else if (e.origin.match(/^https?:\/\/www\.facebook\.com$/)) {
                    // facebook.
                    let data = e?.data?.split("&").map(kv => { return { k: kv.split("=")?.[0], v: kv.split("=")?.[1] }; }).filter(kv => kv.k).reduce((p, c) => { p[c.k] = c.v ?? ""; return p; }, {});
                    if (data && data.type == "resize" && data.width && data.height) {
                        $(findOwnerIFrame(e.source)).width(data.width).height(data.height);
                    }
                } else {

                }
            });
        }

        // 処理中メッセージ.
        $("body").append(`<div id="processing_message" class="processing_container" style="display:none;"><div><span class="loader"></span><span class="message">処理中</span></div></div>`);
        let showProcessingMessage = () => $("#processing_message").css("display", "flex");
        let hideProcessingMessage = () => $("#processing_message").css("display", "none");

        // スレッド処理.対象PostIDを指定可能
        let processAllThread = async () => processPostsInternal($("div.thread div.post").toArray().map(p => $(p)));

        let processPosts = async (pids) => {
            let pidSet = pids?.reduce((p, c) => p.add(c), new Set());
            processPostsInternal($("[data-id]").toArray().map(p => $(p))
                .filter($p => !pidSet || pidSet.has(getPostId($p))));
        };

        let processPostsInternal = async (array) => {
            if (array.length > 100) {
                showProcessingMessage();
            }

            // 非同期で処理する.
            array = array.map($p => new Promise((resolve, reject) => {
                setTimeout(() => {
                    processPost($p);
                    resolve();
                }, 0);
            }));

            Promise.all(array)
                .catch(error => console.error(error))
                .then(() => {
                    onScrollInEmbedContents();
                    hideProcessingMessage();
                });
        }

        // 投稿に対する処理.
        let processPost = ($post) => {
            initializePost($post);

            // Parse済みデータ取得.
            let value = getPostValue($post);

            // NG判定.
            let matchNG = matchNGPost(value);
            // NG word判定 & ハイライト
            if ($post.find("span.ng_word_inline").length > 0) {
                $post.find("span.ng_word_inline").remove();
                $post.find("span.ng_word_wrapper").contents().unwrap();
                $post.find("div.message").each((i, e) => e.normalize());
            }

            $post.find("span.control_link").remove();

            if (matchNG.word) {
                // NG Word ハイライト.
                let $span = $post.find("div.message").find("span");

                $span.html(_.settings.ng.words.replaceString($span.html(), (w) => `<span class="ng_word_wrapper">${w}</span>` + createNGControlLink(true, "ng_word_inline", "NG Word", "NG Word").attr("data-word", w).prop("outerHTML")));
            }

            // あぼーん.
            $post.find(".abone").removeClass("abone");
            $post.find("span.abone_message").remove();
            if (matchNG.any()) {
                $post.addClass("abone");
                $post.find("div.meta,div.message,div.message span").addClass("abone");
                $post.find("div.message").append('<span class="abone_message"><a href="javascript:void(0)">あぼーん</a></span>');
            }

            // 制御用リンク追加.
            $post.find("span.gochutil_wrapper").contents().unwrap();
            $post.find("span.gochutil_wrapper").remove();

            let spanName = $post.find("span.name").html();
            let createCountControlLinkTag = (map, key, cls, settingKey) => (map[key] && createControlLink(cls + (map[key].length >= _.settings.app.get()[settingKey] ? " many" : ""), (map[key].indexOf(value.postId) + 1) + "/" + map[key].length.toString(), map[key].length <= 1).prop("outerHTML") || "");
            if (value.name) {
                spanName = spanName.replace(rName, "$&" + createNGControlLink(matchNG.name, "ng_name", "", "NG Name").prop("outerHTML"));
            }
            if (value.slip) {
                spanName = spanName.replace(rSlip, (match) =>
                    match
                        .replace(rKoro2, '<span class="koro2 gochutil_wrapper">$&</span>' + createNGControlLink(matchNG.koro2, "ng_koro2", "", "NG Korokoro").prop("outerHTML") + createCountControlLinkTag(koro2Map, value.koro2, "ref_koro2 count_link", "koro2ManyCount"))
                        .replace(rIp, '<span class="ip gochutil_wrapper">$&</span>' + createNGControlLink(matchNG.ip, "ng_ip", "", "NG IP").prop("outerHTML") + createCountControlLinkTag(ipMap, value.ip, "ref_ip count_link", "ipManyCount"))
                );
            }
            if (value.trip) {
                spanName = spanName.replace(rTrip, "$&" + createNGControlLink(matchNG.trip, "ng_trip", "", "NG Trip").prop("outerHTML"));
            }
            $post.find("span.name").html(spanName);

            if (value.dateAndID) {
                let spanUid = $post.find("span.uid").html().replace(value.dateAndID.id, `<span class="uid_only gochutil_wrapper">$&</span>`);
                $post.find("span.uid").html(spanUid);
                $post.find("span.uid").after(createCountControlLinkTag(idMap, value.dateAndID.id, "ref_id count_link", "idManyCount")).after(createNGControlLink(matchNG.id, "ng_id", "", "NG ID"));
            }

            $post.find("span.number").removeClass("ref_posts");
            $post.find("span.number").removeClass("many");
            $post.find("span.back-links.gochutil").remove();
            if (refPostId[value.postId] && refPostId[value.postId].length > 0) {
                $post.find("span.number").addClass("ref_posts");
                if (refPostId[value.postId].length > _.settings.app.get().refPostManyCount) {
                    $post.find("span.number").addClass("many");
                }
                $post.find("span.number").html(`<a href="javascript:void(0);">${$post.find("span.number").html()}</a>`);

                // back-links
                // <span class="back-links"><a style="font-size:0.7em;margin-left: 5px;display:inline-block;" target="_blank" data-tooltip="36" href="//egg.5ch.net/test/read.cgi/game/1649341042/36" onclick="highlightReply(36, 'hover', event);">&gt;&gt;36</a></span>
                refPostId[value.postId].forEach(pid => $post.find("div.meta").append(`<span class="back-links gochutil"><a class="href_id" href="javascript:void(0);" style="font-size:0.7em;margin-left: 5px;display:inline-block;" data-href-id="${pid}">&gt;&gt;${pid}</a></span>`));
            }

            // replylink
            $post.find("div.message a.reply_link").each((i, e) => {
                let $a = $(e);
                let replyPid = $a.attr("data-href-id");
                let backupAttr = ["href", "target", "rel"];
                if (replyPid && pidSet.has(replyPid)) {
                    backupAttr.forEach(a => !$a.attr(`data-original-${a}`) && $a.attr(`data-original-${a}`, $a.attr(a)));
                    $a.attr("href", "javascript:void(0);").removeAttr("target").removeAttr("rel").removeClass("href_id").addClass("href_id");
                } else {
                    backupAttr.forEach(a => $a.attr(a, $a.attr(`data-original-${a}`)));
                    $a.removeClass("href_id");
                }
            });

            return $post;
        }

        let popupSeq = 0;
        let nextPopupId = () => {
            return "gochutil-popup-" + (++popupSeq);
        }

        let popupStack = [];
        let timeoutHandles = {};

        let createPopup = (popupId, popupClass, $inner) => {
            let $popup = $(`<div id="${popupId}" class="popup popup-container" style="border: 1px solid rgb(51, 51, 51); position: absolute; background-color: rgb(239, 239, 239); display: block; padding: 5px;"/>`);
            $popup.append($inner);
            $popup.addClass(popupClass);

            $popup.hover(function () {
                $popup.removeClass("mouse_hover").addClass("mouse_hover");
            }, function () {
                $popup.removeClass("mouse_hover");
                checkAndClosePopup(popupId);
            });
            return $popup;
        }

        let showPopupInner = ($target, popupId, popupClass, innerContentAsync, offset) => {
            innerContentAsync($target)
                .then($inner => {
                    if ($inner && $inner.length > 0) {

                        let $popup = createPopup(popupId, popupClass, $inner);

                        let topMargin = $("nav.navbar-fixed-top").height() + 10;
                        let leftMargin = 10;
                        let maxHeight = $(window).height() - topMargin - 10;
                        let maxWidth = $(window).width() - leftMargin - 10;

                        let positioning = () => $popup.offset({
                            top: Math.min(offset.top, Math.max($(window).scrollTop() + topMargin, $(window).scrollTop() + topMargin + maxHeight - $popup.outerHeight())),
                            left: Math.min(offset.left, Math.max($(window).scrollLeft() + leftMargin, $(window).scrollLeft() + leftMargin + maxWidth - $popup.outerWidth()))
                        });
                        let sizing = () => {
                            $popup.outerHeight(Math.min($popup.outerHeight(), maxHeight));
                            $popup.outerWidth(Math.min($popup.outerWidth(), maxWidth));
                        };

                        $popup.find("img").on("load", function () {
                            positioning();
                            sizing();
                        });

                        $("body").append($popup);
                        popupStack.push(popupId)
                        positioning();

                        if ($popup.find("img").length <= 0) {
                            sizing();
                        }
                    }
                });
        }

        let last = (array) => array?.[array.length - 1];

        let createOnShowPopupHandler = (popupClass, position, innerContentAsync, showDelay) => {
            return function () {
                let $a = $(this);
                $a.removeClass("mouse_hover").addClass("mouse_hover");

                // 既に表示済み.
                let popupId = $a.attr("data-popup-id");
                if (popupId && $(`#${popupId}`).length > 0) {
                    return;
                }
                popupId = nextPopupId();
                $a.attr("data-popup-id", popupId);
                let parentId = $a.closest("div.popup-container").attr("id");
                while (parentId != last(popupStack) && popupStack.length > 0) {
                    removePopup(popupStack.pop());
                }

                let offset = position($a);

                if (offset) {
                    if (showDelay) {
                        // タイマー設定して、1秒後にポップアップ処理.
                        if (timeoutHandles[popupId]) {
                            clearTimeout(timeoutHandles[popupId]);
                        }
                        $a.addClass("backgroundwidthprogress");
                        timeoutHandles[popupId] = setTimeout(() => {
                            timeoutHandles[popupId] = undefined;
                            $a.removeClass("backgroundwidthprogress")
                            showPopupInner($a, popupId, popupClass, innerContentAsync, offset);
                        }, 1000);
                    } else {
                        // 即時ポップアップ処理.
                        if (timeoutHandles[popupId]) {
                            clearTimeout(timeoutHandles[popupId]);
                        }
                        timeoutHandles[popupId] = undefined;
                        $a.removeClass("backgroundwidthprogress");
                        showPopupInner($a, popupId, popupClass, innerContentAsync, offset);
                    }
                }
            };
        }

        let createOnPopupLinkMouseOutHandler = () => {
            return function () {
                let $a = $(this);
                $a.removeClass("mouse_hover");
                let popupId = $a.attr("data-popup-id");
                if (popupId) {
                    if (timeoutHandles[popupId]) {
                        clearTimeout(timeoutHandles[popupId]);
                    }
                    timeoutHandles[popupId] = undefined;
                    $a.removeClass("backgroundwidthprogress");

                    let $popup = $(`div#${popupId}`);
                    if ($popup.length > 0) {
                        checkAndClosePopup(popupId);
                    }
                }
            }
        };

        let checkAndClosePopup = (popupId) => setTimeout(() => checkAndClosePopupInner(popupId), 250);

        let checkAndClosePopupInner = (popupId) => {
            let $target = $(`[data-popup-id="${popupId}"]`);
            let $popup = $(`#${popupId}`);
            if ($popup.length > 0 && !$target.hasClass("mouse_hover") && !$popup.hasClass("mouse_hover") && last(popupStack) == popupId) {
                // リンクの上にマウスがなく、ポップアップの上にマウスがなく、スタックの一番上のポップアップであれば、削除.
                removePopup(popupId);
                popupStack.pop();
                if (last(popupStack)) {
                    setTimeout(() => checkAndClosePopupInner(last(popupStack)), 0);
                }
            }
        };

        let removePopup = (popupId) => {
            if (popupId) {
                $(`[data-popup-id="${popupId}"]`).removeAttr("data-popup-id");
                $(`#${popupId}`).remove();
            }
        };

        // 画像のポップアップ処理
        $("body").on("mouseover", "div.message a.image.directlink img", createOnShowPopupHandler("img_popup",
            $img => {
                let $a = $img.closest("a");
                if ($a.find("img.thumb_i").length > 0) {
                    return { top: $a.find("img.thumb_i").offset().top, left: $a.find("img.thumb_i").offset().left + $a.find("img.thumb_i").width() };
                }
            },
            async $img => $('<div class="img_container loader" />')
                .append($('<img class="popup_img" referrerpolicy="no-referrer" />').on("load", function () { $(this).closest("div.img_container").removeClass("loader") }).attr("src", $img.closest("a").attr("href")))
                .addClass(_.settings.app.get().blurImagePopup ? "blur" : "")
                .on("click", function () { $(this).removeClass("blur") })
                .append($('<div class="remove_blur">クリックでぼかし解除</div>').on("click", function () { $(this).closest("div.img_container").removeClass("blur"); }))
            , false));
        $("body").on("mouseout", "div.message a.image.directlink img", createOnPopupLinkMouseOutHandler());

        // Korokoro, ip, id のレスリストポップアップ処理
        let listPopup = (spanClass, popupClass, lister, delay = false) => {
            $("body").on("mouseover", `span.${spanClass} a`, createOnShowPopupHandler(`${popupClass} list_popup`, $a => { return { top: $a.offset().top - 15, left: $a.offset().left + $a.width() } },
                async $a => {
                    let val = getPostValue($a.closest("div.meta").parent());
                    let $container = $('<div class="list_container" />');
                    lister(val).forEach(pid => $container.append($(`div.post#${pid}`).clone()));
                    $container.find("div.post").after("<br>");
                    processPopupPost($container);
                    return $container;
                }, delay));
            $("body").on("mouseout", `span.${spanClass} a`, createOnPopupLinkMouseOutHandler());
        };
        listPopup("ref_koro2", "koro2_popup", (v) => koro2Map[v.koro2]);
        listPopup("ref_ip", "ip_popup", (v) => ipMap[v.ip]);
        listPopup("ref_id", "id_popup", (v) => idMap[v.dateAndID.id]);
        listPopup("ref_posts", "ref_post_popup", (v) => refPostId[v.postId], true);

        // あぼーんのポップアップ処理.
        let popupNgHandler = (popupClass, mouseover) => {
            return createOnShowPopupHandler(popupClass,
                $a => {
                    if (mouseover && _.settings.app.get().dontPopupMouseoverNgMsg) {
                        return;
                    }
                    return $a.offset();
                },
                async $a => {
                    let $inner = $a.closest("div.message.abone").clone().removeClass("abone");
                    $inner.find("span.abone_message").remove();
                    $inner.find("span").removeClass("abone");
                    return $inner;
                }, mouseover);
        };

        $("body").on("mouseover", "div.message.abone span.abone_message a", popupNgHandler("abone_popup", true));
        $("body").on("click", "div.message.abone span.abone_message a", popupNgHandler("abone_popup", false));
        $("body").on("mouseout", "div.message.abone span.abone_message a", createOnPopupLinkMouseOutHandler());

        // 別スレへのリンクのポップアップ処理.
        $("body").on("mouseover", "div.message a.ref_another_thread", createOnShowPopupHandler("another_thread_popup", $a => { return { top: $a.offset().top - 15, left: $a.offset().left + $a.width() } },
            $a => {
                let url = $a.attr("data-href-thread") + "1";
                return fetchHtml(url, { cache: "force-cache" })
                    .then(doc => $(doc).find("div.thread div.post:first").clone())
                    .then($p => {
                        if ($p.length == 0) {
                            return;
                        }
                        $p.find("a.reply_link").contents().unwrap();
                        $p.find("a.reply_link").remove();
                        return initializePost($p);
                    });
            }, true));
        $("body").on("mouseout", "div.message a.ref_another_thread", createOnPopupLinkMouseOutHandler());

        // reply_link, back-links のポップアップ処理.
        $("body").on("mouseover", "div.message a.reply_link, div.meta span.back-links a.href_id", createOnShowPopupHandler("ref_popup",
            $a => { return { top: $a.offset().top + ($a.hasClass("reply_link") ? - 15 : $a.height()), left: $a.offset().left + $a.width() } },
            $a => {
                let refPid = $a.attr("data-href-id");
                if (refPid) {
                    let $post = $(`div#${refPid}`).clone();
                    let p = Promise.resolve($post);
                    if ($post.length == 0) {
                        // ページ上にない.fetchする.
                        let url = threadUrl + refPid;
                        p = fetchHtml(url, { cache: "force-cache" })
                            .then(doc => $(doc).find("div.thread div.post:first").clone())
                            .then($p => processPost($p));
                    }
                    return p.then($p => processPopupPost($p));
                }
            }, false));
        $("body").on("mouseout", "div.message a.reply_link, div.meta span.back-links a.href_id", createOnPopupLinkMouseOutHandler());

        let processPopupPost = ($obj) => {
            $obj.find("div.post[id]").addBack("div.post[id]").removeAttr("id");
            $obj.find("[data-popup-id]").addBack("[data-popup-id]").removeAttr("data-popup-id");
            $obj.find(".mouse_hover").addBack(".mouse_hover").removeClass("mouse_hover");
            return $obj;
        };

        let closestPost = ($a) => $a.closest("div.post");

        let removeAllPopup = () => {
            Object.keys(timeoutHandles).forEach(k => {
                clearTimeout(timeoutHandles[k]);
                timeoutHandles[k] = undefined;
            });
            popupStack.forEach(p => $(`#${p}`).remove());
        };

        // NGの追加/削除イベント
        let controlNGEventListener = function (parser, handler, lister) {
            return async function () {
                let $a = $(this);
                let $post = closestPost($a);
                if ($post.length > 0) {
                    let value = parser($post);
                    if (value) {
                        await handler(value);
                        processPosts(lister(value));
                        removeAllPopup();
                    }
                }
            }
        }

        let controlNGWordEventListener = function (handler) {
            return async function () {
                let $a = $(this);
                let sel = window.getSelection();
                let word = sel?.isCollapsed ? undefined : sel?.getRangeAt(0).toString();
                if (sel && !sel.isCollapsed && sel.anchorNode === sel.focusNode && $(sel.anchorNode).closest("div.message").length > 0 && word && word.length > 1 && word.length < 10) {
                    await handler(word);
                    document.getSelection().removeAllRanges();
                    removeAllPopup();
                    processAllThread();
                }
            }
        }

        $("body").on("click", "span.ng_control_link.ng_name.add a", controlNGEventListener(p => getPostValue(p).name, d => _.settings.ng.names.add(d)));
        $("body").on("click", "span.ng_control_link.ng_name.remove a", controlNGEventListener(p => getPostValue(p).name, d => _.settings.ng.names.remove(d)));
        $("body").on("click", "span.ng_control_link.ng_trip.add a", controlNGEventListener(p => getPostValue(p).trip, d => _.settings.ng.trips.add(d)));
        $("body").on("click", "span.ng_control_link.ng_trip.remove a", controlNGEventListener(p => getPostValue(p).trip, d => _.settings.ng.trips.remove(d)));
        $("body").on("click", "span.ng_control_link.ng_koro2.add a", controlNGEventListener(p => getPostValue(p).koro2, d => _.settings.ng.koro2s.add(d), v => koro2Map[v]));
        $("body").on("click", "span.ng_control_link.ng_koro2.remove a", controlNGEventListener(p => getPostValue(p).koro2, d => _.settings.ng.koro2s.remove(d), v => koro2Map[v]));
        $("body").on("click", "span.ng_control_link.ng_ip.add a", controlNGEventListener(p => getPostValue(p).ip, d => _.settings.ng.ips.add(d), v => ipMap[v]));
        $("body").on("click", "span.ng_control_link.ng_ip.remove a", controlNGEventListener(p => getPostValue(p).ip, d => _.settings.ng.ips.remove(d), v => ipMap[v]));
        $("body").on("click", "span.ng_control_link.ng_id.add a", controlNGEventListener(p => getPostValue(p).dateAndID, d => _.settings.ng.dateAndIDs.add(d), v => idMap[v.id]));
        $("body").on("click", "span.ng_control_link.ng_id.remove a", controlNGEventListener(p => getPostValue(p).dateAndID, d => _.settings.ng.dateAndIDs.remove(d), v => idMap[v.id]));

        $("body").on("click", "span.ng_control_link.ng_word.add a", controlNGWordEventListener(d => _.settings.ng.words.add(d)));
        $("body").on("click", "span.ng_control_link.ng_word.remove a", controlNGWordEventListener(d => _.settings.ng.words.remove(d)));

        $("body").on("click", "span.ng_control_link.remove.ng_word_inline a", async function () {
            let $a = $(this);
            await _.settings.ng.words.remove($(this).closest("span.ng_control_link.remove.ng_word_inline").data("word"));
            document.getSelection().removeAllRanges();
            setTimeout(() => {
                removeAllPopup();
                processAllThread();
            }, 0);
        });

        // メッセージ選択字の+/-NG Word表示処理.
        $(document).on("selectionchange", function () {
            let sel = window.getSelection();
            let word = sel?.isCollapsed ? undefined : sel?.getRangeAt(0).toString();
            if (sel && !sel.isCollapsed && sel.anchorNode === sel.focusNode && $(sel.anchorNode).closest("div.message") && word && word.length > 1 && word.length < 10) {
                let $msg = $(sel.anchorNode).closest("div.message");
                if (!$msg.hasClass("selecting")) {
                    $msg.addClass("selecting");
                }
                let controlClass = _.settings.ng.words.contains(word) ? "remove" : "add";
                let reverseControlClass = !_.settings.ng.words.contains(word) ? "remove" : "add";
                if ($("div#ng_word_control").hasClass(reverseControlClass)) {
                    $("div#ng_word_control").remove();
                }
                if ($("div#ng_word_control").length == 0) {
                    $msg.append(`<div id="ng_word_control" class="${controlClass}"></div>`);
                    $("div#ng_word_control").append(createNGControlLink(_.settings.ng.words.contains(word), "ng_word", "NG Word", "NG Word"));
                }
            } else {
                $("div#ng_word_control").remove();
                $("div.message.selecting").removeClass("selecting");
            }
        });

        let lastPostId = () => parseInt(getPostId($("div.thread div.post:last")));

        let displayItems = (() => {
            var ret = {
                last: undefined,
                from: undefined,
                to: undefined,
                all: undefined,
                without1: undefined
            };
            let href = location.href;
            if (href.indexOf("?") > -1) {
                href = href.slice(0, href.indexOf("?"));
            }
            let match = href.match(/\/l([0-9]{1,3})(n|)$/)
            if (match) {
                ret.last = parseInt(match[1]);
                if (match[2] == "n") {
                    ret.without1 = true;
                }
            }
            match = href.match(/\/([0-9]{1,3}|)-([0-9]{1,3}|)(n|)$/);
            if (match) {
                if (match[1]) {
                    ret.from = parseInt(match[1]);
                }
                if (match[2]) {
                    ret.to = parseInt(match[2]);
                }
                if (match[3] == "n") {
                    ret.without1 = true;
                }
            }
            match = href.match(/.+[0-9]{4}\/(n|)$/);
            if (match) {
                ret.all = true;
            }
            return ret;
        })();

        let canAppendNewPost = () => {
            let lastPid = lastPostId();
            return (lastPid && lastPid < 1002) && (displayItems.all || (displayItems.to && displayItems.to > lastPid) || (displayItems.last && displayItems.last > 0) || (!displayItems.to && displayItems.from));
        }

        let autoloadIntervalSeconds = _.settings.app.get().autoloadIntervalSeconds;
        let controlReloadControler = () => {
            $("div.newposts span.appendnewposts").remove();
            $("div.newposts span.autoload_newposts").remove();
            if (canAppendNewPost()) {
                $("div.newposts").append(`<span class="appendnewposts"><a class="appendnewposts" href="javascript:void(0);">新着レスの取得と追加</a></span>`);
                $("div.newposts").append(`<span class="autoload_newposts"><input type="checkbox" id="autoload_newpost" /><label for="autoload_newpost">自動で新着レスの取得(<span class="seconds_remaining" style="min-width:25px;text-align:right;display:inline-block;">${autoloadIntervalSeconds}</span>秒)</label></span>`);
                $("div.newposts").append(`<span class="error_msg" style="display:block;"><span class="msg"></span></span>`);
            }
        }
        controlReloadControler();

        let fetchHtml = (url, option) => {
            return fetchInner(url, option)
                .then(response => response.arrayBuffer())
                .then(ab => new TextDecoder(document.characterSet).decode(ab))
                .catch(err => {
                    if (err.httpStatus != 500) {
                        // データなしの場合500が返ってくるので、無視.
                        throw err;
                    }
                })
                .then(html => {
                    let parser = new DOMParser();
                    return parser.parseFromString(html, "text/html");
                });
        };

        let fetchInner = (url, option) => {
            return fetch(url, option)
                .then(response => {
                    if (response.status == 200) {
                        return response;
                    } else {
                        let err = new Error(`fetch response url:${response.url} code:${response.status}`);
                        err.httpStatus = response.status;
                        throw err;
                    }
                });
        }

        let fetchDataUrl = (url) => fetchInner(url).then(response => response.blob()).then(blob => blobToDataUrl(blob));

        let blobToBase64 = async (blob) => {
            let dataUrl = await blobToDataUrl(blob);
            return dataUrl.substr(dataUrl.indexOf(',') + 1);
        };

        let blobToDataUrl = (blob) => {
            return new Promise((resolve, reject) => {
                let r = new FileReader();
                r.onload = () => resolve(r.result);
                r.onerror = (e) => reject(new Error("fail to convert base64"));
                r.onabort = (e) => reject(new Error("fail to convert base64"));
                r.readAsDataURL(blob);
            });
        };

        // 新着レスの取得と追加
        let fetching = false;

        // 新着マーク削除.
        let removeNewPostMark = () => {
            removeNewPostMarkTimeout = clearTimeout(removeNewPostMarkTimeout);
            $("div.post.new").addClass("removingnew");
            setTimeout(() => $("div.post.new.removingnew").removeClass("removingnew").removeClass("new"), 3000);
        }

        // 新着レスの取得と追加処理.
        let fetchAndAppendNewPost = () => {
            if (canAppendNewPost() && !fetching) {
                let newPid = lastPostId() + 1;
                let url = threadUrl + newPid + "-n";
                fetching = true;
                removeNewPostMark();
                showProcessingMessage();
                return fetchHtml(url, { cache: "no-cache" })
                    .then(doc => {
                        let $thread = $(doc).find("div.thread");
                        $thread.children().not("div.post").remove();
                        $thread.find("div.post").after("<br>");
                        if ($thread.find("div.post").length > 0) {
                            let postArray = [].concat($("div.thread div.post").toArray()).concat($thread.find("div.post").toArray())
                            if (!displayItems.all && ((displayItems.last && displayItems.last > 0) || (displayItems.to && displayItems.to > 0))) {
                                let start = displayItems.without1 ? 0 : 1;
                                if (displayItems.last && displayItems.last > 0 && displayItems.last + 1 + start < postArray.length) {
                                    // 最新N件よりも多いので、余剰分を削除. 実際にはN+1 or 2件が表示される(>>1(URL次第)と最新N+1件)
                                    let target = postArray.slice(start, postArray.length - displayItems.last - 1);
                                    target.forEach(p => {
                                        $(p).next("br").remove();
                                        $(p).remove();
                                    });
                                }
                                if (displayItems.to && displayItems.to > 0) {
                                    // Nまで表示で最終がオーバーしたものを削除.
                                    let target = postArray.filter(p => { let pid = getPostId($(p)); return pid && parseInt(pid) && parseInt(pid) > displayItems.to; })
                                    target.forEach(p => {
                                        $(p).next("br").remove();
                                        $(p).remove();
                                    });
                                }
                            }
                            if ($("div.thread div.post").length > 0) {
                                $("div.thread div.post:last").next("br").after($thread.html());
                            } else {
                                $("div.thread").append($thread.html());
                            }
                        }
                    })
                    .finally(() => {
                        fetching = false;
                        hideProcessingMessage();
                    });
            }
            return Promise.resolve();
        }

        let waitSecondsForAppendNewPost = _.settings.app.get().waitSecondsForAppendNewPost;
        // 新着レス取得追加ボタン処理.
        $(document).on("click", "div.newposts span.appendnewposts a", function () {
            if (!$("div.newposts span.appendnewposts").hasClass("disabled")) {
                fetchAndAppendNewPost()
                    .then(() => $("div.newposts span.error_msg span.msg").text(""))
                    .catch(e => {
                        if (e.httpStatus == 410) {
                            // gone.
                            $("div.newposts span.error_msg span.msg").text("410 GONE が応答されました。しばらく待ちましょう。");
                        }
                    })
                    .finally(() => {
                        // 10 秒利用不可.
                        document.documentElement.style.setProperty('--wait-appendnew-animation-span', `${waitSecondsForAppendNewPost}s`);
                        $("div.newposts span.appendnewposts").addClass("disabled")
                        $("div.newposts span.appendnewposts a").addClass("backgroundwidthprogress");
                        setTimeout(() => {
                            $("div.newposts span.appendnewposts").addClass("disabled_exit");
                            $("div.newposts span.appendnewposts").removeClass("disabled");
                            reflow($("div.newposts span.appendnewposts").get(0));
                            $("div.newposts span.appendnewposts a").removeClass("backgroundwidthprogress");
                            $("div.newposts span.appendnewposts").removeClass("disabled_exit");
                        }, waitSecondsForAppendNewPost * 1000);
                    });
            }
        });

        let reflow = (e) => {
            //-hack for reflow
            void e.offsetWidth;
        }

        // 自動更新処理用変数.
        let autoloadInterval = undefined;
        let unforcusFetchCount = 0;

        let countDownInterval = undefined;
        let startCountDown = () => {
            if (countDownInterval) {
                stopCountDown();
            }
            let end = new Date();
            end.setSeconds(end.getSeconds() + autoloadIntervalSeconds);
            countDownInterval = setInterval(function () {
                let secondsRemaining = Math.trunc((end.getTime() - new Date().getTime() + 500) / 1000);
                if (secondsRemaining < 0) {
                    secondsRemaining = 0;
                }
                $("div.newposts span.autoload_newposts span.seconds_remaining").text(secondsRemaining)

            }, 1000);
        }
        let stopCountDown = () => {
            if (countDownInterval) {
                clearInterval(countDownInterval);
                countDownInterval = undefined;
            }
            $("div.newposts span.autoload_newposts span.seconds_remaining").text(autoloadIntervalSeconds)
        }

        // 自動更新のチェックボックス処理.
        $(document).on("change", "div.newposts span.autoload_newposts input[type='checkbox']", function () {
            $chk = $(this);
            if ($chk.is(":checked")) {
                $("div.newposts span.error_msg span.msg").text("");
                unforcusFetchCount = 0;
                if (autoloadInterval) {
                    clearInterval(autoloadInterval);
                    stopCountDown();
                    autoloadInterval = undefined;
                }
                startCountDown();
                autoloadInterval = setInterval(() => {
                    startCountDown();
                    $("div.newposts span.autoload_newposts").removeClass("backgroundwidthprogress");
                    if (!document.hasFocus()) {
                        unforcusFetchCount++;
                    } else {
                        unforcusFetchCount = 0;
                    }
                    if (!canAppendNewPost() || unforcusFetchCount > _.settings.app.get().allowUnforcusAutoloadCount) {
                        $chk.removeAttr("checked").prop('checked', false).trigger("change");
                        if (unforcusFetchCount > _.settings.app.get().allowUnforcusAutoloadCount) {
                            $("div.newposts span.error_msg span.msg").text(`非アクティブ状態で${_.settings.app.get().allowUnforcusAutoloadCount}回ロードしたためオフにしました`);
                        }
                        return;
                    }
                    fetchAndAppendNewPost()
                        .then(() => {
                            $("div.newposts span.error_msg span.msg").text("");
                            if (!canAppendNewPost()) {
                                $chk.removeAttr("checked").prop('checked', false).trigger("change");
                            }
                        })
                        .catch(e => {
                            if (e.httpStatus = 410) {
                                // gone.
                                $chk.removeAttr("checked").prop('checked', false).trigger("change");
                                $("div.newposts span.error_msg span.msg").text("410 GONE が応答されたため、オフにしました。");
                            }
                        });
                    reflow($("div.newposts span.autoload_newposts").get(0));
                    $("div.newposts span.autoload_newposts").addClass("backgroundwidthprogress");
                }, autoloadIntervalSeconds * 1000);
                $("div.newposts span.autoload_newposts").removeClass("backgroundwidthprogress");
                document.documentElement.style.setProperty('--wait-animation-span', `${autoloadIntervalSeconds}s`);
                reflow($("div.newposts span.autoload_newposts").get(0));
                $("div.newposts span.autoload_newposts").addClass("backgroundwidthprogress");
            } else {
                if (autoloadInterval) {
                    clearInterval(autoloadInterval);
                    stopCountDown();
                    autoloadInterval = undefined;
                }
                $("div.newposts span.autoload_newposts").removeClass("backgroundwidthprogress");
            }
        });

        let hilight = (selector, lister) => {
            $(document).on("click", selector, function () {
                let $p = closestPost($(this));
                if ($p) {
                    let hilighted = $p.hasClass("highlightpost");
                    $("div.highlightpost").removeClass("highlightpost");
                    if (!hilighted) {
                        let val = getPostValue($p);
                        lister(val)?.forEach(pid => $(`div.post#${pid}`).removeClass("highlightpost").addClass("highlightpost"));
                    }
                }
            });
        }

        hilight(`div.meta span.name span.koro2`, v => koro2Map[v.koro2]);
        hilight(`div.meta span.name span.ip`, v => ipMap[v.ip]);
        hilight(`div.meta span.uid span.uid_only`, v => idMap[v.dateAndID.id]);

        // データ構築.
        let pushArrayToMap = (map, key, val) => {
            if (key) {
                if (map[key]) {
                    if (!map[key].includes(val)) {
                        map[key].push(val);
                    }
                } else {
                    map[key] = [val];
                }
            }
            return map;
        }

        let removeArrayToMap = (map, key, val) => {
            if (key && map?.[key] && map[key].includes(val)) {
                map[key].splice(map[key].indexOf(val), 1);
                if (map[key].length == 0) {
                    delete map[key];
                }
            }
            return map;
        }

        // key: id / value: [postId, postId, ...]
        let idMap = {};
        // key: korokoro / value: [postId, postId, ...]
        let koro2Map = {};
        // key: ip / value: [postId, postId, ...]
        let ipMap = {};
        // key: postId / value: [ref postId, ref postId, ...]
        let refPostId = {};
        let pidSet = new Set();

        let addRefData = ($posts) => {
            let postValues = $posts.toArray().map((p) => getPostValue($(p)));

            let tmp = $posts.filter((i, e) => !pidSet.has(getPostId($(e)))).find("div.message a.reply_link").toArray()
                .map(a => $(a))
                .map($a => { return { $a: $a, replyPid: $a.attr("data-href-id") }; });
            let replyPostIds = tmp.flatMap(a => a.replyPid ? [a.replyPid] : []);

            idMap = postValues.filter(v => !pidSet.has(v.postId)).reduce((p, c) => pushArrayToMap(p, c.dateAndID?.id, c.postId), idMap);
            koro2Map = postValues.filter(v => !pidSet.has(v.postId)).reduce((p, c) => pushArrayToMap(p, c.koro2, c.postId), koro2Map);
            ipMap = postValues.filter(v => !pidSet.has(v.postId)).reduce((p, c) => pushArrayToMap(p, c.ip, c.postId), ipMap);

            // key: postId , value: [ref postId, ref postId, ...]
            refPostId = tmp.reduce((p, c) => pushArrayToMap(p, c.replyPid, getPostId(c.$a.closest("div.post"))), refPostId);

            pidSet = postValues.reduce((p, c) => { p.add(c.postId); return p; }, pidSet);

            let getArr = (map, key) => key ? map[key] ?? [] : [];
            let related = Array.from(postValues.flatMap(v => []
                .concat(getArr(idMap, v.dateAndID?.id))
                .concat(getArr(koro2Map, v.koro2))
                .concat(getArr(ipMap, v.ip))
                .concat(getArr(refPostId, v.postId))
                .concat(replyPostIds)
                .concat([v.postId])).reduce((p, c) => p.add(c), new Set()));
            return related;
        };

        let removeRefData = ($posts) => {
            let postValues = $posts.toArray().map((p) => getPostValue($(p)));

            let tmp = $posts.filter((i, e) => !pidSet.has(getPostId($(e)))).find("div.message a.reply_link").toArray()
                .map(a => $(a))
                .map($a => { return { $a: $a, replyPid: $a.attr("data-href-id") }; })
            let replyPostIds = tmp.flatMap(a => a.replyPid ? [a.replyPid] : []);

            let getArr = (map, key) => key ? map[key] ?? [] : [];
            let related = Array.from(postValues.flatMap(v => []
                .concat(getArr(idMap, v.dateAndID?.id))
                .concat(getArr(koro2Map, v.koro2))
                .concat(getArr(ipMap, v.ip))
                .concat(getArr(refPostId, v.postId))
                .concat(replyPostIds)
                .concat([v.postId])).reduce((p, c) => p.add(c), new Set()));

            idMap = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.dateAndID?.id, c.postId), idMap);
            koro2Map = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.koro2, c.postId), koro2Map);
            ipMap = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.ip, c.postId), ipMap);

            // key: postId , value: [ref postId, ref postId, ...]
            refPostId = tmp.reduce((p, c) => removeArrayToMap(p, c.replyPid, getPostId(c.$a.closest("div.post"))), refPostId);

            pidSet = postValues.reduce((p, c) => { p.delete(c.postId); return p; }, pidSet);
            return related;
        };

        addRefData($("div.thread div.post"));

        let removeNewPostMarkTimeout;

        // 新着レス等で追加/削除したノードに対する処理.
        let newPostObserver = new MutationObserver(records => {
            let addedNodes = Array.from(records).flatMap(r => Array.from(r.addedNodes));
            let removedNodes = Array.from(records).flatMap(r => Array.from(r.removedNodes));
            let addedPosts = addedNodes.map(n => $(n)).filter($n => $n.is("div"))
                .filter($n => $n.hasClass("post"))
                .filter($n => $n.attr("id") && getPostId($n));
            let removedPosts = removedNodes.map(n => $(n)).filter($n => $n.is("div"))
                .filter($n => $n.hasClass("post"))
                .filter($n => $n.attr("id") && getPostId($n));
            let relatedPostId = Array.from(new Set([].concat(addRefData($(addedPosts.map($n => $n.get(0))))).concat(removeRefData($(removedPosts.map($n => $n.get(0)))))));
            var $addedPosts = $(addedPosts.map($p => $p.get(0)));
            $addedPosts.filter("div.post").addClass("new");
            if (_.settings.app.get().newPostMarkDisplaySeconds > 0) {
                removeNewPostMarkTimeout = setTimeout(() => removeNewPostMark(), _.settings.app.get().newPostMarkDisplaySeconds * 1000);
            }
            if ($addedPosts.length > 0) {
                let lastPid = getPostId($addedPosts.last())
                $("div.pagestats ul.menujust li:first-child").text(`${lastPid}コメント`);
                let $npb = $("div.newposts span.newpostbutton a.newpb");
                $npb.attr("href", $npb.attr("href").replace(/([0-9]{1,4})-n$/, `${lastPid}-n`));
            }
            if (_.settings.app.get().autoscrollWhenNewPostLoad && $addedPosts.length > 0) {
                $('body,html').animate({ scrollTop: $addedPosts.first().offset().top - $("nav.navbar-fixed-top").height() - 10 }, 400, 'swing');
            }
            processPosts(relatedPostId);
        });

        // 監視の開始
        newPostObserver.observe($("div.thread").get(0), { childList: true });

        // 5ch側スクリプトで余計なものが追加されたら削除する.(ほんとは追加されないようにすべき.)
        let createRemoveObserver = (filter) => new MutationObserver(records => $(Array.from(records).flatMap(r => Array.from(r.addedNodes))).filter(filter).remove());
        let removeObservers = [
            { observe: 'div.thread div.post div.message a', observer: 'div[div="thumb5ch"]:not(.gochutil)' },
            { observe: 'div.thread div.post div.meta', target: 'span.back-links:not(.gochutil)' }
        ].map(t => {
            $(t.observe).children(t.target).remove();
            let observer = createRemoveObserver(t.target);
            $(t.observe).each((i, e) => observer.observe(e, { childList: true }))
            return observer;
        });
        setTimeout(() => removeObservers.forEach(o => o.disconnect()), 10000);

        // 全Postに対して処理をする.
        processAllThread();
    };

    _.init().then(r => {
        if (!_.settings.app.get().stop) {
            if ($("div.thread div.post").length != 0) {
                // 現在この構造のHTMLしか対応してない.
                main();
            }
        }
    });
});
