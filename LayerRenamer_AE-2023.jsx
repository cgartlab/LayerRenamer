// 创建批量重命名和设置颜色的脚本
{
    // 创建主窗口
    var win = new Window("palette", "批量重命名 & 颜色设置", undefined);
    win.orientation = "column";
    win.alignChildren = ["fill", "center"];
    
    // 名称前缀输入部分
    var nameGroup = win.add("group");
    nameGroup.orientation = "row";
    nameGroup.add("statictext", undefined, "新名称前缀:");
    var nameInput = nameGroup.add("edittext", undefined, "");
    nameInput.characters = 20;

    // 颜色选择部分
    var colorGroup = win.add("group");
    colorGroup.orientation = "row";
    colorGroup.add("statictext", undefined, "选择颜色:");
    var colorDropdown = colorGroup.add("dropdownlist", undefined, [
        "无", "红色", "黄色", "蓝色", "绿色", "紫色", "橙色", "青色"
    ]);
    colorDropdown.selection = 0;

    // 按钮组
    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    var applyBtn = buttonGroup.add("button", undefined, "应用", {name: "ok"});
    var cancelBtn = buttonGroup.add("button", undefined, "取消", {name: "cancel"});
    
    // 设置颜色的 AE 内部标签值
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
        var labelValue = labelColors[selectedColor];
        
        app.beginUndoGroup("批量重命名与设置颜色");
        
        // 批量重命名和设置颜色
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            
            // 重命名图层
            layer.name = namePrefix + "_" + (i + 1);
            
            // 设置颜色标签
            if (labelValue > 0) {
                layer.label = labelValue;  // 设置图层颜色标签
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
}
