#target photoshop
app.bringToFront();

// 检查是否有打开的文档
if (app.documents.length === 0) {
    alert("没有打开的文档。");
    throw new Error("No document open.");
}

// 获取当前活动文档
var doc = app.activeDocument;

// 检查是否有选中的图层
var selectedLayers = getSelectedLayers();
if (selectedLayers.length === 0) {
    alert("没有选中的图层。");
    throw new Error("No layers selected.");
}

// 提示输入自定义名称和编号格式
var baseName = prompt("请输入基础图层名称：", "Layer");
var startNumber = parseInt(prompt("请输入编号的起始值：", "1"), 10);
var numberFormat = prompt("请输入编号格式（例如 001，保持编号位数）：", "001");

if (isNaN(startNumber) || !baseName || !numberFormat) {
    alert("输入无效，请重新运行脚本。");
    throw new Error("Invalid input.");
}

// 显示颜色选择界面
var colorLabel = showColorCheckboxDialog();

// 批量重命名图层并修改颜色标签
renameAndColorLayers(selectedLayers, baseName, startNumber, numberFormat, colorLabel);

// 函数：获取当前所选图层（使用 ActionDescriptor）
function getSelectedLayers() {
    var selectedLayers = [];
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);
    
    if (desc.hasKey(stringIDToTypeID('targetLayers'))) {
        var targetLayers = desc.getList(stringIDToTypeID('targetLayers'));
        for (var i = 0; i < targetLayers.count; i++) {
            var layerIndex = targetLayers.getReference(i).getIndex();
            // 因为图层索引是1开始，因此我们使用 getLayerByIndex 的时候要减去 1
            selectedLayers.push(getLayerByIndex(layerIndex + 1)); // 索引修正，确保不会偏移
        }
    } else {
        selectedLayers.push(doc.activeLayer);
    }
    return selectedLayers;
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
    return doc.layers.getByName(desc.getString(charIDToTypeID("Nm  ")));
}

// 函数：重命名图层并修改颜色标签
function renameAndColorLayers(layers, baseName, startNumber, numberFormat, colorLabel) {
    for (var i = 0; i < layers.length; i++) {
        var currentNumber = (startNumber + i).toString();
        var formattedNumber = zeroPad(currentNumber, numberFormat.length);
        var newName = baseName + formattedNumber;
        layers[i].name = newName;
        
        // 如果选择了颜色标签，则设置颜色标签
        if (colorLabel) {
            setLayerColor(layers[i], colorLabel);
        }
    }
}

// 函数：显示颜色选择界面
function showColorCheckboxDialog() {
    var dialog = new Window("dialog", "选择图层颜色标签");
    dialog.orientation = "column";

    var noneCheckbox = dialog.add("checkbox", undefined, "无颜色标签");
    var redCheckbox = dialog.add("checkbox", undefined, "红色");
    var orangeCheckbox = dialog.add("checkbox", undefined, "橙色");
    var yellowCheckbox = dialog.add("checkbox", undefined, "黄色");
    var greenCheckbox = dialog.add("checkbox", undefined, "绿色");
    var blueCheckbox = dialog.add("checkbox", undefined, "蓝色");
    var violetCheckbox = dialog.add("checkbox", undefined, "紫色");
    var grayCheckbox = dialog.add("checkbox", undefined, "灰色");

    noneCheckbox.value = true;

    // 添加一个确认按钮
    var okButton = dialog.add("button", undefined, "确认");
    okButton.onClick = function () {
        dialog.close();
    };

    dialog.show();

    // 返回选择的颜色标签
    if (redCheckbox.value) return "red";
    if (orangeCheckbox.value) return "orange";
    if (yellowCheckbox.value) return "yellow";
    if (greenCheckbox.value) return "green";
    if (blueCheckbox.value) return "blue";
    if (violetCheckbox.value) return "violet";
    if (grayCheckbox.value) return "gray";
    return "none";  // 默认无颜色标签
}

// 函数：设置图层颜色标签
function setLayerColor(layer, color) {
    var colorCode;
    switch (color.toLowerCase()) {
        case "none":
            colorCode = "None";
            break;
        case "red":
            colorCode = "Rd  "; // 红色
            break;
        case "orange":
            colorCode = "Orng"; // 橙色
            break;
        case "yellow":
            colorCode = "Ylw "; // 黄色
            break;
        case "green":
            colorCode = "Grn "; // 绿色
            break;
        case "blue":
            colorCode = "Bl  "; // 蓝色
            break;
        case "violet":
            colorCode = "Vlt "; // 紫色
            break;
        case "gray":
            colorCode = "Gry "; // 灰色
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
