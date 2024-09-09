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

// 提示输入颜色标签
var colorLabel = prompt("请输入颜色标签（None, Red, Orange, Yellow, Green, Blue, Violet, Gray）：", "None");

if (isNaN(startNumber) || !baseName || !numberFormat || !colorLabel) {
    alert("输入无效，请重新运行脚本。");
    throw new Error("Invalid input.");
}

// 校验颜色标签是否有效
var validColors = ["None", "Red", "Orange", "Yellow", "Green", "Blue", "Violet", "Gray"];
if (validColors.indexOf(colorLabel) === -1) {
    alert("无效的颜色标签。");
    throw new Error("Invalid color label.");
}

// 批量重命名图层并设置颜色标签
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

// 函数：重命名图层并设置颜色标签
function renameAndColorLayers(layers, baseName, startNumber, numberFormat, colorLabel) {
    for (var i = 0; i < layers.length; i++) {
        var currentNumber = (startNumber + i).toString();
        var formattedNumber = zeroPad(currentNumber, numberFormat.length);
        var newName = baseName + formattedNumber;
        layers[i].name = newName;
        setLayerColor(layers[i], colorLabel);
    }
}

// 函数：补零
function zeroPad(num, width) {
    while (num.length < width) {
        num = '0' + num;
    }
    return num;
}

// 函数：设置图层颜色标签
function setLayerColor(layer, colorLabel) {
    var colorDescriptor = new ActionDescriptor();
    var colorReference = new ActionReference();
    colorReference.putIdentifier(charIDToTypeID("Lyr "), layer.id);
    colorDescriptor.putReference(charIDToTypeID("null"), colorReference);

    var colorEnum;
    switch (colorLabel) {
        case "Red":
            colorEnum = charIDToTypeID("Rd  ");
            break;
        case "Orange":
            colorEnum = charIDToTypeID("Orng");
            break;
        case "Yellow":
            colorEnum = charIDToTypeID("Ylw ");
            break;
        case "Green":
            colorEnum = charIDToTypeID("Grn ");
            break;
        case "Blue":
            colorEnum = charIDToTypeID("Bl  ");
            break;
        case "Violet":
            colorEnum = charIDToTypeID("Vlt ");
            break;
        case "Gray":
            colorEnum = charIDToTypeID("Gry ");
            break;
        case "None":
        default:
            colorEnum = charIDToTypeID("None");
            break;
    }

    var colorSetDescriptor = new ActionDescriptor();
    colorSetDescriptor.putEnumerated(charIDToTypeID("Clr "), charIDToTypeID("Clr "), colorEnum);
    colorDescriptor.putObject(charIDToTypeID("T   "), charIDToTypeID("Lyr "), colorSetDescriptor);

    executeAction(charIDToTypeID("setd"), colorDescriptor, DialogModes.NO);
}
