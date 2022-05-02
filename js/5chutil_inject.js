$(() => {
    let intervals = {};
    let counts = {};
    let removeEvent = ($obj, target) => $._data($obj.get(0), "events")?.[target.type]?.filter(e => e.selector == target.selector).reduce((p, c) => p.add($obj.off(c.type, c.selector), $obj.off(c.origType, c.selector)), $())?.length;
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
