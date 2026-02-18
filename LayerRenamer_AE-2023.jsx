// 批量重命名和设置颜色的脚本
// 脚本作者：cgart
// 脚本版本：2023（2026.02 质量增强：dry-run + 冲突策略）
// 脚本描述：批量重命名图层并设置颜色标签

{
    var MAX_PREFIX_LENGTH = 200;
    var PREVIEW_MAX_LINES = 50;

    var CONFLICT_SKIP = "跳过";
    var CONFLICT_OVERWRITE = "覆盖";
    var CONFLICT_SUFFIX = "自动追加后缀";

    var win = new Window("palette", "批量重命名 & 颜色设置", undefined);
    win.orientation = "column";
    win.alignChildren = ["fill", "center"];

    var nameGroup = win.add("group");
    nameGroup.orientation = "row";
    nameGroup.add("statictext", undefined, "新名称前缀:");
    var nameInput = nameGroup.add("edittext", undefined, "");
    nameInput.characters = 20;

    var colorGroup = win.add("group");
    colorGroup.orientation = "row";
    colorGroup.add("statictext", undefined, "选择颜色:");
    var colorDropdown = colorGroup.add("dropdownlist", undefined, ["无", "红色", "黄色", "蓝色", "绿色", "紫色", "橙色", "青色"]);
    colorDropdown.selection = 0;

    var conflictGroup = win.add("group");
    conflictGroup.orientation = "row";
    conflictGroup.add("statictext", undefined, "命名冲突策略:");
    var conflictDropdown = conflictGroup.add("dropdownlist", undefined, [CONFLICT_SKIP, CONFLICT_OVERWRITE, CONFLICT_SUFFIX]);
    conflictDropdown.selection = 0;

    var dryRunCheckbox = win.add("checkbox", undefined, "Dry-run 预览（仅查看，不写入）");
    dryRunCheckbox.value = true;

    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    var applyBtn = buttonGroup.add("button", undefined, "应用", {name: "ok"});
    var cancelBtn = buttonGroup.add("button", undefined, "取消", {name: "cancel"});

    var labelColors = {
        "无": 0,
        "红色": 1,
        "黄色": 2,
        "蓝色": 3,
        "绿色": 4,
        "紫色": 5,
        "橙色": 6,
        "青色": 7
    };

    function sanitizePrefix(input) {
        var value = (input || "").replace(/[\r\n\t]/g, "").replace(/^\s+|\s+$/g, "");
        if (value.length > MAX_PREFIX_LENGTH) {
            value = value.substring(0, MAX_PREFIX_LENGTH);
        }
        return value;
    }

    function collectCompLayerNameSet(comp) {
        var names = {};
        for (var i = 1; i <= comp.numLayers; i++) {
            names[comp.layer(i).name] = true;
        }
        return names;
    }

    function generateUniqueName(baseName, existingNames) {
        var suffix = 1;
        var candidate = baseName;
        while (existingNames[candidate]) {
            candidate = baseName + "_" + suffix;
            suffix++;
        }
        return candidate;
    }

    function buildRenamePlan(selectedLayers, namePrefix, conflictPolicy, existingNames) {
        var plan = [];

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var targetName = namePrefix + "_" + (i + 1);
            var finalName = targetName;
            var action = "rename";
            var note = "";

            var hasConflict = (targetName !== layer.name) && !!existingNames[targetName];
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
                if (existingNames[layer.name]) {
                    delete existingNames[layer.name];
                }
            }

            plan.push({
                layer: layer,
                oldName: layer.name,
                targetName: targetName,
                finalName: finalName,
                action: action,
                note: note
            });
        }

        return plan;
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

        if (lines.length > PREVIEW_MAX_LINES) {
            lines = lines.slice(0, PREVIEW_MAX_LINES);
            lines.push("... 其余条目已省略");
        }

        var header = dryRun ? "Dry-run 预览（未写入）" : "执行完成";
        alert(header + "\n总计: " + plan.length + "，重命名: " + renamed + "，跳过: " + skipped + "\n\n" + lines.join("\n"));
    }

    applyBtn.onClick = function() {
        if (!(app.project && app.project.activeItem && app.project.activeItem instanceof CompItem)) {
            alert("请先打开并激活一个合成。\n脚本仅对合成中的图层生效。");
            return;
        }

        var comp = app.project.activeItem;
        var selectedLayers = comp.selectedLayers;
        if (!selectedLayers || selectedLayers.length === 0) {
            alert("请至少选择一个图层。");
            return;
        }

        var namePrefix = sanitizePrefix(nameInput.text);
        if (namePrefix === "") {
            alert("请输入新名称的前缀。");
            return;
        }

        var selectedColor = colorDropdown.selection ? colorDropdown.selection.text : "无";
        var labelValue = labelColors[selectedColor];
        var conflictPolicy = conflictDropdown.selection ? conflictDropdown.selection.text : CONFLICT_SKIP;
        var dryRun = dryRunCheckbox.value;

        var existingNames = collectCompLayerNameSet(comp);
        var plan = buildRenamePlan(selectedLayers, namePrefix, conflictPolicy, existingNames);

        if (dryRun) {
            showPlanPreview(plan, true);
            return;
        }

        app.beginUndoGroup("批量重命名与设置颜色");
        try {
            for (var i = 0; i < plan.length; i++) {
                if (plan[i].action === "skip") {
                    continue;
                }
                plan[i].layer.name = plan[i].finalName;
                plan[i].layer.label = labelValue;
            }
        } catch (e) {
            alert("执行失败：" + e.toString());
        } finally {
            app.endUndoGroup();
        }

        showPlanPreview(plan, false);
        win.close();
    };

    cancelBtn.onClick = function() {
        win.close();
    };

    win.center();
    win.show();
}
