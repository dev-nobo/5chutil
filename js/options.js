(async function (global) {
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
        initializeCheckboxSetting("expandRefPosts");
        initializeCheckboxSetting("popupOnClick");
        initializeCheckboxSetting("closeOtherPopupOnClick");
        initializeCheckboxSetting("pinnablePopup");
        initializeCheckboxSetting("fixOnPinned");
        initializeCheckboxSetting("showOpenLeft");
        initializeCheckboxSetting("hideLeft");
        initializeCheckboxSetting("hideRight");
        initializeCheckboxSetting("persistLeftPaneStat");
        initializeCheckboxSetting("floatFeature");

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
            await _.settings.ui.reset();
            await _.bbsmenu.reset();
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

        let valueToOpt = v => $(`<option data-text="${v}">${v}</option>`);
        initialiezeNG("name", () => _.settings.ng.names.list(), valueToOpt, v => _.settings.ng.names.set(v), _.settings.ng.names.maxSize());
        initialiezeNG("trip", () => _.settings.ng.trips.list(), valueToOpt, v => _.settings.ng.trips.set(v), _.settings.ng.trips.maxSize());
        initialiezeNG("koro2", () => _.settings.ng.koro2s.list(), valueToOpt, v => _.settings.ng.koro2s.set(v), _.settings.ng.koro2s.maxSize());
        initialiezeNG("ip", () => _.settings.ng.ips.list(), valueToOpt, v => _.settings.ng.ips.set(v), _.settings.ng.ips.maxSize());
        initialiezeNG("slip", () => _.settings.ng.slips.list(), valueToOpt, v => _.settings.ng.slips.set(v), _.settings.ng.slips.maxSize());
        initialiezeNG("dateAndID", () => _.settings.ng.dateAndIDs.list(), v => $(`<option data-date="${v.date}" data-uid="${v.id}" >Date:${v.date}&nbsp;|&nbsp;ID:${v.id}</option>`), v => _.settings.ng.dateAndIDs.set(v), _.settings.ng.dateAndIDs.maxSize());
        initialiezeNG("word", () => _.settings.ng.words.list(), valueToOpt, v => _.settings.ng.words.set(v), _.settings.ng.words.maxSize());

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
                del.forEach(d => $(`option[data-text = "${d}"]`).remove());
                $("input.ng.word.input").val("");
                $("input.ng.word.input").trigger("change");
            }
        });

        $("button.ng.slip.add").off("click");
        $("button.ng.slip.add").on("click", async function () {
            let slip = $("input.ng.slip.input").val();
            if (!slip) {
                window.alert("データを入力してください。");
            } else if (slip && _.settings.ng.slips.contains(slip)) {
                window.alert("登録済みです。");
            } else {
                try {
                    new RegExp(slip);
                    $("select.ng.slip").append(`<option>${slip}</option>`);
                    let del = await _.settings.ng.slips.add(slip);
                    del.forEach(d => $(`option[data-text = "${d}"]`).remove());
                    $("input.ng.slip.input").val("");
                    $("input.ng.slip.input").trigger("change");
                } catch (e) {
                    window.alert("正規表現として不正です。");
                    return;
                }
            }
        });
    };

    let main = () => {
        _.initOptions();

        if(!_.env.controlShowOpenLeft){
            $("#showOpenLeft").closest("li").hide();
        }
    };

    await _.init();
    $(function () {
        main();
    });
}(this));
