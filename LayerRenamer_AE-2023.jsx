// 创建批量重命名和设置颜色的脚本
{
    // 创建主窗口
    var win = new Window("palette", "批量重命名 & 颜色设置", undefined);
    win.orientation = "column";
    
    // 重命名部分
    var renameGroup = win.add("panel", undefined, "批量重命名");
    renameGroup.orientation = "row";
    renameGroup.alignChildren = ["left", "center"];
    
    var nameLabel = renameGroup.add("statictext", undefined, "新名称前缀:");
    var nameInput = renameGroup.add("edittext", undefined, "");
    nameInput.characters = 20;
    
    // 颜色选择部分
    var colorGroup = win.add("panel", undefined, "设置颜色");
    colorGroup.orientation = "row";
    colorGroup.alignChildren = ["left", "center"];
    
    var colorLabel = colorGroup.add("statictext", undefined, "选择颜色:");
    var colorDropdown = colorGroup.add("dropdownlist", undefined, [
        "无", "红色", "黄色", "蓝色", "绿色", "紫色", "橙色", "青色"
    ]);
    colorDropdown.selection = 0;
    
    // 按钮组
    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    var applyBtn = buttonGroup.add("button", undefined, "应用", {name: "ok"});
    var cancelBtn = buttonGroup.add("button", undefined, "取消", {name: "cancel"});
    
    // 设置颜色的 AE 内部值
    var layerColors = {
        "无": [0, 0, 0],
        "红色": [1, 0, 0],
        "黄色": [1, 1, 0],
        "蓝色": [0, 0, 1],
        "绿色": [0, 1, 0],
        "紫色": [1, 0, 1],
        "橙色": [1, 0.5, 0],
        "青色": [0, 1, 1]
    };
    
    // 应用按钮的点击事件
    applyBtn.onClick = function() {
        var selectedLayers = app.project.activeItem.selectedLayers;
        if (selectedLayers.length == 0) {
            alert("请至少选择一个图层。");
            return;
        }
        
        // 获取输入的名称前缀
        var namePrefix = nameInput.text;
        if (namePrefix === "") {
            alert("请输入新名称的前缀。");
            return;
        }
        
        // 获取选择的颜色
        var selectedColor = colorDropdown.selection.text;
        var colorValue = layerColors[selectedColor];
        
        app.beginUndoGroup("批量重命名与设置颜色");
        
        // 批量重命名和设置颜色
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            
            // 重命名图层
            layer.name = namePrefix + "_" + (i + 1);
            
            // 设置颜色
            if (selectedColor !== "无") {
                layer.label = getLabelFromColor(colorValue);
            }
        }
        
        app.endUndoGroup();
        win.close();
    };
    
    // 取消按钮的点击事件
    cancelBtn.onClick = function() {
        win.close();
    };
    
    // 显示窗口
    win.center();
    win.show();
    
    // 颜色到标签值的映射函数
    function getLabelFromColor(color) {
        var labels = {
            "红色": 1, "黄色": 2, "蓝色": 3, "绿色": 4, "紫色": 5, "橙色": 6, "青色": 7
        };
        return labels[selectedColor];
    }
}
