var MAX_LAYER_NAME_LENGTH = 255;
var MAX_START_NUMBER = 999999;
var PREVIEW_MAX_LINES = 50;
var MAX_PREFIX_LENGTH = 200;

var CONFLICT_SKIP = "跳过";
var CONFLICT_OVERWRITE = "覆盖";
var CONFLICT_SUFFIX = "自动追加后缀";

var MAX_SUFFIX_ATTEMPTS = 1000;

var Logger = (function () {
    var _entries = [];

    function _log(level, step, msg) {
        _entries.push("[" + level + "] [" + step + "] " + msg);
    }

    return {
        info: function (step, msg) {
            _log("INFO", step, msg);
        },
        warn: function (step, msg) {
            _log("WARN", step, msg);
        },
        error: function (step, msg) {
            _log("ERROR", step, msg);
        },
        clear: function () {
            _entries = [];
        },
        getAll: function () {
            return _entries;
        },
        toString: function () {
            return _entries.join("\n");
        }
    };
}());

function sanitizeBaseName(input) {
    var name = (input || "").replace(/\s+/g, " ").replace(/[\r\n\t]/g, "").replace(/^\s+|\s+$/g, "");
    if (name.length > MAX_LAYER_NAME_LENGTH) {
        name = name.substring(0, MAX_LAYER_NAME_LENGTH);
    }
    return name;
}

function isValidInput(baseName, startNumber, numberFormat) {
    if (!baseName) {
        return { valid: false, error: "基础图层名称不能为空。" };
    }
    if (isNaN(startNumber) || startNumber < 0 || startNumber > MAX_START_NUMBER) {
        return { valid: false, error: "编号起始值必须是 0 到 " + MAX_START_NUMBER + " 之间的整数。" };
    }
    if (!/^0+$/.test(numberFormat) || numberFormat.length > 10) {
        return { valid: false, error: "编号格式仅支持连续 0（例如 001），且长度不超过 10。" };
    }
    if (baseName.length + numberFormat.length > MAX_LAYER_NAME_LENGTH) {
        return { valid: false, error: "名称过长，请缩短基础图层名称或编号格式。\n当前最大允许长度为 " + MAX_LAYER_NAME_LENGTH + "。" };
    }
    return { valid: true, error: "" };
}

function truncateName(name) {
    if (name.length > MAX_LAYER_NAME_LENGTH) {
        return name.substring(0, MAX_LAYER_NAME_LENGTH);
    }
    return name;
}

function zeroPad(num, width) {
    while (num.length < width) {
        num = "0" + num;
    }
    return num;
}

function isNameConflict(candidateName, currentName, existingNames) {
    if (candidateName === currentName) {
        return false;
    }
    return !!existingNames[candidateName];
}

function generateUniqueName(baseName, existingNames) {
    var suffix = 1;
    var candidate = baseName;

    while (existingNames[candidate]) {
        if (suffix > MAX_SUFFIX_ATTEMPTS) {
            throw new Error("无法生成唯一名称：后缀尝试次数已达上限 (1000)");
        }
        var appendix = "_" + suffix;
        var headMaxLen = MAX_LAYER_NAME_LENGTH - appendix.length;
        if (headMaxLen < 1) {
            headMaxLen = 1;
        }
        candidate = truncateName(baseName.substring(0, headMaxLen) + appendix);
        suffix++;
    }

    return candidate;
}

function buildRenamePlan(layers, baseName, startNumber, numberFormat, conflictPolicy, existingNames) {
    var names = {};
    var key;
    for (key in existingNames) {
        if (existingNames.hasOwnProperty(key)) {
            names[key] = true;
        }
    }

    var selectedNameMap = {};
    var i;

    for (i = 0; i < layers.length; i++) {
        selectedNameMap[layers[i].name] = true;
    }

    var plan = [];
    for (i = 0; i < layers.length; i++) {
        var currentNumber = (startNumber + i).toString();
        var formattedNumber = zeroPad(currentNumber, numberFormat.length);
        var targetName = truncateName(baseName + formattedNumber);
        var finalName = targetName;
        var action = "rename";
        var note = "";

        var hasConflict = isNameConflict(targetName, layers[i].name, names);

        if (hasConflict) {
            if (conflictPolicy === CONFLICT_SKIP) {
                action = "skip";
                note = "目标名称已存在，按策略跳过";
            } else if (conflictPolicy === CONFLICT_SUFFIX) {
                finalName = generateUniqueName(targetName, names);
                note = "目标名称冲突，自动追加后缀";
            } else {
                note = "目标名称已存在，按策略覆盖";
            }
        }

        if (action !== "skip") {
            names[finalName] = true;
            if (selectedNameMap[layers[i].name]) {
                delete names[layers[i].name];
            }
        }

        plan.push({
            oldName: layers[i].name,
            targetName: targetName,
            finalName: finalName,
            action: action,
            note: note
        });
    }

    return plan;
}

function formatPlanPreview(plan, dryRun) {
    var renamed = 0;
    var skipped = 0;
    var lines = [];

    for (var i = 0; i < plan.length; i++) {
        if (plan[i].action === "skip") {
            skipped++;
            lines.push("[跳过] " + plan[i].oldName + " -> " + plan[i].targetName + "（" + plan[i].note + "）");
        } else {
            renamed++;
            lines.push("[重命名] " + plan[i].oldName + " -> " + plan[i].finalName + (plan[i].note ? "（" + plan[i].note + "）" : ""));
        }
    }

    var header = dryRun ? "Dry-run 预览（未写入）" : "执行完成";
    var summary = header + "\n总计: " + plan.length + "，重命名: " + renamed + "，跳过: " + skipped + "\n\n";

    if (lines.length > PREVIEW_MAX_LINES) {
        lines = lines.slice(0, PREVIEW_MAX_LINES);
        lines.push("... 其余条目已省略");
    }

    return summary + lines.join("\n");
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MAX_LAYER_NAME_LENGTH: MAX_LAYER_NAME_LENGTH,
        MAX_START_NUMBER: MAX_START_NUMBER,
        PREVIEW_MAX_LINES: PREVIEW_MAX_LINES,
        MAX_PREFIX_LENGTH: MAX_PREFIX_LENGTH,
        CONFLICT_SKIP: CONFLICT_SKIP,
        CONFLICT_OVERWRITE: CONFLICT_OVERWRITE,
        CONFLICT_SUFFIX: CONFLICT_SUFFIX,
        MAX_SUFFIX_ATTEMPTS: MAX_SUFFIX_ATTEMPTS,
        Logger: Logger,
        sanitizeBaseName: sanitizeBaseName,
        isValidInput: isValidInput,
        truncateName: truncateName,
        zeroPad: zeroPad,
        isNameConflict: isNameConflict,
        generateUniqueName: generateUniqueName,
        buildRenamePlan: buildRenamePlan,
        formatPlanPreview: formatPlanPreview
    };
}