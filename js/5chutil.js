$(() => {
    let _ = GOCHUTIL;
    let main = () => {
        let rName = /^<b>(.*?) *<\/b>/;
        let rTrip = /(◆[./0-9A-Za-z]{8,12})/;
        let rSlip = /(\(.+? ([*A-Za-z0-9+/]{4}-[*A-Za-z0-9+/=]{4}).*?\))/;
        let rKoro2 = /([*A-Za-z0-9+/]{4}-[*A-Za-z0-9+/=]{4})/;
        let rIp = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/;
        let rReplyId = /^reply-([0-9]{1,3})$/;
        let rReplyHref = /\/([0-9]{1,3})$/;

        let postValueCache = {};

        let parsePostId = ($post) => {
            let match = $post.attr("id")?.match(rReplyId);
            return match && match[1] || $post.attr("id")
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

            let postId = parsePostId($post);
            let name = mValue(spanName.match(rName));
            let trip = mValue(spanName.match(rTrip));
            let slip = mValue(spanName.match(rSlip));
            let koro2 = mValue(slip?.match(rKoro2));
            let ip = mValue(slip?.match(rIp));

            let dateAndID = undefined;

            let mdate = $post.find("span.date").text().match(/^([0-9]{4}\/[0-9]{2}\/[0-9]{2}).*$/);
            let muid = $post.find("span.uid").text().match(/^ID:([^ ]{8,16})$/);
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
            let postId = parsePostId($post);
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
            let $container = $contents;
            if (!_.settings.app.get().autoEmbedContents) {
                let cotentsHtml = $("<div>").append($container).html();
                $container = $(`<span class="embed"><a href="javascript:void(0);" class="embed">コンテンツを埋め込む</a><span>`).attr("data-embed-content", cotentsHtml);
            }
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

        if (_.env.allowRemoveScript) {
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
        }

        let twitterIdNumber = 0;

        let parseImgurId = (href) => {
            let match = href.match(/\/\/(i\.|)imgur.com\/(a\/|gallery\/|)([0-9a-zA-Z]{7}).*$/);
            return match && (match[2] != "" ? "a/" : "") + match[3];
        }

        let initializePost = async ($post) => {
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

            // imgur の埋め込み化.
            $post.find("div.message a.directlink").each((i, e) => {
                let $a = $(e);
                let imgurid = parseImgurId($a.attr("href"));
                if (imgurid && !$a.attr("data-embed")) {
                    if (_.env.allowRemoveScript) {
                        embedElem($a, $(`<blockquote class="imgur-embed-pub" lang="en" data-id="${imgurid}" data-context="false" ><a href="//imgur.com/${imgurid}"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>`));
                    } else {
                        // iframeで無理やり表示する.
                        embedElem($a,
                            $(`<iframe frameborder="0" scrolling="no" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" class="imgur-embed-iframe-pub imgur-embed-iframe-pub-${imgurid.replace("/", "-")}-false-400"
                            src="https://imgur.com/${imgurid}/embed?pub=true&amp;context=false&amp;w=400" id="imgur-embed-iframe-pub-${imgurid.replace("/", "-")}" style="height: 330px; width: 450px; margin: 10px 0px; padding: 0px;"></iframe>`));
                    }
                    $a.attr("data-embed", true);
                }
            });

            // twitter の埋め込み化.
            $post.find("div.message a.directlink").each((i, e) => {
                let $a = $(e);
                let match = $a.attr("href").match(/\/\/twitter.com\/[^\/]+?\/status\/([0-9]+).*$/);
                if (match && !$a.attr("data-embed") && $post.attr("id")) {
                    let tweetid = match[1];
                    let containerId = "tweet_container-" + $post.attr("id") + "-" + i;
                    if (_.env.allowRemoveScript) {
                        embedElem($a, $(`<div id="${containerId}" class="twitter embed"></div><script id="test">window.twttr.ready(() => twttr.widgets.createTweet("${tweetid}", document.getElementById("${containerId}"), { lang:"ja" }));</script>`));
                    } else {
                        // iframeで無理やり表示する.
                        embedElem($a,
                            $(`<iframe id="twitter-widget-${twitterIdNumber}" scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen="true" class="" style="position: static; visibility: visible; width: 550px; height: 500px; display: block; flex-grow: 1;" title="Twitter Tweet"
                            src="https://platform.twitter.com/embed/Tweet.html?dnt=false&amp;embedId=twitter-widget-${twitterIdNumber}&amp;frame=false&amp;hideCard=false&amp;hideThread=false&amp;id=${tweetid}&amp;lang=ja&amp;width=550px" data-tweet-id="${tweetid}"></iframe>`));
                        twitterIdNumber++;
                    }
                    $a.attr("data-embed", true);
                }
            });

            // instagram の埋め込み.
            $post.find("div.message a.directlink").each((i, e) => {
                let $a = $(e);
                let match = $a.attr("href").match(/\/\/www.instagram.com\/(p|reel)\/([0-9a-zA-Z_\.+\-]+)\/*$/);
                if (match && !$a.attr("data-embed")) {
                    if (_.env.allowRemoveScript) {
                        embedElem($a, $(`<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/${match[1]}/${match[2]}/" style="width:450px;"></blockquote><script async src="//www.instagram.com/embed.js"></script>`));
                    } else {
                        // iframeで無理やり表示する.
                        embedElem($a, $(`<iframe src="https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned/" style="width:450px;" scrolling="no" frameborder="0" allowtransparency="true"></iframe>`));
                    }
                    $a.attr("data-embed", true);
                }
            });

            // youtube の埋め込み.
            $post.find("div.message a.directlink").each((i, e) => {
                let $a = $(e);
                let match = $a.attr("href").match(/\/\/(www|m)\.youtube.com\/.*[?&]v=(?<id>[0-9a-zA-Z_\.+]+).*$/) || $a.attr("href").match(/\/\/youtu.be\/(?<id>[0-9a-zA-Z_\.+]+)$/);
                if (match && !$a.attr("data-embed")) {
                    embedElem($a, $(`<iframe src="//www.youtube.com/embed/${match.groups["id"]}" width="640" height="360" scrolling="no" frameborder="0" allowfullscreen></iframe>`));
                    $a.attr("data-embed", true);
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

            // replay link を スクロール化.
            $post.find("div.message a.reply_link").not(".href_id").each((i, e) => {
                let $a = $(e);
                let href = $a.attr("href");
                let match = href.match(rReplyHref);
                let replyPid = match && match[1];
                if (replyPid && pidSet.has(replyPid)) {
                    $a.attr("href", "javascript:void(0);").removeAttr("target").removeAttr("rel").addClass("href_id");
                    $a.off("click");
                    $a.on("click", function () {
                        $('body,html').animate({ scrollLeft: $("#" + replyPid).offset().left }, 400, 'swing');
                        $('body,html').animate({ scrollTop: $("#" + replyPid).offset().top - $("nav.navbar-fixed-top").height() - 10 }, 400, 'swing');
                    });
                }
            });
        }

        // リモートスクリプトが使えない場合には、自力でメッセージ処理をしてiframeの高さ調整.
        // サービス側の仕様が変わったら動かなくなるので、できればブラックボックスのままリモートスクリプトに処理させたい...
        if (!_.env.allowRemoveScript) {
            let findOwnerIFrame = (source) => Array.from(document.getElementsByTagName("iframe")).find(elm => elm["contentWindow"] == source);
            window.addEventListener('message', function (e) {
                if (e.origin.match(/^https?:\/\/platform\.twitter\.com$/)) {
                    // twitter.
                    if (e.data["twttr.embed"]?.id && e.data["twttr.embed"]?.method == "twttr.private.resize") {
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
                }
            });
        }

        // 処理中メッセージ.
        $("body").append(`<div id="processing_message" class="processing_container" style="display:none;"><div><span class="loader"></span><span class="message">処理中</span></div></div>`);
        let showProcessingMessage = () => $("#processing_message").css("display", "flex");
        let hideProcessingMessage = () => $("#processing_message").css("display", "none");

        // スレッド処理.対象PostIDを指定可能
        let processThread = async (pids) => {
            let pidSet = pids?.reduce((p, c) => p.add(c), new Set());
            let ar = $("div.thread div.post").toArray().map(p => $(p))
                .filter($p => !pidSet || pidSet.has(parsePostId($p)));

            if (ar.length > 100) {
                showProcessingMessage();
            }

            // 非同期で処理する.
            ar = ar.map($p => new Promise((resolve, reject) => {
                setTimeout(() => {
                    processPost($p);
                    resolve();
                }, 0);
            }));

            Promise.all(ar)
                .catch(error => console.error(error))
                .then(() => hideProcessingMessage());
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
            if (matchNG.word) {
                // NG Word ハイライト.
                let $span = $post.find("div.message").find("span");

                $span.html(_.settings.ng.words.replaceWords($span.html(), (w) => `<span class="ng_word_wrapper">${w}</span>` + createNGControlLink(true, "ng_word_inline", "NG Word", "NG Word").attr("data-word", w).prop("outerHTML")));
            }

            // あぼーん.
            $post.find(".abone").removeClass("abone");
            $post.find("span.abone_message").remove();
            if (matchNG.any()) {
                $post.addClass("abone");
                $post.find("div.meta,div.message,div.message span").addClass("abone");
                $post.find("div.message").append('<span class="abone_message"><a href="javascript:void(0)">あぼーん</a></span>');

                if (_.settings.app.get().hideNgMsg) {
                    // $post.find("div.message").hide();
                    $post.hide();
                    $post.find("div.message").hide();
                }
            }

            // 制御用リンク追加.
            $post.find("span.control_link").remove();

            let spanName = $post.find("span.name").html();
            let createCountControlLinkTag = (map, key, cls, settingKey) => (map[key] && createControlLink(cls + (map[key].length >= _.settings.app.get()[settingKey] ? " many" : ""), (map[key].indexOf(value.postId) + 1) + "/" + map[key].length.toString(), map[key].length <= 1).prop("outerHTML") || "");
            if (value.name) {
                spanName = spanName.replace(rName, "$&" + createNGControlLink(matchNG.name, "ng_name", "", "NG Name").prop("outerHTML"));
            }
            if (value.slip) {
                spanName = spanName.replace(rSlip, (match) =>
                    match
                        .replace(rKoro2, "$&" + createNGControlLink(matchNG.koro2, "ng_koro2", "", "NG Korokoro").prop("outerHTML") + createCountControlLinkTag(koro2Map, value.koro2, "ref_koro2 count_link", "koro2ManyCount"))
                        .replace(rIp, "$&" + createNGControlLink(matchNG.ip, "ng_ip", "", "NG IP").prop("outerHTML") + createCountControlLinkTag(ipMap, value.ip, "ref_ip count_link", "ipManyCount"))
                );
            }
            if (value.trip) {
                spanName = spanName.replace(rTrip, "$&" + createNGControlLink(matchNG.trip, "ng_trip", "", "NG Trip").prop("outerHTML"));
            }
            $post.find("span.name").html(spanName);

            if (value.dateAndID) {
                $post.find("span.uid").after(createCountControlLinkTag(idMap, value.dateAndID.id, "ref_id count_link", "idManyCount")).after(createNGControlLink(matchNG.id, "ng_id", "", "NG ID"));
            }

            $post.find("span.number").removeClass("ref_posts");
            $post.find("span.number").removeClass("many");
            if (refPostId[value.postId] && refPostId[value.postId].length > 0) {
                $post.find("span.number").addClass("ref_posts");
                if (refPostId[value.postId].length > _.settings.app.get().refPostManyCount) {
                    $post.find("span.number").addClass("many");
                }
                $post.find("span.number").html(`<a href="javascript:void(0);">${$post.find("span.number").html()}</a>`);
            }
            return $post;
        }

        // ポップアップの共通処理
        let createPopup = (popupId, popupClass, $inner) => {
            let $container = $(`<div id="${popupId}" class="vis" style="border: 1px solid rgb(51, 51, 51); position: absolute; background-color: rgb(239, 239, 239); display: block; padding: 5px;"/>`);
            $container.append($inner);
            $container.addClass(popupClass);

            $container.hover(function () {
                $container.addClass("own_hover");
                $container.removeClass("post_hover");
            }, function () {
                $container.removeClass("own_hover");
                setTimeout(() => {
                    if (!$container.hasClass("post_hover")) {
                        $container.remove();
                    }
                }, 0);
            })
            return $container;
        }

        let mouseOverPopupLink = (popupId, popupClass, position, innerContent, postProcess) => {
            return function () {
                $a = $(this);

                let offset = position($a);

                if (offset) {
                    let $inner = innerContent($a);
                    if ($inner && $inner.length > 0) {

                        let $popup = createPopup(popupId, popupClass, $inner);
                        if (postProcess) {
                            postProcess($popup);
                        }

                        $popup.addClass("popup")
                        $popup.addClass("post_hover");
                        $popup.removeClass("own_hover");

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

                        positioning();
                        $("body").append($popup);

                        if ($popup.find("img").length <= 0) {
                            positioning();
                            sizing();
                        }
                    }
                }
            };
        }

        let mouseOutPopupLink = (popupId) => {
            return function () {
                let popup = $("body").find(`div#${popupId}`);
                if (popup.length > 0) {
                    popup.removeClass("post_hover");
                    setTimeout(() => {
                        if (!popup.hasClass("own_hover")) {
                            popup.remove();
                        }
                    }, 0);
                }
            }
        }

        // 画像のポップアップ処理
        $("body").on("mouseover", "div.message a.image.directlink img", mouseOverPopupLink("img_popup", "img_popup loader", $img => {
            let $a = $img.closest("a");
            if ($a.find("img.thumb_i").length > 0) {
                return { top: $a.find("img.thumb_i").offset().top, left: $a.find("img.thumb_i").offset().left + $a.find("img.thumb_i").width() };
            }
        }, $img => $('<img class="popup_img loader" referrerpolicy="no-referrer" />').on("load", function () { $(this).closest("#img_popup").removeClass("loader") }).attr("src", $img.closest("a").attr("href"))));
        $("body").on("mouseout", "div.message a.image.directlink img", mouseOutPopupLink("img_popup"));

        // Korokoro, ip, id のレスリストポップアップ処理
        let listPopup = (spanClass, popupIdAndClass, lister) => {
            $("body").on("mouseover", `span.${spanClass} a`, mouseOverPopupLink(popupIdAndClass, `${popupIdAndClass} list_popup`, $a => { return { top: $a.offset().top, left: $a.offset().left + $a.width() } }, $a => {
                let val = getPostValue($a.closest("div.meta").parent());
                let list = lister(val);
                if (list.length > 0) {
                    return $(list.map(pid => $(`div.post#${pid}`)[0])).clone();
                }
            }, c => c.find("div.post").after("<br>")));
            $("body").on("mouseout", `span.${spanClass} a`, mouseOutPopupLink(popupIdAndClass));
        };
        listPopup("ref_koro2", "koro2_popup", (v) => koro2Map[v.koro2]);
        listPopup("ref_ip", "ip_popup", (v) => ipMap[v.ip]);
        listPopup("ref_id", "id_popup", (v) => idMap[v.dateAndID.id]);
        listPopup("ref_posts", "ref_post_popup", (v) => refPostId[v.postId]);

        // あぼーんのポップアップ処理
        let timeoutHandle;

        let createNGMsgPopup = ($msg) => {
            let container = $('<div id="abone_popup" class="vis abone_popup" style="border: 1px solid rgb(51, 51, 51); position: absolute; background-color: rgb(239, 239, 239); display: block; padding: 5px;"/>');

            let clone = $msg.clone().removeClass("abone");
            clone.find("span.abone_message").remove();
            clone.find("span").removeClass("abone");
            container.append(clone);
            container.hover(function () {
                container.addClass("own_hover");
                container.removeClass("post_hover");
            }, function () {
                container.removeClass("own_hover");
                setTimeout(() => {
                    if (!container.hasClass("post_hover")) {
                        container.remove();
                    }
                }, 0);
            })
            return container;
        }

        $("body").on("mouseover", "div.message.abone span.abone_message a", function () {
            if (_.settings.app.get().dontPopupMouseoverNgMsg) {
                return;
            }
            $a = $(this);
            let o = $a.offset();
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            $a.addClass("hovering")
            timeoutHandle = setTimeout(() => {
                timeoutHandle = undefined;
                $a.removeClass("hovering")
                let popup = createNGMsgPopup($(this).closest("div.message.abone"));
                popup.addClass("post_hover");
                popup.removeClass("own_hover");
                $("body").append(popup)

                let bo = $("body").offset();
                popup.css("left", Math.min(o.left + $(this).width(), bo.left + $("body").width() - 20 - popup.width()));
                popup.css("top", Math.min(o.top, bo.top + $("body").height() - 20 - popup.height()));
            }, 1000);
        });

        $("body").on("click", "div.message.abone span.abone_message a", function () {
            $a = $(this);
            let o = $a.offset();
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            timeoutHandle = undefined;
            $a.removeClass("hovering")
            let popup = createNGMsgPopup($(this).closest("div.message.abone"));
            popup.addClass("post_hover");
            popup.removeClass("own_hover");
            $("body").append(popup);

            let bo = $("body").offset();
            popup.css("left", Math.min(o.left + $(this).width(), bo.left + $("body").width() - 20 - popup.width()));
            popup.css("top", Math.min(o.top, bo.top + $("body").height() - 20 - popup.height()));
        });

        let removePopup = () => {
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            $("body").find("div#abone_popup").remove();
        };

        $("body").on("mouseout", "div.message.abone span.abone_message a", function () {
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            $(this).removeClass("hovering");
            let popup = $("body").find("div#abone_popup");
            if (popup.length > 0) {
                popup.removeClass("post_hover");
                setTimeout(() => {
                    if (!popup.hasClass("own_hover")) {
                        popup.remove();
                    }
                }, 0);
            }
        });

        // NGの追加/削除イベント
        let controlNGEventListener = (parser, handler, lister) => {
            return async function () {
                let $post = $(this).closest("div.post");
                let value = parser($post);
                if (value) {
                    await handler(value);
                    processThread(lister && lister(value));
                    removePopup();
                }
            }
        }

        let controlNGWordEventListener = (handler) => {
            return async function () {
                let sel = window.getSelection();
                let word = sel?.isCollapsed ? undefined : sel?.getRangeAt(0).toString();
                if (sel && !sel.isCollapsed && sel.anchorNode === sel.focusNode && $(sel.anchorNode).closest("div.message").length > 0 && word && word.length > 1 && word.length < 10) {
                    await handler(word);
                    document.getSelection().removeAllRanges();
                    processThread();
                    removePopup();
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
            await _.settings.ng.words.remove($(this).closest("span.ng_control_link.remove.ng_word_inline").data("word"));
            document.getSelection().removeAllRanges();
            setTimeout(() => {
                processThread();
                removePopup();
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

        let lastPostId = () => parseInt(parsePostId($("div.thread div.post:last")));

        let displayItems = (() => {
            var ret = {
                last: undefined,
                from: undefined,
                to: undefined,
                all: undefined
            };
            let href = location.href;
            if (href.indexOf("?") > -1) {
                href = href.slice(0, href.indexOf("?"));
            }
            let match = href.match(/\/l([0-9]{1,3})$/)
            if (match) {
                ret.last = parseInt(match[1]);
            }
            match = href.match(/\/([0-9]{1,3}|)-([0-9]{1,3}|)$/);
            if (match) {
                if (match[1]) {
                    ret.from = parseInt(match[1]);
                }
                if (match[2]) {
                    ret.to = parseInt(match[2]);
                }
            }
            match = href.match(/.+[0-9]{4}\/$/);
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
                $("div.newposts").append(`<span class="autoload_newposts"><input type="checkbox" id="autoload_newpost" /><label for="autoload_newpost">自動で新着レスの取得(<span class="seconds_remaining" style="min-width:25px;text-align:right;display:inline-block;">${autoloadIntervalSeconds}</span>秒)</label><span class="error_msg" style="display:none;"><br><span class="msg"></span></span></span>`);
            }
        }
        controlReloadControler();

        // 新着レスの取得と追加
        let fetching = false;

        // 新着マーク削除.
        let removeNewPostMark = () => {
            $("div.post.new").addClass("removingnew");
            setTimeout(() => $("div.post.new.removingnew").removeClass("removingnew").removeClass("new"), 3000);
        }

        // 新着レスの取得と追加処理.
        let fetchAndAppendNewPost = (callback) => {
            if (canAppendNewPost() && !fetching) {
                let newPid = lastPostId() + 1;
                let match = location.href.match(/^(.+[0-9]{4})\/.*?$/);
                if (match) {
                    let url = match[1] + "/" + newPid + "-";
                    fetching = true;
                    removeNewPostMark();
                    showProcessingMessage();
                    fetch(url)
                        .then(response => response.arrayBuffer())
                        .then(ab => new TextDecoder(document.characterSet).decode(ab))
                        .then(txt => {
                            let parser = new DOMParser();
                            let doc = parser.parseFromString(txt, "text/html");
                            let $thread = $(doc).find("div.thread");
                            $thread.find("div.post:first").remove();
                            $thread.children().not("div.post").remove();
                            $thread.find("div.post").after("<br>");
                            if ($thread.find("div.post").length > 0) {
                                let postArray = [].concat($("div.thread div.post").toArray()).concat($thread.find("div.post").toArray())
                                if (!displayItems.all && ((displayItems.last && displayItems.last > 0) || (displayItems.to && displayItems.to > 0))) {
                                    if (displayItems.last && displayItems.last > 0 && displayItems.last + 2 < postArray.length) {
                                        // 最新N件よりも多いので、余剰分を削除. 実際にはN+2件が表示される(>>1と最新N+1件)
                                        let target = postArray.slice(1, postArray.length - displayItems.last - 1);
                                        target.forEach(p => {
                                            $(p).next("br").remove();
                                            $(p).remove();
                                        });
                                    }
                                    if (displayItems.to && displayItems.to > 0) {
                                        // Nまで表示で最終がオーバーしたものを削除.
                                        let target = postArray.filter(p => { let pid = parsePostId($(p)); return pid && parseInt(pid) && parseInt(pid) > displayItems.to; })
                                        target.forEach(p => {
                                            $(p).next("br").remove();
                                            $(p).remove();
                                        });
                                    }
                                }

                                $("div.thread div.post:last").next("br").after($thread.html());
                            }
                            fetching = false;
                            hideProcessingMessage();
                        })
                        .then(() => callback && callback());
                }
            }
        }

        // 新着レス取得追加ボタン処理.
        $(document).on("click", "div.newposts span.appendnewposts a", function () {
            fetchAndAppendNewPost()
        });

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
                $("div.newposts span.autoload_newposts span.error_msg").hide();
                unforcusFetchCount = 0;
                if (autoloadInterval) {
                    clearInterval(autoloadInterval);
                    stopCountDown();
                    autoloadInterval = undefined;
                }
                startCountDown();
                autoloadInterval = setInterval(() => {
                    startCountDown();
                    $("div.newposts span.autoload_newposts").removeClass("waiting");
                    if (!document.hasFocus()) {
                        unforcusFetchCount++;
                    } else {
                        unforcusFetchCount = 0;
                    }
                    if (!canAppendNewPost() || unforcusFetchCount > _.settings.app.get().allowUnforcusAutoloadCount) {
                        $chk.removeAttr("checked").prop('checked', false).trigger("change");
                        if (unforcusFetchCount > _.settings.app.get().allowUnforcusAutoloadCount) {
                            $("div.newposts span.autoload_newposts span.error_msg span.msg").text(`非アクティブ状態で${_.settings.app.get().allowUnforcusAutoloadCount}回ロードしたためオフにしました`);
                            $("div.newposts span.autoload_newposts span.error_msg").show();
                        }
                        return;
                    }
                    fetchAndAppendNewPost(() => {
                        if (!canAppendNewPost()) {
                            $chk.removeAttr("checked").prop('checked', false).trigger("change");
                        }
                    });
                    //-hack for reflow
                    void $("div.newposts span.autoload_newposts").get(0).offsetWidth;
                    $("div.newposts span.autoload_newposts").addClass("waiting");
                }, autoloadIntervalSeconds * 1000);
                $("div.newposts span.autoload_newposts").removeClass("waiting");
                document.documentElement.style.setProperty('--wait-animation-span', `${autoloadIntervalSeconds}s`);
                //-hack for reflow
                void $("div.newposts span.autoload_newposts").get(0).offsetWidth;
                $("div.newposts span.autoload_newposts").addClass("waiting");
            } else {
                if (autoloadInterval) {
                    clearInterval(autoloadInterval);
                    stopCountDown();
                    autoloadInterval = undefined;
                }
                $("div.newposts span.autoload_newposts").removeClass("waiting");
            }
        });

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
            if (key) {
                if (map[key]) {
                    if (map[key].includes(val)) {
                        map[key].splice(map[key].indexOf(val), 1);
                        if (map[key].length == 0) {
                            delete map.key;
                        }
                    }
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
            refPostId = $posts.filter((i, e) => !pidSet.has(parsePostId($(e)))).find("div.message a.reply_link").toArray().reduce((p, c) => {
                let match = $(c).attr("href").match(rReplyHref);
                let replyPid = match && match[1];
                return pushArrayToMap(p, replyPid, parsePostId($(c).closest("div.post")));
            }, refPostId);

            pidSet = postValues.reduce((p, c) => { p.add(c.postId); return p; }, pidSet);

            let getArr = (map, key) => key ? map[key] ?? [] : [];
            let affedted = Array.from(postValues.flatMap(v => []
                .concat(getArr(idMap, v.dateAndID?.id))
                .concat(getArr(koro2Map, v.koro2))
                .concat(getArr(ipMap, v.ip))
                .concat(getArr(refPostId, v.postId))
                .concat([v.postId])).reduce((p, c) => p.add(c), new Set()));
            return affedted;
        };

        let removeRefData = ($posts) => {
            let postValues = $posts.toArray().map((p) => getPostValue($(p)));

            let getArr = (map, key) => key ? map[key] ?? [] : [];
            let affedted = Array.from(postValues.flatMap(v => []
                .concat(getArr(idMap, v.dateAndID?.id))
                .concat(getArr(koro2Map, v.koro2))
                .concat(getArr(ipMap, v.ip))
                .concat(getArr(refPostId, v.postId))
                .concat([v.postId])).reduce((p, c) => p.add(c), new Set()));

            idMap = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.dateAndID?.id, c.postId), idMap);
            koro2Map = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.koro2, c.postId), koro2Map);
            ipMap = postValues.filter(v => pidSet.has(v.postId)).reduce((p, c) => removeArrayToMap(p, c.ip, c.postId), ipMap);

            // key: postId , value: [ref postId, ref postId, ...]
            refPostId = $posts.filter((i, e) => pidSet.has(parsePostId($(e)))).find("div.message a.reply_link").toArray().reduce((p, c) => {
                let match = $(c).attr("href").match(rReplyHref);
                let replyPid = match && match[1];
                return removeArrayToMap(p, replyPid, parsePostId($(c).closest("div.post")));
            }, refPostId);

            pidSet = postValues.reduce((p, c) => { p.delete(c.postId); return p; }, pidSet);
            return affedted;
        };

        addRefData($("div.thread div.post"));

        // オブザーバーで追加されたノードに対する処理.
        // レスのポップアップに対する処理.
        let popupPostObserver = new MutationObserver(records => {
            let addedNodes = Array.from(records).flatMap(r => Array.from(r.addedNodes));
            let popupPost = addedNodes.map(n => $(n))
                .filter($n => $n.is("div"))
                .filter($n => $n.hasClass("vis") && !$n.hasClass("list_popup") && !$n.hasClass("abone_popup"))
                .filter($n => $n.attr("id") && $n.attr("id").match(rReplyId) && parsePostId($n));
            popupPost.forEach(processPost);
        });

        // 新着レス等で追加/削除したノードに対する処理.
        let newPostObserver = new MutationObserver(records => {
            let addedNodes = Array.from(records).flatMap(r => Array.from(r.addedNodes));
            let removedNodes = Array.from(records).flatMap(r => Array.from(r.removedNodes));
            let addedPosts = addedNodes.map(n => $(n)).filter($n => $n.is("div"))
                .filter($n => $n.hasClass("post"))
                .filter($n => $n.attr("id") && parsePostId($n));
            let removedPosts = removedNodes.map(n => $(n)).filter($n => $n.is("div"))
                .filter($n => $n.hasClass("post"))
                .filter($n => $n.attr("id") && parsePostId($n));
            let affectedPostId = Array.from(new Set([].concat(addRefData($(addedPosts.map($n => $n.get(0))))).concat(removeRefData($(removedPosts.map($n => $n.get(0)))))));
            var $addedPosts = $(addedPosts.map($p => $p.get(0)));
            $addedPosts.filter("div.post").addClass("new");
            if (_.settings.app.get().newPostMarkDisplaySeconds > 0) {
                setTimeout(() => removeNewPostMark(), _.settings.app.get().newPostMarkDisplaySeconds * 1000);
            }
            if ($addedPosts.length > 0) {
                $("div.pagestats ul.menujust li:first-child").text(parsePostId($addedPosts.last()) + "コメント");
            }
            if (_.settings.app.get().autoscrollWhenNewPostLoad && $addedPosts.length > 0) {
                $('body,html').animate({ scrollTop: $addedPosts.first().offset().top - $("nav.navbar-fixed-top").height() - 10 }, 400, 'swing');
            }
            processThread(affectedPostId);
        });

        // 監視の開始
        popupPostObserver.observe($("body").get(0), { childList: true });
        newPostObserver.observe($("div.thread").get(0), { childList: true })

        // 全Postに対して処理をする.
        processThread();
    };

    _.init().then(r => {
        if (!_.settings.app.get().stop) {
            main();
        }
    });
});
