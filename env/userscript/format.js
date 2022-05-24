// ==UserScript==
// @name         5chutil
// @namespace    5chutil
// @version      0.1.1.14
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
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @license MIT
// ==/UserScript==

var GOCHUTIL = GOCHUTIL || {};

(function (global) {
    let _ = GOCHUTIL;

    _.storage = {};
    _.env = {};
    _.$ = _.$ || jQuery?.noConflict?.(true);

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

    _.storage.clear = async () => await Promise.all((await listValues()).map(async k => await deleteValue(k)));

    //// 5chutil.css
    const gochutilcss = `
//$[[FILE:css/5chutil.css]]
`;
    //// options.html
    const optionshtml = `
//$[[FILE:html/options.html]]
`;
    //// options.js
    const optionsjs = function () {/*
//$[[FILE:js/options.js]]
*/}.toString().split(/\/\*|\*\//)[1];

    //// options.css
    const optionscss = `
//$[[FILE:css/options.css]]
`;

    let $ = _.$;
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

    //// 5chutil_inject.js
    const gochutil_injectjs = function () {/*
//$[[FILE:js/5chutil_inject.js]]
        */}.toString().split(/\/\*|\*\//)[1];

    _.injectJs = () => {
        let scr = document.createElement('script');
        scr.setAttribute('type', 'text/javascript');
        scr.innerHTML = gochutil_injectjs;
        document.documentElement?.appendChild(scr);
    }

    $(function () {
        _.addStyle($("html"), gochutilcss);

        let parser = new DOMParser();
        let doc = parser.parseFromString(optionshtml, "text/html");
        let $optionshtml = $(doc).find("html");
        $optionshtml.find("head script").remove();
        $optionshtml.find("head link").remove();

        let scr = doc.createElement("script");
        scr.setAttribute('type', 'text/javascript');
        scr.setAttribute('src', "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js");
        doc.getElementsByTagName("head")[0]?.appendChild(scr);

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
    });
}(this));

//$[[FILE:js/5chutil_common.js]]

//$[[FILE:js/5chutil.js]]