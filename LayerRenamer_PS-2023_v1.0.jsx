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

// 批量重命名图层
renameLayers(selectedLayers, baseName, startNumber, numberFormat);

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

// 函数：重命名图层
function renameLayers(layers, baseName, startNumber, numberFormat) {
    for (var i = 0; i < layers.length; i++) {
        var currentNumber = (startNumber + i).toString();
        var formattedNumber = zeroPad(currentNumber, numberFormat.length);
        var newName = baseName + formattedNumber;
        layers[i].name = newName;
    }
}

// 函数：补零
function zeroPad(num, width) {
    while (num.length < width) {
        num = '0' + num;
    }
    return num;
}
