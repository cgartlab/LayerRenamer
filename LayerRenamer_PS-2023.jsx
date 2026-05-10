// 脚本功能：批量重命名图层并设置颜色标签
// 版本：1.4
// 作者：cgart
// 日期：2026.05
// 说明：
// 1. 支持批量重命名与颜色标签设置。
// 2. 支持 dry-run（仅预览，不写入）。
// 3. 支持冲突策略：跳过 / 覆盖 / 自动追加后缀。

#target photoshop

#include "LayerRenamerCore.jsx"

function collectLayerInfo(doc) {
    var selectedIds = {};

    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);

    if (desc.hasKey(stringIDToTypeID("targetLayers"))) {
        var targetLayers = desc.getList(stringIDToTypeID("targetLayers"));
        for (var i = 0; i < targetLayers.count; i++) {
            var layerIndex = targetLayers.getReference(i).getIndex();
            var layer = getLayerByIndex(layerIndex + 1);
            if (layer) {
                var expanded = getAllLayers(layer);
                for (var j = 0; j < expanded.length; j++) {
                    if (expanded[j].id) {
                        selectedIds[expanded[j].id] = true;
                    }
                }
            }
        }
    } else {
        var activeExpanded = getAllLayers(doc.activeLayer);
        for (var k = 0; k < activeExpanded.length; k++) {
            if (activeExpanded[k].id) {
                selectedIds[activeExpanded[k].id] = true;
            }
        }
    }

    var allNames = {};
    var selectedLayers = [];
    collectNamesRecursivelyFromLayers(doc.layers, allNames, selectedLayers, selectedIds);

    return { selectedLayers: selectedLayers, allNames: allNames };
}

function collectNamesRecursivelyFromLayers(layerCollection, allNames, selectedLayers, selectedIds) {
    for (var i = 0; i < layerCollection.length; i++) {
        var layer = layerCollection[i];
        allNames[layer.name] = true;
        if (layer.typename === "ArtLayer") {
            if (layer.id && selectedIds[layer.id]) {
                selectedLayers.push(layer);
            }
        } else if (layer.typename === "LayerSet") {
            collectNamesRecursivelyFromLayers(layer.layers, allNames, selectedLayers, selectedIds);
        }
    }
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

function executeRename(layers, plan, colorLabel) {
    for (var i = 0; i < layers.length; i++) {
        if (plan[i].action === "skip") {
            Logger.info("执行", "[跳过] " + plan[i].oldName + " -> " + plan[i].targetName + "（" + plan[i].note + "）");
            continue;
        }
        try {
            layers[i].name = plan[i].finalName;
            Logger.info("执行", "[重命名] " + plan[i].oldName + " -> " + plan[i].finalName);
        } catch (e) {
            Logger.error("执行", "[" + i + "] 重命名失败: " + plan[i].oldName + " -> " + plan[i].finalName + " (" + e.message + ")");
            continue;
        }
        if (colorLabel !== "无颜色标签") {
            try {
                setLayerColor(layers[i], colorLabel);
                Logger.info("执行", "[" + i + "] 颜色标签已设置: " + colorLabel);
            } catch (e) {
                Logger.warn("执行", "[" + i + "] 颜色标签设置失败: " + plan[i].finalName + " (" + e.message + ")");
            }
        }
    }
}

function main() {
    Logger.clear();

    var dlg = new Window("dialog", "LayerRenamer-dev1.4");

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
        var baseName, startNumber, numberFormat, colorLabel, conflictPolicy, dryRun;
        try {
            baseName = sanitizeBaseName(baseNameInput.text);
            startNumber = parseInt(startNumberInput.text, 10);
            numberFormat = numberFormatInput.text;
            colorLabel = colorDropdown.selection ? colorDropdown.selection.text : "无颜色标签";
            conflictPolicy = conflictDropdown.selection ? conflictDropdown.selection.text : CONFLICT_SKIP;
            dryRun = dryRunCheckbox.value;

            var validation = isValidInput(baseName, startNumber, numberFormat);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
            Logger.info("输入校验", "通过: baseName=" + baseName + ", start=" + startNumber + ", format=" + numberFormat);
        } catch (e) {
            Logger.error("输入校验", "失败: " + e.message);
            alert("输入校验失败：" + e.message);
            return;
        }

        var layerData;
        try {
            layerData = collectLayerInfo(app.activeDocument);
            if (!layerData.selectedLayers || layerData.selectedLayers.length === 0) {
                alert("未检测到可重命名图层，请先选择图层。");
                return;
            }
            Logger.info("图层收集", "选中 " + layerData.selectedLayers.length + " 个图层");
        } catch (e) {
            Logger.error("图层收集", "失败: " + e.message);
            alert("图层收集失败：" + e.message);
            return;
        }

        var plan;
        try {
            var layersForPlan = [];
            for (var i = 0; i < layerData.selectedLayers.length; i++) {
                layersForPlan.push({ name: layerData.selectedLayers[i].name });
            }
            plan = buildRenamePlan(layersForPlan, baseName, startNumber, numberFormat, conflictPolicy, layerData.allNames);
            Logger.info("计划构建", "生成 " + plan.length + " 条重命名计划");
        } catch (e) {
            Logger.error("计划构建", "失败: " + e.message);
            alert("计划构建失败：" + e.message);
            return;
        }

        if (dryRun) {
            Logger.info("执行模式", "Dry-run 预览");
            alert(formatPlanPreview(plan, true));
            return;
        }

        dlg.close();
        try {
            executeRename(layerData.selectedLayers, plan, colorLabel);
            Logger.info("执行完成", "批量重命名结束");
        } catch (e) {
            Logger.error("执行", "致命错误: " + e.message);
            alert("执行过程中发生致命错误：" + e.message);
        }
        alert(formatPlanPreview(plan, false));
    };

    dlg.addEventListener("keydown", function (event) {
        if (event.keyName === "Enter") {
            okButton.notify();
        }
    });

    dlg.show();
}

main();