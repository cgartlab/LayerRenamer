// 脚本功能：批量重命名图层并设置颜色标签
// 版本：1.3
// 作者：cgart
// 日期：2021.10.29（2026.02 质量增强：dry-run + 冲突策略）
// 说明：
// 1. 支持批量重命名与颜色标签设置。
// 2. 支持 dry-run（仅预览，不写入）。
// 3. 支持冲突策略：跳过 / 覆盖 / 自动追加后缀。

#target photoshop

var MAX_LAYER_NAME_LENGTH = 255;
var MAX_START_NUMBER = 999999;
var PREVIEW_MAX_LINES = 50;

var CONFLICT_SKIP = "跳过";
var CONFLICT_OVERWRITE = "覆盖";
var CONFLICT_SUFFIX = "自动追加后缀";

// 主要函数：启动脚本
function main() {
    var dlg = new Window("dialog", "LayerRenamer-dev1.3");

    dlg.add("statictext", undefined, "基础图层名称：");
    var baseNameInput = dlg.add("edittext", undefined, "Layer");
    baseNameInput.characters = 20;

    dlg.add("statictext", undefined, "编号起始值：");
    var startNumberInput = dlg.add("edittext", undefined, "1");
    startNumberInput.characters = 5;

    dlg.add("statictext", undefined, "编号格式（例如 001）：");
    var numberFormatInput = dlg.add("edittext", undefined, "001");
    numberFormatInput.characters = 10;

    dlg.add("statictext", undefined, "选择颜色标签：");
    var colorOptions = ["无颜色标签", "红色", "橙色", "黄色", "绿色", "蓝色", "紫色", "灰色"];
    var colorDropdown = dlg.add("dropdownlist", undefined, colorOptions);
    colorDropdown.selection = 0;

    dlg.add("statictext", undefined, "命名冲突策略：");
    var conflictOptions = [CONFLICT_SKIP, CONFLICT_OVERWRITE, CONFLICT_SUFFIX];
    var conflictDropdown = dlg.add("dropdownlist", undefined, conflictOptions);
    conflictDropdown.selection = 0;

    var dryRunCheckbox = dlg.add("checkbox", undefined, "Dry-run 预览（仅查看，不写入）");
    dryRunCheckbox.value = true;

    var buttonGroup = dlg.add("group");
    buttonGroup.orientation = "row";
    var okButton = buttonGroup.add("button", undefined, "确认");
    buttonGroup.add("button", undefined, "取消", { name: "cancel" });

    okButton.onClick = function () {
        var baseName = sanitizeBaseName(baseNameInput.text);
        var startNumber = parseInt(startNumberInput.text, 10);
        var numberFormat = numberFormatInput.text;
        var colorLabel = colorDropdown.selection ? colorDropdown.selection.text : "无颜色标签";
        var conflictPolicy = conflictDropdown.selection ? conflictDropdown.selection.text : CONFLICT_SKIP;
        var dryRun = dryRunCheckbox.value;

        if (!isValidInput(baseName, startNumber, numberFormat)) {
            return;
        }

        var selectedLayers = getSelectedLayers();
        if (!selectedLayers || selectedLayers.length === 0) {
            alert("未检测到可重命名图层，请先选择图层。");
            return;
        }

        var plan = buildRenamePlan(selectedLayers, baseName, startNumber, numberFormat, conflictPolicy);

        // dry-run 直接预览并退出
        if (dryRun) {
            showPlanPreview(plan, true);
            return;
        }

        dlg.close();
        executeRename(selectedLayers, plan, colorLabel);
        showPlanPreview(plan, false);
    };

    dlg.addEventListener("keydown", function (event) {
        if (event.keyName === "Enter") {
            okButton.notify();
        }
    });

    dlg.show();
}

function executeRename(layers, plan, colorLabel) {
    try {
        for (var i = 0; i < layers.length; i++) {
            if (plan[i].action === "skip") {
                continue;
            }
            layers[i].name = plan[i].finalName;
            if (colorLabel !== "无颜色标签") {
                setLayerColor(layers[i], colorLabel);
            }
        }
    } catch (e) {
        alert("执行失败：" + e.message);
    }
}

function sanitizeBaseName(input) {
    var name = (input || "").replace(/\s+/g, " ").replace(/[\r\n\t]/g, "").replace(/^\s+|\s+$/g, "");
    if (name.length > MAX_LAYER_NAME_LENGTH) {
        name = name.substring(0, MAX_LAYER_NAME_LENGTH);
    }
    return name;
}

function isValidInput(baseName, startNumber, numberFormat) {
    if (!baseName) {
        alert("基础图层名称不能为空。");
        return false;
    }
    if (isNaN(startNumber) || startNumber < 0 || startNumber > MAX_START_NUMBER) {
        alert("编号起始值必须是 0 到 " + MAX_START_NUMBER + " 之间的整数。");
        return false;
    }
    if (!/^0+$/.test(numberFormat) || numberFormat.length > 10) {
        alert("编号格式仅支持连续 0（例如 001），且长度不超过 10。");
        return false;
    }
    if (baseName.length + numberFormat.length > MAX_LAYER_NAME_LENGTH) {
        alert("名称过长，请缩短基础图层名称或编号格式。\n当前最大允许长度为 " + MAX_LAYER_NAME_LENGTH + "。");
        return false;
    }
    return true;
}

function buildRenamePlan(layers, baseName, startNumber, numberFormat, conflictPolicy) {
    var existingNames = collectAllArtLayerNames(app.activeDocument.layers);
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

        var hasConflict = isNameConflict(targetName, layers[i].name, existingNames);

        if (hasConflict) {
            if (conflictPolicy === CONFLICT_SKIP) {
                action = "skip";
                note = "目标名称已存在，按策略跳过";
            } else if (conflictPolicy === CONFLICT_SUFFIX) {
                finalName = generateUniqueName(targetName, existingNames);
                note = "目标名称冲突，自动追加后缀";
            } else {
                note = "目标名称已存在，按策略覆盖";
            }
        }

        if (action !== "skip") {
            existingNames[finalName] = true;
            if (selectedNameMap[layers[i].name]) {
                delete existingNames[layers[i].name];
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

function truncateName(name) {
    if (name.length > MAX_LAYER_NAME_LENGTH) {
        return name.substring(0, MAX_LAYER_NAME_LENGTH);
    }
    return name;
}

function showPlanPreview(plan, dryRun) {
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

    alert(summary + lines.join("\n"));
}

function collectAllArtLayerNames(layerCollection) {
    var names = {};
    collectNamesRecursively(layerCollection, names);
    return names;
}

function collectNamesRecursively(layerCollection, names) {
    for (var i = 0; i < layerCollection.length; i++) {
        var layer = layerCollection[i];
        if (layer.typename === "ArtLayer") {
            names[layer.name] = true;
        } else if (layer.typename === "LayerSet") {
            collectNamesRecursively(layer.layers, names);
        }
    }
}

// 获取当前所选图层（包括图层组内图层）
function getSelectedLayers() {
    var selectedLayers = [];
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);

    if (desc.hasKey(stringIDToTypeID("targetLayers"))) {
        var targetLayers = desc.getList(stringIDToTypeID("targetLayers"));
        for (var i = 0; i < targetLayers.count; i++) {
            var layerIndex = targetLayers.getReference(i).getIndex();
            var layer = getLayerByIndex(layerIndex + 1);
            if (layer) {
                selectedLayers = selectedLayers.concat(getAllLayers(layer));
            }
        }
    } else {
        selectedLayers = getAllLayers(app.activeDocument.activeLayer);
    }
    return selectedLayers;
}

function getAllLayers(layer) {
    var layers = [];
    if (layer.typename === "ArtLayer") {
        layers.push(layer);
    } else if (layer.typename === "LayerSet") {
        for (var i = 0; i < layer.layers.length; i++) {
            layers = layers.concat(getAllLayers(layer.layers[i]));
        }
    }
    return layers;
}

function getLayerByIndex(index) {
    var ref = new ActionReference();
    ref.putIndex(charIDToTypeID("Lyr "), index);
    var desc = executeActionGet(ref);
    var layerID = desc.getInteger(stringIDToTypeID("layerID"));
    return getLayerById(layerID);
}

function getLayerById(id) {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), id);
    var desc = executeActionGet(ref);
    return app.activeDocument.layers.getByName(desc.getString(charIDToTypeID("Nm  ")));
}

function setLayerColor(layer, color) {
    var colorCode;
    switch (color.toLowerCase()) {
        case "红色": colorCode = "Rd  "; break;
        case "橙色": colorCode = "Orng"; break;
        case "黄色": colorCode = "Ylw "; break;
        case "绿色": colorCode = "Grn "; break;
        case "蓝色": colorCode = "Bl  "; break;
        case "紫色": colorCode = "Vlt "; break;
        case "灰色": colorCode = "Gry "; break;
        default: colorCode = "None";
    }

    var ref = new ActionReference();
    if (layer.id) {
        ref.putIdentifier(charIDToTypeID("Lyr "), layer.id);
    } else {
        ref.putName(charIDToTypeID("Lyr "), layer.name);
    }

    var desc = new ActionDescriptor();
    desc.putReference(charIDToTypeID("null"), ref);

    var colorDesc = new ActionDescriptor();
    colorDesc.putEnumerated(charIDToTypeID("Clr "), charIDToTypeID("Clr "), charIDToTypeID(colorCode));

    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lyr "), colorDesc);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

function zeroPad(num, width) {
    while (num.length < width) {
        num = "0" + num;
    }
    return num;
}

main();
