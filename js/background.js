(function (global) {
    let funcs = {};
    let b;
    if (typeof browser !== 'undefined') {
        b = browser;
    } else {
        b = chrome;
    }

    funcs.coFetchHtml = async function (params, sender) {
        let resp = await fetch(params.url, params.option)
        let ab = await resp.arrayBuffer();
        let charset = resp.headers.get("content-type").match(/charset=([a-zA-Z0-9_\-]+)/)?.[1] ?? "UTF-8";
        let html = await new TextDecoder(charset).decode(ab);
        let mMeta = html.match(/<meta .*charset=([a-zA-Z0-9_\-]+)/i);
        if (mMeta && mMeta[1] != charset) {
            // HTMLのMetaタグで指定されていて、Headerのcharsetと違うので読み直し.
            html = await new TextDecoder(mMeta[1]).decode(ab);
        }
        return { html: html, status: resp.status, statusText: resp.statusText, ok: resp.ok };
    };

    b.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.function && funcs[request.function]) {
            funcs[request.function](request.params, sender)
                .then(r => sendResponse({ resolve: r }))
                .catch(e => {
                    console.error(e);
                    sendResponse({ reject: { message: e.message } });
                });
        }
        return true;
    });
}(this));
