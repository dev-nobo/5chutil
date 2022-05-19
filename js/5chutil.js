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
        const rAnotherThreadHref = /(https?:\/\/.+\.5ch\.net\/test\/read.cgi\/[^/]+\/[0-9]+\/)$/

        const threadUrl = ($("#zxcvtypo").val().startsWith("//") ? location.protocol : "") + $("#zxcvtypo").val() + "/";

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

        // NG制御用リンクタグ生成.
        let createNGControlLinkTag = (ng, className, displayTargetName, titleTargetName) => {
            let controlClassName = ng ? "remove" : "add";
            let displayPrefix = ng ? "-" : "+";
            if (!titleTargetName) {
                titleTargetName = displayTargetName;
            }
            let allClass = `ng_control_link ${controlClassName} ${className}`;
            let text = `${displayPrefix}${displayTargetName}`;
            let title = `${displayPrefix}${titleTargetName}`;
            let link = createControlLinkTag(allClass, text, false, title);
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
                            let $clone = $a.clone().addClass("thumbnail_gochutil");
                            $clone.html("").append($("<div></div>").addClass("thumb5ch gochutil").attr("div", "thumb5ch").append($("<img></img>").addClass("thumb_i").attr("src", dataUrl)));
                            $a.after($clone);
                        })
                        .then(() => replaceAllPopup())
                        .catch(err => { if (err.httpStatus != 202) console.error(err); });
                }
            });

            $post.attr("data-initialized", true);

            return $post;
        };

        $(document).on("click", "a.href_id", function () { scrollToPid($(this).attr("data-href-id")); });

        let scrollToPid = (pid) => {
            if (pid) {
                $('body,html').scrollLeft($("#" + pid).offset().left);
                $('body,html').animate({ scrollTop: $("#" + pid).offset().top - $("nav.navbar-fixed-top").height() - 10 }, 400, 'swing');
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
        let processAllThread = async (init = false) => processPostsInternal($(".thread .post").toArray().map(p => $(p)), init);

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
            // スクロール位置と画面サイズの半分の位置にあるデータのindexとの差分の絶対値を距離としてソートし、その順に処理する.(実際のoffset位置で計算すると重いのでindex差分絶対値でソートしてしまう)
            // ただし、リロードやブラウザバックで初期表示の場合、ブラウザが前回表示位置に自動スクロールするが、タイミングによってスクロール前に、ここに入ってしまう.
            // その場合、表示中央のデータを正しく取得できないので優先して処理するデータは前回unloadした時の画面表示していたindexと0との距離を利用する.
            let scrollTop = $(window).scrollTop();
            let unloadIndex = sessionStorage.getItem("unloadIndex") ?? -1;
            let beforeInitScroll = init && unloadIndex > 0 && scrollTop == 0;

            if (array.length > 100 && (beforeInitScroll || scrollTop > array[10].offset().top)) {
                // スクロールされているかされる前の場合は、表示中で画面中心に近いものから処理する. 遠いものは非同期で裏で処理する事になる.
                let idx = beforeInitScroll ? unloadIndex : binarySearch(array, viewCenterPostComparer());
                if (idx > -1) {
                    let distanceCalc = i => beforeInitScroll ? Math.min(Math.abs(idx - i), i) : Math.abs(idx - i);
                    array = array
                        .map(($p, i) => { return { distance: distanceCalc(i), $p: $p } })
                        .sort((l, r) => l.distance - r.distance)
                        .map(o => o.$p);
                }
            }

            const immidiateProcCount = 15;
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

            let $msg = $post.find(".message");
            let $meta = $post.find(".meta");

            // NG判定.
            let matchNG = matchNGPost(value);
            // NG word判定 & ハイライト
            if ($post.find(".ng_word_inline").length > 0) {
                $post.find(".ng_word_inline").remove();
                $post.find(".ng_word_wrapper").contents().unwrap();
                $msg.each((i, e) => e.normalize());
            }

            $post.find(".control_link").remove();

            $post.find(".abone").removeClass("abone");
            $post.find(".abone_message").remove();

            $post.find(".gochutil_wrapper").contents().unwrap();
            $post.find(".gochutil_wrapper").remove();

            $post.find(".number a.ref_posts").contents().unwrap();
            $post.find(".number a.ref_posts").remove();
            $post.find(".back-links.gochutil").remove();

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

                meta = meta.replace(/(<span class="number">)(.+?)(<\/span>)/, function (match, c1, c2, c3) {
                    let cls = "ref_posts";
                    if (refPostId[value.postId].length > _.settings.app.get().refPostManyCount) {
                        cls = +" many";
                    }
                    return c1 + `<a class="${cls}" href="javascript:void(0);">${c2}</a>` + c3;
                });

                // back-links
                meta += refPostId[value.postId]
                    .map(pid => `<span class="back-links gochutil"><a class="href_id" href="javascript:void(0);" style="font-size:0.7em;margin-left: 5px;display:inline-block;" data-href-id="${pid}">&gt;&gt;${pid}</a></span>`)
                    .reduce((p, c) => p + c, "");
            }
            $meta.html(meta);

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

        let popupStack = [];
        let timeoutHandles = {};
        let last = (array) => array?.[array.length - 1];

        // ポップアップ要素作成.
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

        // ポップアップの表示処理.
        let showPopupInner = async ($target, popupId, popupClass, innerContentAsync, offset, popupTypeId = undefined) => {

            let $inner = await innerContentAsync($target)

            let parentId = $target.closest("div.popup-container").attr("id");
            // 親Popupと同タイプの場合にはそのメッセージを表示.
            if (parentId && popupTypeId && $(`#${parentId}`).data("popup-type-id") == popupTypeId) {
                $inner = $("<div>現在のポップアップと同じです</div>")
            }
            // 下位階層のPopup以外は閉じてしまう.
            while ((!parentId || parentId != last(popupStack)) && popupStack.length > 0) {
                removePopup(popupStack.pop());
            }

            if ($inner && $inner.length > 0) {

                let $popup = createPopup(popupId, popupClass, $inner);

                let topMargin = $("nav.navbar-fixed-top").height() + 10;
                let leftMargin = 10;
                let maxHeight = $(window).height() - topMargin - 10;
                let maxWidth = $(window).width() - leftMargin - 10;

                let place = () => $popup.offset({
                    top: Math.min(offset().top, Math.max($(window).scrollTop() + topMargin, $(window).scrollTop() + topMargin + maxHeight - $popup.outerHeight())),
                    left: Math.min(offset().left, Math.max($(window).scrollLeft() + leftMargin, $(window).scrollLeft() + leftMargin + maxWidth - $popup.outerWidth()))
                });
                let size = () => {
                    $popup.css("width", "").css("height", "");
                    $popup.outerHeight(Math.min($popup.outerHeight(), maxHeight));
                    $popup.outerWidth(Math.min($popup.outerWidth(), maxWidth));
                };

                $popup.find("img").on("load", function () {
                    size();
                    place();
                });

                $("body").append($popup);
                popupStack.push(popupId);

                $popup.data("place-func", place);
                $popup.data("size-func", size);
                $popup.data("popup-type-id", popupTypeId);

                if ($popup.find("img").length <= 0) {
                    size();
                }
                place();
            }
        }

        // ポップアップ表示ハンドラの生成. onmousehover等の引数となる関数を生成する.
        let createOnShowPopupHandler = (popupClass, position, innerContentAsync, showDelay, popupTypeer = undefined) => {
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

                let offset = () => position($a);

                if (offset()) {
                    if (showDelay) {
                        // タイマー設定して、1秒後にポップアップ処理.
                        if (timeoutHandles[popupId]) {
                            clearTimeout(timeoutHandles[popupId]);
                        }
                        $a.addClass("backgroundwidthprogress");
                        timeoutHandles[popupId] = setTimeout(() => {
                            timeoutHandles[popupId] = undefined;
                            $a.removeClass("backgroundwidthprogress")
                            showPopupInner($a, popupId, popupClass, innerContentAsync, offset, popupTypeer?.($a));
                        }, 1000);
                    } else {
                        // 即時ポップアップ処理.
                        if (timeoutHandles[popupId]) {
                            clearTimeout(timeoutHandles[popupId]);
                        }
                        timeoutHandles[popupId] = undefined;
                        $a.removeClass("backgroundwidthprogress");
                        showPopupInner($a, popupId, popupClass, innerContentAsync, offset, popupTypeer?.($a));
                    }
                }
            };
        }

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

        // ポップアップを削除.
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

        // Korokoro, ip, id, 参照レス のレスリストポップアップ処理
        let listPopup = (selector, popupClass, lister, popupTyper, delay) => {
            $("body").on("mouseover", selector, createOnShowPopupHandler(`${popupClass} list_popup`, $a => { return { top: $a.offset().top - 15, left: $a.offset().left + $a.width() } },
                async $a => {
                    let val = getPostValue($a.closest("div.meta").parent());
                    let $container = $('<div class="list_container" />');
                    lister(val).forEach(pid => $container.append($(`div.post#${pid}`).clone()));
                    $container.find("div.post").after("<br>");
                    processPopupPost($container);
                    return $container;
                }, delay, $a => popupTyper(getPostValue($a.closest("div.meta").parent()))));
            $("body").on("mouseout", selector, createOnPopupLinkMouseOutHandler());
        };
        listPopup("span.ref_koro2 a", "koro2_popup", (v) => koro2Map[v.koro2], v => `list-koro2-${v.koro2}`, false);
        listPopup("span.ref_ip a", "ip_popup", (v) => ipMap[v.ip], v => `list-ip-${v.ip}`, false);
        listPopup("span.ref_id a", "id_popup", (v) => idMap[v.dateAndID.id], v => `list-id-${v.dateAndID.id}`, false);
        listPopup("span.number a.ref_posts", "ref_post_popup", (v) => refPostId[v.postId], v => `list-ref-${v.postId}`, true);

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

        // 投稿データのポップアップ前処理. 不要なデータを削除する. (ポップアップ制御のクラスや属性等)
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

        let replaceAllPopup = () => {
            popupStack.forEach(p => {
                let $popup = $(`#${p}`);
                $popup.data("place-func")?.();
                $popup.data("size-func")?.();
            });
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
            // 5ch側スクリプトで余計なものが追加されたら削除する.(ほんとは追加されないようにすべき.)
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
        let initProcessPostsPromise = processAllThread(true);
    };

    await _.init();
    if (!_.settings.app.get().stop) {
        $(function () {
            if ($(".thread .post").length != 0) {
                main();
            }
        });
    }
}(this));
