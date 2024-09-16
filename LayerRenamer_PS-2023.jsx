// 脚本功能：批量重命名图层并设置颜色标签
// 版本：1.1
// 作者：cgart
// 日期：2021.10.29
// 说明：
// 1. 脚本会自动获取当前所选图层（包括图层组内的图层），并对其进行重命名，格式为“基础图层名称”+“编号”（格式由“编号格式”指定，如“001”）。
// 2. 脚本会自动设置颜色标签，颜色标签由“颜色标签”指定，可选“无颜色标签”、“红色”、“橙色”、“黄色”、“绿色”、“蓝色”、“紫色”、“灰色”。
// 3. 脚本会自动关闭对话框。
// 4. 脚本支持图层组。

#target photoshop  

// 主要函数：启动脚本
function main() {
    // 创建主对话框
    var dlg = new Window("dialog", "LayerRenamer-dev1.1");

    // 基础图层名称输入
    dlg.add("statictext", undefined, "基础图层名称：");
    var baseNameInput = dlg.add("edittext", undefined, "Layer");
    baseNameInput.characters = 20;

    // 编号起始值输入
    dlg.add("statictext", undefined, "编号起始值：");
    var startNumberInput = dlg.add("edittext", undefined, "1");
    startNumberInput.characters = 5;

    // 编号格式输入
    dlg.add("statictext", undefined, "编号格式（例如 001）：");
    var numberFormatInput = dlg.add("edittext", undefined, "001");
    numberFormatInput.characters = 10;

    // 颜色标签选择
    dlg.add("statictext", undefined, "选择颜色标签：");
    var colorGroup = dlg.add("group");
    var colorOptions = ["无颜色标签", "红色", "橙色", "黄色", "绿色", "蓝色", "紫色", "灰色"];
    var colorDropdown = colorGroup.add("dropdownlist", undefined, colorOptions);
    colorDropdown.selection = 0;

    // 确认按钮
    var okButton = dlg.add("button", undefined, "确认");
    okButton.onClick = function () {
        var baseName = baseNameInput.text;
        var startNumber = parseInt(startNumberInput.text, 10);
        var numberFormat = numberFormatInput.text;
        var colorLabel = colorDropdown.selection.text.toLowerCase();
        
        // 验证输入
        if (isNaN(startNumber) || !baseName || !numberFormat) {
            alert("输入无效，请重新输入！");
            return;
        }

        // 关闭对话框
        dlg.close();

        // 执行重命名和颜色设置
        renameAndColorLayers(getSelectedLayers(), baseName, startNumber, numberFormat, colorLabel);
    };

    // 监听按键事件以便按下回车键时触发确认按钮
    dlg.addEventListener("keydown", function(event) {
        if (event.keyName === "Enter") {
            okButton.notify(); // 手动触发确认按钮点击事件
        }
    });

    dlg.show();
}

// 函数：获取当前所选图层（包括图层组内的图层）
function getSelectedLayers() {
    var selectedLayers = [];
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);
    
    if (desc.hasKey(stringIDToTypeID('targetLayers'))) {
        var targetLayers = desc.getList(stringIDToTypeID('targetLayers'));
        for (var i = 0; i < targetLayers.count; i++) {
            var layerIndex = targetLayers.getReference(i).getIndex();
            var layer = getLayerByIndex(layerIndex + 1); // 索引修正
            if (layer) {
                selectedLayers = selectedLayers.concat(getAllLayers(layer));
            }
        }
    } else {
        var activeLayer = app.activeDocument.activeLayer;
        selectedLayers = getAllLayers(activeLayer);
    }
    return selectedLayers;
}

// 函数：获取图层组内所有图层（递归）
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

// 函数：通过索引获取图层
function getLayerByIndex(index) {
    var ref = new ActionReference();
    ref.putIndex(charIDToTypeID("Lyr "), index);
    var desc = executeActionGet(ref);
    var layerID = desc.getInteger(stringIDToTypeID("layerID"));
    return getLayerById(layerID);
}

// 函数：通过ID获取图层
function getLayerById(id) {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), id);
    var desc = executeActionGet(ref);
    return app.activeDocument.layers.getByName(desc.getString(charIDToTypeID("Nm  ")));
}

// 函数：重命名图层并修改颜色标签
function renameAndColorLayers(layers, baseName, startNumber, numberFormat, colorLabel) {
    for (var i = 0; i < layers.length; i++) {
        var currentNumber = (startNumber + i).toString();
        var formattedNumber = zeroPad(currentNumber, numberFormat.length);
        var newName = baseName + formattedNumber;
        layers[i].name = newName;
        
        // 设置颜色标签
        if (colorLabel !== "无颜色标签") {
            setLayerColor(layers[i], colorLabel);
        }
    }
}

// 函数：设置图层颜色标签
function setLayerColor(layer, color) {
    var colorCode;
    switch (color.toLowerCase()) {
        case "红色":
            colorCode = "Rd  ";
            break;
        case "橙色":
            colorCode = "Orng";
            break;
        case "黄色":
            colorCode = "Ylw ";
            break;
        case "绿色":
            colorCode = "Grn ";
            break;
        case "蓝色":
            colorCode = "Bl  ";
            break;
        case "紫色":
            colorCode = "Vlt ";
            break;
        case "灰色":
            colorCode = "Gry ";
            break;
        default:
            colorCode = "None";
    }

    var ref = new ActionReference();
    ref.putName(charIDToTypeID("Lyr "), layer.name);
    
    var desc = new ActionDescriptor();
    desc.putReference(charIDToTypeID("null"), ref);
    
    var colorDesc = new ActionDescriptor();
    colorDesc.putEnumerated(charIDToTypeID("Clr "), charIDToTypeID("Clr "), charIDToTypeID(colorCode));
    
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lyr "), colorDesc);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// 函数：补零
function zeroPad(num, width) {
    while (num.length < width) {
        num = '0' + num;
    }
    return num;
}

// 启动主函数
main();
