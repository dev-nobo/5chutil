(async function (global) {
    var _ = GOCHUTIL;
    _.$ = _.$ || jQuery?.noConflict?.(true);
    let $ = _.$;

    let main = () => {
        const rName = /^<b>(.*?) *<\/b>/;
        const rTrip = /(◆[./0-9A-Za-z]{8,12})/;
        const rSlip = /(\(.+? ([*A-Za-z0-9+/]{4}-[*A-Za-z0-9+/=]{4}).*?\))/;
        const rKoro2 = /([*A-Za-z0-9+/]{4}-[*A-Za-z0-9+/=]{4})/;
        const rIp = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/;
        const rUid = /^ID:([^ ]{8,16})$/;
        const rDate = /^([0-9]{4}\/[0-9]{2}\/[0-9]{2}).*$/;
        const rReplyHref = /\/([0-9]{1,3})$/;
        const rAnotherThreadHref = new RegExp(`(https?:\/\/${location.hostname.replace(".", "\.")}\/test\/read.cgi\/[^/]+\/[0-9]+\/)$`);

        const threadUrl = ($("#zxcvtypo").val().startsWith("//") ? location.protocol : "") + $("#zxcvtypo").val() + "/";

        let postValueCache = {};

        // _.injectJs();

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
            let $meta = $post.find(".meta");
            let $msg = $post.find(".message");
            let spanName = $meta.find(".name").html().replaceAll(/<a href="(.*?)">(.*?)<\/a>/g, "$2")
            let num = $meta.find(".number").text();

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

            let refPostId = $msg.find(".reply_link").toArray().map(a => {
                let match = $(a).attr("href").match(rReplyHref);
                return match && match[1];
            });

            let dateAndID = undefined;

            let mdate = $meta.find(".date").text().match(rDate);
            let muid = $meta.find(".uid").text().match(rUid);
            if (mdate && mdate.length > 0 && muid && muid.length > 0) {
                dateAndID = _.settings.ng.dateAndIDs.create(mdate[1], muid[1]);
            }

            let msg = $msg.find("span").text();

            return {
                postId: postId,
                num: num,
                name: name,
                trip: trip,
                slip: slip,
                koro2: koro2,
                ip: ip,
                dateAndID: dateAndID,
                msg: msg,
                refPostId: refPostId
            }
        }

        // 解析データの取得.
        let getPostValue = ($post) => {
            let postId = getPostId($post);
            if (!postValueCache[postId]) {
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
        let createControlLinkTag = (className, text, noLink = false, title = "") => {
            let alink = noLink ? text : `<a href="javascript:void(0)">${text}</a>`;
            let titleAttr = title ? ` title="${title}"` : "";
            return `<span class="control_link ${className}" ${titleAttr}>[${alink}]</span>`;
        }

        let updateControlLink = ($span, text, noLink = false, title = "") => {
            if (noLink) {
                $span.children("a").remove();
                $span.text(`[${text}]`);
            } else {
                if ($span.children("a").length == 0) {
                    $span.html(`[<a href="javascript:void(0)">${text}</a>]`);
                }else{
                    $span.children("a").text(`${text}`);
                }
            }
            if (title) {
                $span.attr("title", title);
            }
            return $span;
        }

        // NG制御用リンクタグ生成.
        let createNGControlLinkTag = (ng, className, displayTargetName, titleTargetName) => {
            let controlClassName = ng ? "remove" : "add";
            let displayPrefix = ng ? "-" : "+";
            if (!titleTargetName) {
                titleTargetName = displayTargetName;
            }
            return createControlLinkTag(`ng_control_link ${controlClassName} ${className}`, `${displayPrefix}${displayTargetName}`, false, `${displayPrefix}${titleTargetName}`);
        }

        let updateNGControlLink = (ng, $span, displayTargetName, titleTargetName) => {
            $span.removeClass("add").removeClass("remove").addClass(ng ? "remove" : "add")
            let displayPrefix = ng ? "-" : "+";
            if (!titleTargetName) {
                titleTargetName = displayTargetName;
            }
            return updateControlLink($span, `${displayPrefix}${displayTargetName}`, false, `${displayPrefix}${titleTargetName}`);
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
            replacePopup($(`#${getCurrentPopupIdByElem($span)}`));
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
                return $post;
            }
            let $msg = $post.find(".message");
            let $meta = $post.find(".meta");

            // direct link 化
            $msg.find("a").not(".reply_link").not(".directlink").each((i, e) => {
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

            $msg.find(".directlink").each((i, e) => {
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
            let meta = $meta.html();
            meta = meta.replace(/(<span class="name">)(.+?)(<\/span>)/, function (match, c1, c2, c3) {
                let spanName = c2;
                let m = spanName.match(/<a href="(.*?)">(.*?)<\/a>/);
                let after = "";
                if (m) {
                    let href = m[1];
                    if (!href) {
                        after = `<span class="mail"></span>`;
                    } else if (href == "mailto:sage") {
                        after = `<span class="mail">[sage]</span>`;
                    } else {
                        after = `<span class="mail"><a href="${href}">[Mail]</a></span>`;
                    }
                }
                spanName = spanName
                    .replaceAll(/<a href="(.*?)">(.*?)<\/a>/g, "$2")
                    .replaceAll(/<small>(.*?)<\/small>/g, "$1");
                return c1 + spanName + c3 + after;
            });
            $meta.html(meta);

            // reply link のリンク先のID設定.
            $msg.find(".reply_link").each((i, e) => {
                let $a = $(e);
                if (!$a.attr("data-href-id")) {
                    let match = $a.attr("href").match(rReplyHref);
                    let replyPid = match && match[1];
                    $a.attr("data-href-id", replyPid);
                }
            });

            // 別スレへのリンク.
            $msg.find("a").not(".reply_link").not(".ref_another_thread").each((i, e) => {
                let $a = $(e);
                let match = $a.attr("href")?.match(rAnotherThreadHref);
                if (match) {
                    $a.addClass("ref_another_thread");
                    $a.attr("data-href-thread", match[1]);
                }
            });

            // thumbnailer.
            $msg.find(".thumb5ch").remove();
            $msg.find(".thumbnail").remove();
            $msg.find(".directlink").each(async (i, e) => {
                let $a = $(e);
                let imgUrl = $a.attr("href");
                if (imgUrl.match(/\.(gif|jpg|jpeg|tiff|png)/i)) {
                    let b64Url = await blobToBase64(new Blob([imgUrl]));
                    let url = `https://thumb1.5ch.net/thumbnails/${location.hostname.split(".")[0]}/${b64Url.substr(b64Url.length - 250)}.png?imagelink=${encodeURIComponent(imgUrl)}`;
                    fetchDataUrl(url)
                        .then(dataUrl => {
                            $a.find('div[div="thumb5ch"]').remove();
                            let $thumbnail = $("<a>").addClass("thumbnail_gochutil").attr("href", "javascript:void(0);").attr("data-href", $a.attr("href"));
                            $thumbnail.html("").append($("<div></div>").addClass("thumb5ch gochutil").append($("<img></img>").addClass("thumb_i").attr("src", dataUrl)));
                            $a.after($thumbnail).after("<br>");
                        })
                        .then(() => replaceAllPopup())
                        .catch(err => { if (err.httpStatus != 202) console.error(err); });
                }
            });

            $post.attr("data-initialized", true);

            return $post;
        };

        if (!_.settings.app.get().popupOnClick) {
            $(document).on("click", "a.reply_link.href_id", function () { scrollToPid($(this).attr("data-href-id")); });
        }

        let scrollToPid = (pid) => {
            let $p = $(`#${pid}`);
            if (pid && $p.length > 0) {
                $('body,html').scrollLeft($p.offset().left);
                $('body,html').animate({ scrollTop: $p.offset().top - $("nav.navbar-fixed-top").height() - 10 }, 400, 'swing');
                emphasizePost(pid);
            }
        };

        let emphasizePost = (pid, duration = 3000) => {
            let $p = $(`#${pid}`);
            if (pid && $p.length > 0) {
                $p.addClass("emphasis");
                setTimeout(() => {
                    $p.addClass("removing");
                    setTimeout(() => {
                        $p.removeClass("emphasis");
                        $p.removeClass("removing");
                    }, 500);
                }, duration - 500);
            }
        };

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
        let processAllPosts = async (init = false) => processPostsInternal($(".post").toArray().map(p => $(p)), init);

        let processPosts = async (pids) => {
            let pidSet = pids?.reduce((p, c) => p.add(c), new Set());
            processPostsInternal($("[data-id]").toArray().map(p => $(p))
                .filter($p => !pidSet || pidSet.has(getPostId($p))));
        };

        let binarySearch = (array, comparer) => {
            let idx = -1, min = 0, max = array.length - 1;
            while (min <= max) {
                let mid = Math.floor((min + max) / 2);
                let result = comparer(array[mid], mid, array);
                if (result < 0) {
                    max = mid - 1;
                } else if (result > 0) {
                    min = mid + 1;
                } else {
                    idx = mid;
                    break;
                }
            }
            return idx;
        };

        let viewCenterPostComparer = () => {
            let center = $(window).scrollTop() + window.innerHeight / 2;
            let max = $(document).height();
            return ($p, i, arr) => {
                if (center > (arr?.[i + 1]?.offset()?.top ?? max)) {
                    return 1;
                } else if (center < $p.offset().top) {
                    return -1;
                } else {
                    return 0;
                }
            };
        };

        let processPostsInternal = async (array, init = false) => {
            // 頭から処理していると遅いので、画面に表示しているデータに近いものからバックグラウンドで処理をする.
            // スクロール位置と画面サイズの半分の位置にあるデータのindexとの差分の絶対値を距離としてソートし、その順に処理する.
            // (abs(screenCenter - postCenter) でソートしてもそこまで変わらなかったが、indexの方が早いため一応)
            // ポップアップは割り切って最初に処理する.(fixed の判定等面倒なので。。。)
            // ただし、リロードやブラウザバックで初期表示の場合、ブラウザが前回表示位置に自動スクロールするが、タイミングによってスクロール前に、ここに入ってしまう.
            // その場合、表示中央のデータを正しく取得できないので優先して処理するデータは前回unloadした時の画面表示していたindexと0との距離を利用する.
            let scrollTop = $(window).scrollTop();
            let unloadIndex = sessionStorage.getItem("unloadIndex") ?? -1;
            let beforeInitScroll = init && unloadIndex > 0 && scrollTop == 0;

            if (array.length > 100 && (beforeInitScroll || scrollTop > array[10].offset().top)) {
                // スクロールされているかされる前の場合は、表示中で画面中心に近いものから処理する. 遠いものは非同期で裏で処理する事になる.
                let idx = beforeInitScroll ? unloadIndex : binarySearch(array, viewCenterPostComparer());
                if (idx > -1) {
                    // .thread 配下にないのはポップアップでそれは0距離で最初に処理.
                    let distanceCalc = ($p, i) => !$p.parent().hasClass("thread") ? 0 : (beforeInitScroll ? Math.min(Math.abs(idx - i), i) : Math.abs(idx - i));
                    // let distanceCalc = ($p, i) => beforeInitScroll ? Math.min(Math.abs(idx - i), i) : Math.abs(idx - i);
                    array = array
                        .map(($p, i) => { return { distance: distanceCalc($p, i), $p: $p } })
                        .sort((l, r) => l.distance - r.distance)
                        .map(o => o.$p);
                }
            }

            const immidiateProcCount = 20;
            if (array.length > immidiateProcCount) {
                // とりあえずの表示用にある程度だけ同期実行してしまう. 残りは非同期で裏で処理.
                array.slice(0, immidiateProcCount).forEach(processPost);
                array = array.slice(immidiateProcCount);
            }

            let promises = array.map($p => new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        resolve(processPost($p));
                    } catch (err) {
                        reject(err);
                    }
                }, 0);
            }));

            return Promise.all(promises)
                .catch(error => console.error(error))
                .then(() => onScrollInEmbedContents())
                ;
        }

        // 投稿に対する処理.
        let processPost = ($post) => {
            initializePost($post);

            // Parse済みデータ取得.
            let value = getPostValue($post);

            let $msg = $post.children(".message");
            let $meta = $post.children(".meta");

            // NG判定.
            let matchNG = matchNGPost(value);
            // NG word判定 & ハイライト
            if ($post.find(".ng_word_inline").length > 0) {
                $post.find(".ng_word_inline").remove();
                $post.find(".ng_word_wrapper").contents().unwrap();
                $msg.each((i, e) => e.normalize());
            }

            $post.find(".abone").removeClass("abone");
            $post.find(".abone_message").remove();

            if (matchNG.word) {
                // NG Word ハイライト.
                let $span = $msg.find("span");
                $span.html(_.settings.ng.words.replaceString($span.html(), (w) => `<span class="ng_word_wrapper">${w}</span>` + $(createNGControlLinkTag(true, "ng_word_inline", "NG Word", "NG Word")).attr("data-word", w).prop("outerHTML")));
            }

            // あぼーん.
            if (matchNG.any()) {
                $post.addClass("abone");
                $post.find(".meta,.message,.message span").addClass("abone");
                $post.find(".message").append('<span class="abone_message"><a href="javascript:void(0)">あぼーん</a></span>');
            }

            // 制御用リンク追加.
            let createCountControlLinkTag = (map, key, cls, settingKey) => (map[key] && createControlLinkTag(cls + (map[key].length >= _.settings.app.get()[settingKey] ? " many" : ""), (map[key].indexOf(value.postId) + 1) + "/" + map[key].length.toString(), map[key].length <= 1) || "");
            let updateCountControlLink = (map, key, $span, settingKey) => {
                if (map[key]) {
                    updateControlLink($span, (map[key].indexOf(value.postId) + 1) + "/" + map[key].length.toString(), map[key].length <= 1);
                    map[key].length >= _.settings.app.get()[settingKey] ? $span.hasClass("many") || $span.addClass("many") : $span.removeClass("many");
                }
            };

            if ($meta.attr("data-initialized")) {
                // ヘッダーは別途編集される事があるので、更新時は再生成は避ける.
                updateNGControlLink(matchNG.name, $meta.find(".ng_name"), "", "NG Name");
                updateNGControlLink(matchNG.koro2, $meta.find(".ng_koro2"), "", "NG Korokoro");
                updateNGControlLink(matchNG.ip, $meta.find(".ng_ip"), "", "NG IP");
                updateNGControlLink(matchNG.trip, $meta.find(".ng_trip"), "", "NG Trip");
                updateNGControlLink(matchNG.id, $meta.find(".ng_id"), "", "NG ID");

                value.koro2 && updateCountControlLink(koro2Map, value.koro2, $meta.find(".ref_koro2.count_link"), "koro2ManyCount");
                value.ip && updateCountControlLink(ipMap, value.ip, $meta.find(".ref_ip.count_link"), "ipManyCount");
                value.dateAndID && updateCountControlLink(idMap, value.dateAndID.id, $meta.find(".ref_id.count_link"), "idManyCount");

                if (refPostId[value.postId] && refPostId[value.postId].length > 0) {
                    let $span = $meta.find(".ref_posts.count_link");
                    updateControlLink($span, `REF(${refPostId[value.postId].length})`);
                    refPostId[value.postId].length >= _.settings.app.get().refPostManyCount ? $span.hasClass("many") || $span.addClass("many") : $span.removeClass("many");
                } else {
                    $meta.find(".ref_posts.count_link").remove();
                }
            } else {
                // パフォーマンスのため、div.meta は htmlを直接書き換えて、DOMの更新を一度で行う.
                let meta = $meta.html();
                meta = meta.replace(/(<span class="name">)(.+?)(<\/span>)/, function (match, c1, c2, c3) {
                    let spanName = c2;
                    if (value.name) {
                        spanName = spanName.replace(rName, "$&" + createNGControlLinkTag(matchNG.name, "ng_name", "", "NG Name"));
                    }
                    if (value.slip) {
                        spanName = spanName.replace(rSlip, (match) =>
                            match
                                .replace(rKoro2, '<span class="koro2 gochutil_wrapper">$&</span>' + createNGControlLinkTag(matchNG.koro2, "ng_koro2", "", "NG Korokoro") + createCountControlLinkTag(koro2Map, value.koro2, "ref_koro2 count_link", "koro2ManyCount"))
                                .replace(rIp, '<span class="ip gochutil_wrapper">$&</span>' + createNGControlLinkTag(matchNG.ip, "ng_ip", "", "NG IP") + createCountControlLinkTag(ipMap, value.ip, "ref_ip count_link", "ipManyCount"))
                        );
                    }
                    if (value.trip) {
                        spanName = spanName.replace(rTrip, "$&" + createNGControlLinkTag(matchNG.trip, "ng_trip", "", "NG Trip"));
                    }
                    return c1 + spanName + c3;
                });

                if (value.dateAndID) {
                    meta = meta.replace(/(<span class="uid">)(.+?)(<\/span>)/, function (match, c1, c2, c3) {
                        let spanUid = c2.replace(value.dateAndID.id, `<span class="uid_only gochutil_wrapper">$&</span>`);
                        return c1 + spanUid + c3 + createNGControlLinkTag(matchNG.id, "ng_id", "", "NG ID") + createCountControlLinkTag(idMap, value.dateAndID.id, "ref_id count_link", "idManyCount");
                    });
                }

                if (refPostId[value.postId] && refPostId[value.postId].length > 0) {
                    meta += createControlLinkTag("ref_posts count_link" + (refPostId[value.postId].length >= _.settings.app.get().refPostManyCount ? " many" : ""), `REF(${refPostId[value.postId].length})`);
                }
                $meta.html(meta);
                $meta.attr("data-initialized", "true");
            }

            // replylink
            $msg.find(".reply_link").each((i, e) => {
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

        // ポップアップ制御
        let popupSeq = 0;
        let nextPopupId = () => "gochutil-popup-" + (++popupSeq);

        let timeoutHandles = {};

        // ポップアップ要素作成.
        let createPopup = (popupId, parentPopupId, popupClass, $inner, option) => {
            let $popup = $(`<div id="${popupId}" class="popup popup-container"/>`).attr("data-parent-popup-id", parentPopupId);
            let $header = $(`<div class="popup_header"><span class="left"></span><span class="right"></span></div>`);
            let $headerL = $header.find(".left");
            let $headerR = $header.find(".right");
            let needHeader = false;
            if (option?.["title"]) {
                $headerL.append($(`<span class="popup_title"></span>`).text(option["title"]));
                needHeader = true
            }
            if (option?.["pinnable"]) {
                $popup.data("pin-func", () => {
                    $popup.addClass("pinned").addClass("moveable").addClass("resizeable").removeAttr("data-parent-popup-id");
                    $headerR.find(".popup_pin").hide();
                    $headerR.find(".popup_unpin").show();
                    $headerR.find(".header_fix").show();
                    _.settings.app.get().fixOnPinned && $popup.data("fix-func")?.();
                });
                $popup.data("unpin-func", () => {
                    $popup.removeClass("pinned").removeClass("moveable").removeClass("resizeable").attr("data-parent-popup-id", parentPopupId);
                    $headerR.find(".popup_pin").show();
                    $headerR.find(".popup_unpin").hide();
                    $headerR.find(".header_fix").hide();
                    $popup.data("unfix-func")?.();
                });
                $popup.data("togglePin-func", () => $popup.data($popup.hasClass("pinned") ? "unpin-func" : "pin-func")());
                $headerR.append($(createControlLinkTag("popup_pin", "Pin")).on("click", () => $popup.data("pin-func")()));
                $headerR.append($(createControlLinkTag("popup_unpin", "Unpin")).on("click", () => $popup.data("unpin-func")()));
                $popup.addClass("pinnable")
                $popup.data("unpin-func")();
                needHeader = true

                if (option?.["fixable"]) {
                    let $headerFix = $(`<span class="header_fix"></span>`);
                    $headerR.prepend($headerFix);
                    $popup.data("fix-func", () => {
                        $popup.css("position", "fixed");
                        $popup.addClass("fixed").offset({ top: $popup.offset().top - $(window).scrollTop(), left: $popup.offset().left - $(window).scrollLeft() })
                        $headerFix.find(".popup_fix").hide();
                        $headerFix.find(".popup_unfix").show();
                    });
                    $popup.data("unfix-func", () => {
                        $popup.css("position", "absolute");
                        $popup.removeClass("fixed").offset({ top: $popup.offset().top + $(window).scrollTop(), left: $popup.offset().left + $(window).scrollLeft() })
                        $headerFix.find(".popup_fix").show();
                        $headerFix.find(".popup_unfix").hide();
                    });
                    $popup.data("toggleFix-func", () => $popup.data($popup.hasClass("fixed") ? "unfix-func" : "fix-func")());
                    $headerFix.append($(createControlLinkTag("popup_fix", "Fix")).on("click", () => $popup.data("fix-func")()));
                    $headerFix.append($(createControlLinkTag("popup_unfix", "Unfix")).on("click", () => $popup.data("unfix-func")()));
                    $popup.addClass("fixable");
                    $popup.data("unfix-func")();
                    $headerFix.hide();
                }
            }
            if (needHeader) {
                $popup.append($header);
                $header.on("mousedown", function (e) {
                    if ($popup.hasClass("moveable")) {
                        $popup.addClass("moving");
                        let mousedownEvent = e;
                        let pos = $popup.offset();
                        $(document).off("mousemove");
                        $(document).on("mousemove", function (e) {
                            $popup.offset({ left: pos.left + e.pageX - mousedownEvent.pageX, top: pos.top + e.pageY - mousedownEvent.pageY });
                        });
                    }
                });
                $header.on("mouseup", function (e) {
                    $(document).off("mousemove");
                    $popup.removeClass("moving");
                });
            }
            $popup.append($(`<div class="innerContainer"></div>`).append($inner));
            $popup.addClass(popupClass);

            $popup.hover(function () {
                $popup.removeClass("mouse_hover").addClass("mouse_hover");
            }, function () {
                $popup.removeClass("mouse_hover");
                checkAndClosePopup(popupId);
            });
            return $popup;
        }

        let getParentPopupId = popupId => $(`#${popupId}`).attr("data-parent-popup-id");
        let getCurrentPopupIdByElem = $e => $e.closest("div.popup-container").attr("id") ?? "popup-root";
        let getChildPopupIds = popupId => $(`[data-parent-popup-id="${popupId}"]`).map((i, e) => $(e).attr("id")).toArray() ?? [];
        let getDescendantPopupIds = popupId => getChildPopupIds(popupId).flatMap(pid => [pid].concat(getDescendantPopupIds(pid)));

        // ポップアップの表示処理.
        let showPopupInner = async ($target, popupId, popupClass, innerContentAsync, fixedPos) => {

            let ret = await innerContentAsync($target)
            let $inner = ret?.["inner"] || ret;
            let popupOption = ret?.["option"];

            let parentId = getCurrentPopupIdByElem($target);
            // 下位階層のPopup以外は閉じてしまう.
            getDescendantPopupIds(parentId)
                .forEach(pid => removePopup(pid));

            if ($inner && $inner.length > 0) {

                let $popup = createPopup(popupId, parentId, popupClass, $inner, popupOption);

                let topMargin = $("nav.navbar-fixed-top").height() + 10;
                let leftMargin = 10;
                let maxHeight = $(window).height() - topMargin - 10;
                let maxWidth = $(window).width() - leftMargin - 10;

                let place = () => {
                    if (fixedPos) {
                        $popup.offset(fixedPos($target));
                    } else {
                        let to = $target.offset();
                        let left = to.left - $(window).scrollLeft(),
                            right = left + $target.width(),
                            top = to.top - $(window).scrollTop(),
                            bottom = top + $target.height();
                        let pw = $popup.outerWidth(),
                            ph = $popup.outerHeight();
                        // リンクタグより右の幅より小さい, リンクタグより左の幅より小さい, リンクタグ含めて右の幅より小さい, リンクタグ含めて左の幅より小さい, その他 の場合でそれぞれ位置決定. 上下も同様.
                        let widthPat = [
                            { match: pw < maxWidth + leftMargin - right, freeY: true, left: right },
                            { match: pw < left - leftMargin, freeY: true, left: left - pw },
                            { match: pw < maxWidth + leftMargin - left, freeY: false, left: left },
                            { match: pw < right - leftMargin, freeY: false, left: right - pw },
                            { match: true, freeY: false, left: leftMargin + maxWidth - pw }];
                        let x = widthPat.find(w => w.match);
                        let heightPat = [
                            { match: ph < maxHeight + topMargin - bottom, freeX: true, top: bottom, coordinateV: -1 },
                            { match: ph < top - topMargin, freeX: true, top: top - ph, coordinateV: 1 },
                            { match: ph < maxHeight + topMargin - top, freeX: false, top: top },
                            { match: ph < bottom - topMargin, freeX: false, top: bottom - ph },
                            { match: true, freeX: false, top: topMargin + maxHeight - ph }];
                        let y = heightPat.find(h => h.match);
                        let po = { top: y.top + $(window).scrollTop(), left: x.left + $(window).scrollLeft() };
                        if (x.freeY && y.freeX) {
                            // 上下ともに自由な場合には、Y位置を微調整.
                            po.top += y.coordinateV * ($target.height() + (ph > 40 ? 15 : 0));
                        }
                        $popup.offset(po);
                    }
                };
                let size = () => {
                    $popup.css("width", "").css("height", "");
                    $popup.outerHeight(Math.min($popup.outerHeight(), maxHeight));
                    $popup.outerWidth(Math.min($popup.outerWidth(), maxWidth));
                };
                let autoSize = () => {
                    $popup.css("width", "").css("height", "");
                };

                $popup.find("img").on("load", function () {
                    size();
                    place();
                });

                $("body").append($popup);
                $target.addClass("popupping");

                $popup.data("place-func", place);
                $popup.data("size-func", size);
                $popup.data("autoSize-func", autoSize);

                $target.trigger("showPopup");

                if ($popup.find("img").length <= 0) {
                    size();
                }
                place();
            }
        }

        // ポップアップ表示ハンドラの生成. onmousehover等の引数となる関数を生成する.
        let createOnShowPopupHandler = (popupClass, innerContentAsync, showDelay, fixedPos) => {
            return async function () {
                await initProcessPostsPromise;
                let $a = $(this);
                $a.removeClass("mouse_hover").addClass("mouse_hover");

                // 既に表示済み.
                let popupId = $a.attr("data-popup-id");
                if (popupId && $(`#${popupId}`).length > 0) {
                    return;
                }
                popupId = nextPopupId();
                $a.attr("data-popup-id", popupId);

                if (showDelay) {
                    // タイマー設定して、1秒後にポップアップ処理.
                    if (timeoutHandles[popupId]) {
                        clearTimeout(timeoutHandles[popupId]);
                    }
                    $a.addClass("backgroundwidthprogress");
                    timeoutHandles[popupId] = setTimeout(() => {
                        timeoutHandles[popupId] = undefined;
                        $a.removeClass("backgroundwidthprogress")
                        showPopupInner($a, popupId, popupClass, innerContentAsync, fixedPos);
                    }, 1000);
                } else {
                    // 即時ポップアップ処理.
                    if (timeoutHandles[popupId]) {
                        clearTimeout(timeoutHandles[popupId]);
                    }
                    timeoutHandles[popupId] = undefined;
                    $a.removeClass("backgroundwidthprogress");
                    showPopupInner($a, popupId, popupClass, innerContentAsync, fixedPos);
                }
            };
        }

        let createOnPinPopupHandler = () => {
            return function () {
                let $a = $(this);
                let $popup = $(`#${$a.attr("data-popup-id")}`);
                if ($popup.length > 0) {
                    $popup.data("togglePin-func")?.();
                    if (_.settings.app.get().closeOtherPopupOnClick) {
                        removeAllPopup(true, (i, e) => $(e).attr("id") != $a.attr("data-popup-id"));
                    }
                } else {
                    $a.off("showPopup").on("showPopup", () => {
                        $(`#${$a.attr("data-popup-id")}`).data("togglePin-func")?.();
                        if (_.settings.app.get().closeOtherPopupOnClick) {
                            removeAllPopup(true, (i, e) => $(e).attr("id") != $a.attr("data-popup-id"));
                        }
                    });
                }
            };
        };

        // ポップアップ表示リンクのマウスアウトハンドラ.
        let createOnPopupLinkMouseOutHandler = () => {
            return async function () {
                await initProcessPostsPromise;
                let $a = $(this);
                setTimeout(function () {
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
                }, 0);
            }
        };

        // ポップアップを閉じれるかチェックして可能なら閉じる
        let closePopupDelay = 250;
        let checkAndClosePopup = (popupId) => {
            setTimeout(() => checkAndClosePopupInner(popupId), closePopupDelay);
        }

        let checkAndClosePopupInner = (popupId) => {
            let $target = $(`[data-popup-id="${popupId}"]`);
            let $popup = $(`#${popupId}`);
            let children = getChildPopupIds(popupId);
            let parent = getParentPopupId(popupId);

            if ($popup.length > 0 && !$target.hasClass("mouse_hover") && !$popup.hasClass("mouse_hover") && children.length == 0) {
                // リンクの上にマウスがなく、ポップアップの上にマウスがなく、スタックの一番上かスタック外のポップアップであれば、削除.
                removePopup(popupId);
                if (parent) {
                    setTimeout(() => checkAndClosePopupInner(parent), 0);
                }
            }
        };

        // 画像のポップアップ処理
        let imgPopup = (selector, popupClass) => {
            let type = _.settings.app.get().popupOnClick ? "click" : "mouseover";
            $("body").on(type, selector, createOnShowPopupHandler(popupClass,
                async $img => ({
                    inner: $('<div class="img_container loader" />')
                        .append($('<img class="popup_img" referrerpolicy="no-referrer" />').on("load", function () { $(this).closest("div.img_container").removeClass("loader") }).attr("src", $img.closest("a").attr("data-href")))
                        .addClass(_.settings.app.get().blurImagePopup ? "blur" : "")
                        .on("click", function () { $(this).removeClass("blur") })
                        .append($('<div class="remove_blur">クリックでぼかし解除</div>').on("click", function () { $(this).closest("div.img_container").removeClass("blur"); })),
                    option: _.settings.app.get().pinnablePopup ? { "title": "Image", pinnable: true, fixable: true } : {}
                })
                , false));
            $("body").on("click", selector, createOnPinPopupHandler());
            $("body").on("mouseout", selector, createOnPopupLinkMouseOutHandler());
        };
        imgPopup("div.message a.thumbnail_gochutil img", "img_popup");

        // Korokoro, ip, id, 参照レス のレスリストポップアップ処理
        let listPopup = (selector, popupClass, lister, popupTyper, processContainer) => {
            let type = _.settings.app.get().popupOnClick ? "click" : "mouseover";
            $("body").on(type, selector, createOnShowPopupHandler(`${popupClass} list_popup`,
                async $a => {
                    // 親Popupと同タイプの場合にはそのメッセージを表示.
                    let parentTypeId = $a.closest(".list_container").data("popup-type-id");
                    let val = getPostValue($a.closest("div.meta").parent());
                    let typeId = popupTyper(val);
                    if (parentTypeId == typeId) {
                        return $("<div>現在のポップアップと同じです</div>");
                    }
                    let $container = $('<div class="list_container" />');
                    $container.data("popup-type-id", typeId);
                    lister(val).forEach(pid => $container.append($(`div.post#${pid}`).clone()));
                    $container.find("div.post").after("<br>");
                    processContainer($container, val);
                    $container.find("div.post").each((i, e) => appendScrollOwn($(e)));
                    processPopupPost($container);
                    return {
                        inner: $container,
                        option: _.settings.app.get().pinnablePopup ? { "title": typeId, pinnable: true, fixable: true } : {}
                    };
                }, false));
            $("body").on("click", selector, createOnPinPopupHandler());
            $("body").on("mouseout", selector, createOnPopupLinkMouseOutHandler());
        };

        let appendScrollOwn = ($p) => $p && $p.children(".meta").prepend(createControlLinkTag("scrollOwn", ">>"));
        $("body").on("click", ".scrollOwn a", function () {
            let pid = getPostId($(this).closest(".post"));
            scrollToPid(pid);
            emphasizePost(pid);
        });

        let appendChildrenPosts = ($p, lister, ancestors) => {
            let v = getPostValue($p);
            let children = lister(v)?.filter(pid => !ancestors.has(pid));
            if (children && !ancestors.has(v.postId)) {
                ancestors.add(v.postId);
                let $container = $("<div>").addClass("childcontents");
                let $childPosts = $("<div>").addClass("childposts");
                $container.append($("<div>").addClass("indent"));
                $container.append($childPosts);
                children.forEach(pid => {
                    let $child = $(`div.post#${pid}`).clone();
                    appendChildrenPosts($child, lister, ancestors);
                    $childPosts.append($child).append("<br>");
                });
                $p.append($container);
                ancestors.delete(v.postId);
            }
        };

        listPopup("span.ref_koro2 a", "koro2_popup", (v) => koro2Map[v.koro2], v => `SLIP(Korokoro2) : ${v.koro2}`, $c => $c.find("span.koro2.gochutil_wrapper").addClass("ref_mark"));
        listPopup("span.ref_ip a", "ip_popup", (v) => ipMap[v.ip], v => `SLIP(IP) : ${v.ip}`, $c => $c.find("span.ip.gochutil_wrapper").addClass("ref_mark"));
        listPopup("span.ref_id a", "id_popup", (v) => idMap[v.dateAndID.id], v => `ID : ${v.dateAndID.id}`, $c => $c.find("span.uid_only.gochutil_wrapper").addClass("ref_mark"));
        listPopup("span.ref_posts a", "ref_post_popup", (v) => refPostId[v.postId], v => `Ref : >>${v.postId}`, ($c, v) => {
            $c.find(`a.reply_link.href_id[data-href-id="${v.postId}"]`).addClass("ref_mark");
            $c.find(".post").each((i, e) => {
                let $p = $(e);
                let ancestors = new Set();
                appendChildrenPosts($p, v => refPostId[v.postId], ancestors);
                // 参照リンクのハイライト.
                $p.find(`a.reply_link.href_id`).each((i, e) => {
                    $l = $(e);
                    let refPid = getPostId($l.closest("div.post").parent().closest("div.post"));
                    if ($l.attr("data-href-id") == refPid) {
                        $l.addClass("ref_mark");
                    }
                });
            });
            // 開閉処理.
            $c.find("div.indent").closest(".post").children(".childcontents").find(".indent").append(createControlLinkTag("ref_expand", "閉", false, "Expand / Collapse Ref Posts"))
            let $expandLink = $c.find("span.ref_expand a");
            $expandLink.addClass("expand");

            if (!_.settings.app.get().expandRefPosts) {
                $expandLink.text("開");
                $expandLink.removeClass("expand");
                $c.find(".childposts").css("display", "none");
            }
        });

        $("body").on("click", "span.ref_expand a", function () {
            if ($(this).hasClass("expand")) {
                let tmp = closePopupDelay;
                closePopupDelay = 2000;
                $(this).closest("div.post").children(".childcontents").children(".childposts").css("display", "none");
                setTimeout(() => closePopupDelay = tmp, 0);
                $(this).text("開");
                $(this).removeClass("expand");
            } else {
                $(this).closest("div.post").children(".childcontents").children(".childposts").css("display", "block");
                $(this).text("閉");
                $(this).addClass("expand");
            }
            replacePopup($(`#${getCurrentPopupIdByElem($(this))}`));
        });

        // reply_link のポップアップ処理.
        let refLinkPopup = (selector, popupClass) => {
            let type = _.settings.app.get().popupOnClick ? "click" : "mouseover";
            $("body").on(type, selector, createOnShowPopupHandler(popupClass,
                async $a => {
                    let refPid = $a.attr("data-href-id");
                    if ($a.hasClass("ref_mark")) {
                        // ポップアップでマーク付きの場合は親コメントなので、その旨を表示する.
                        return $("<div>参照先親投稿です</div>");
                    }
                    if (refPid) {
                        let $post = $(`#${refPid}`).clone();
                        appendScrollOwn($post);
                        if ($post.length == 0) {
                            // ページ上にない.fetchする.
                            let url = threadUrl + refPid;
                            $post = await fetchHtml(url, { cache: "force-cache" })
                                .then(doc => $(doc).find("div.thread div.post:first").clone())
                                .then($p => processPost($p));
                        }
                        $post = processPopupPost($post);
                        return {
                            inner: $post,
                            option: _.settings.app.get().pinnablePopup ? { title: `>>${refPid}`, pinnable: true, fixable: true } : {}
                        };
                    }
                }, false));
            if (_.settings.app.get().popupOnClick) {
                $("body").on("click", selector, createOnPinPopupHandler());
            }
            $("body").on("mouseout", selector, createOnPopupLinkMouseOutHandler());
        };
        refLinkPopup("div.message a.reply_link", "ref_popup");

        $a => { return { top: $a.offset().top - 15, left: $a.offset().left + $a.width() } }
        // あぼーんのポップアップ処理.
        let ngPopup = (selector, popupClass) => {
            let popupNgHandler = (popupClass, delay) => {
                return createOnShowPopupHandler(popupClass,
                    async $a => {
                        let $inner = $a.closest("div.message.abone").clone().removeClass("abone");
                        $inner.find("span.abone_message").remove();
                        $inner.find("span").removeClass("abone");
                        return $inner;
                    }, delay, $a => $a.offset());
            };
            if (!_.settings.app.get().dontPopupMouseoverNgMsg && !_.settings.app.get().popupOnClick) {
                $("body").on("mouseover", selector, popupNgHandler(popupClass, true));
            }
            $("body").on("click", selector, popupNgHandler(popupClass, false));
            $("body").on("mouseout", selector, createOnPopupLinkMouseOutHandler());
        };
        ngPopup("div.message.abone span.abone_message a", "abone_popup")

        // 別スレへのリンクのポップアップ処理.
        let refLinkAnotherThreadPopup = (selector, popupClass) => {
            if (_.settings.app.get().popupOnClick) {
                return;
            }
            $("body").on("mouseover", selector, createOnShowPopupHandler(popupClass,
                $a => {
                    let url = new URL($a.attr("data-href-thread") + "1");
                    if (url.protocol != location.protocol) {
                        url.protocol = location.protocol;
                    }
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
            $("body").on("mouseout", selector, createOnPopupLinkMouseOutHandler());
        }
        refLinkAnotherThreadPopup("div.message a.ref_another_thread", "another_thread_popup");

        // 投稿データのポップアップ前処理. 不要なデータを削除する. (ポップアップ制御のクラスや属性や一時的なクラス等)
        let processPopupPost = ($obj) => {
            $obj.find("div.post[id]").addBack("div.post[id]").removeAttr("id");
            $obj.find("[data-popup-id]").addBack("[data-popup-id]").removeAttr("data-popup-id");
            $obj.find(".mouse_hover").addBack(".mouse_hover").removeClass("mouse_hover");
            $obj.find(".post.emphasis").addBack(".post.emphasis").removeClass("emphasis");
            $obj.find(".post.new").addBack(".post.new").removeClass("new");
            $obj.find(".popupping").addBack(".popupping").removeClass("popupping");
            return $obj;
        };

        let closestPost = ($a) => $a.closest("div.post");

        // ポップアップを削除.
        let removeAllPopup = (pinned = false, filter = undefined) => {
            Object.keys(timeoutHandles).forEach(k => {
                clearTimeout(timeoutHandles[k]);
                timeoutHandles[k] = undefined;
            });
            let $popups = $("div.popup-container");
            if (!pinned) {
                $popups = $popups.not("pinned");
            }
            if (filter) {
                $popups = $popups.filter(filter);
            }
            $popups.map((i, e) => $(e).attr("id")).toArray().forEach(id => removePopup(id, pinned));
        };
        let removePopup = (popupId, pinned = false) => {
            if (popupId && (pinned || !$(`#${popupId}`).hasClass("pinned"))) {
                // Pinされているものは残す. stack上から消えても残す.
                $(`[data-popup-id="${popupId}"]`).removeClass("popupping").removeAttr("data-popup-id");
                $(`#${popupId}`).remove();
            }
        };

        // ポップアップを再配置.
        let replaceAllPopup = () => $("div.popup-container").each((i, e) => replacePopup($(e, true)));
        let replacePopup = ($popup, fixed = false) => {
            if ($popup && $popup.length > 0) {
                let scrollTop = $popup.scrollTop();
                let scrollLeft = $popup.scrollLeft();
                $popup.data("size-func")?.();
                if (fixed || !$popup.hasClass("fixed")) {
                    $popup.data("place-func")?.();
                }
                $popup.scrollTop(scrollTop);
                $popup.scrollLeft(scrollLeft);
            }
        }

        // NGの追加/削除イベント
        let controlNGEventListener = function (parser, handler, lister) {
            return async function () {
                let $a = $(this);
                let $post = closestPost($a);
                if ($post.length > 0) {
                    let value = parser($post);
                    if (value) {
                        await handler(value);
                        processPosts(lister && lister(value));
                        removeAllPopup();
                    }
                }
            }
        }

        let controlNGWordEventListener = function (handler) {
            return async function () {
                let sel = window.getSelection();
                let word = sel?.isCollapsed ? undefined : sel?.getRangeAt(0).toString();
                if (sel && !sel.isCollapsed && sel.anchorNode === sel.focusNode && $(sel.anchorNode).closest("div.message").length > 0 && word && word.length > 1 && word.length < 10) {
                    await handler(word);
                    document.getSelection().removeAllRanges();
                    removeAllPopup();
                    processAllPosts();
                }
            }
        }

        // +NG イベント登録.
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
            await _.settings.ng.words.remove($(this).closest("span.ng_control_link.remove.ng_word_inline").data("word"));
            document.getSelection().removeAllRanges();
            setTimeout(() => {
                removeAllPopup();
                processAllPosts();
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
                    $("div#ng_word_control").append(createNGControlLinkTag(_.settings.ng.words.contains(word), "ng_word", "NG Word", "NG Word"));
                }
            } else {
                $("div#ng_word_control").remove();
                $("div.message.selecting").removeClass("selecting");
            }
        });

        let lastPostId = () => parseInt(getPostId($("div.thread div.post:last")));

        // URLで最新N件表示やn-N表示の判定.
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
            match = href.match(/.+[0-9]{4}\/?(n|)$/);
            if (match) {
                ret.all = true;
            }
            return ret;
        })();

        // 新着投稿の取得可否.
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

        // データのフェッチ.
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
            $("div.post.new").addClass("removing");
            setTimeout(() => $("div.post.new.removing").removeClass("removing").removeClass("new"), 3000);
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
                            $("div.newposts span.error_msg span.msg").text(`非アクティブ状態で${_.settings.app.get().allowUnforcusAutoloadCount}回ロードしたため自動レス取得をオフにしました`);
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

        // ハイライト処理.
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

            idMap = postValues.filter(v => !pidSet.has(v.postId)).reduce((p, c) => pushArrayToMap(p, c.dateAndID?.id, c.postId), idMap);
            koro2Map = postValues.filter(v => !pidSet.has(v.postId)).reduce((p, c) => pushArrayToMap(p, c.koro2, c.postId), koro2Map);
            ipMap = postValues.filter(v => !pidSet.has(v.postId)).reduce((p, c) => pushArrayToMap(p, c.ip, c.postId), ipMap);

            // key: postId , value: [ref postId, ref postId, ...]

            refPostId = postValues.filter(v => !pidSet.has(v.postId))
                .flatMap(v => v.refPostId.map(r => { return { pid: v.postId, refPid: r } }))
                .reduce((p, c) => pushArrayToMap(p, c.refPid, c.pid), refPostId);

            pidSet = postValues.reduce((p, c) => { p.add(c.postId); return p; }, pidSet);

            let getArr = (map, key) => key ? map[key] ?? [] : [];
            let related = Array.from(postValues.flatMap(v => []
                .concat(getArr(idMap, v.dateAndID?.id))
                .concat(getArr(koro2Map, v.koro2))
                .concat(getArr(ipMap, v.ip))
                .concat(getArr(refPostId, v.postId))
                .concat(v.refPostId)
                .concat([v.postId]))
                .reduce((p, c) => p.add(c), new Set()));
            return related;
        };

        let removeRefData = ($posts) => {
            let postValues = $posts.toArray().map((p) => getPostValue($(p)));

            let getArr = (map, key) => key ? map[key] ?? [] : [];
            let related = Array.from(postValues.flatMap(v => []
                .concat(getArr(idMap, v.dateAndID?.id))
                .concat(getArr(koro2Map, v.koro2))
                .concat(getArr(ipMap, v.ip))
                .concat(getArr(refPostId, v.postId))
                .concat(v.refPostId)
                .concat([v.postId]))
                .reduce((p, c) => p.add(c), new Set()));

            idMap = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.dateAndID?.id, c.postId), idMap);
            koro2Map = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.koro2, c.postId), koro2Map);
            ipMap = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.ip, c.postId), ipMap);

            // key: postId , value: [ref postId, ref postId, ...]
            refPostId = postValues.filter(v => !pidSet.has(v.postId))
                .flatMap(v => v.refPostId.map(r => { return { pid: v.postId, refPid: r } }))
                .reduce((p, c) => removeArrayToMap(p, c.refPid, c.pid), refPostId);

            pidSet = postValues.reduce((p, c) => { p.delete(c.postId); return p; }, pidSet);
            return related;
        };

        addRefData($(".thread .post"));

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

        let initialObservers = [
            // 5ch側スクリプトで余計なものが追加されたら削除する.(5chutil_inject.jsで登録しないようにしているが、念のため.)
            {
                observe: 'div.thread div.post div.message a',
                target: 'div[div="thumb5ch"]:not(.gochutil)',
                observer: t => new MutationObserver(records => $(Array.from(records).flatMap(r => Array.from(r.addedNodes))).filter(t.target).remove()),
                prepare: t => $(t.observe).children(t.target).remove()
            },
            {
                observe: 'div.thread div.post div.meta',
                target: 'span.back-links:not(.gochutil)',
                observer: t => new MutationObserver(records => $(Array.from(records).flatMap(r => Array.from(r.addedNodes))).filter(t.target).remove()),
                prepare: t => $(t.observe).children(t.target).remove()
            },
            // ヘッダーにStatsが動的に追加されて位置がずれるので、再調整させる.
            {
                observe: 'div.pagestats',
                target: 'ul.flex-container.wrap',
                observer: t => new MutationObserver(records => {
                    if ($(Array.from(records).flatMap(r => Array.from(r.addedNodes))).filter(t.target).length > 0) {
                        replaceAllPopup();
                    }
                })
            },
        ].map(t => {
            t.prepare?.(t);
            let observer = t.observer(t);
            $(t.observe).each((i, e) => observer.observe(e, { childList: true }))
            return observer;
        });
        // しばらくしたら5ch側の処理が終わるはずなので、オブザーバーをdisconnect
        setTimeout(() => initialObservers.forEach(o => o.disconnect()), 10000);


        // アンロード時の画面中央Indexを保持する. 初回表示処理の優先順位制御のため.
        $(window).on('beforeunload', () => sessionStorage.setItem("unloadIndex", binarySearch($(".thread .post").toArray().map(p => $(p)), viewCenterPostComparer())));

        // 全Postに対して処理をする.
        let initProcessPostsPromise = processAllPosts(true);
    };

    await _.init();
    if (!_.settings.app.get().stop) {
        _.injectJs();
        $(function () {
            if ($(".thread .post").length != 0) {
                main();
            }
        });
    }
}(this));
