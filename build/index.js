const readXlsxFile = require("read-excel-file/node");
const writeXlsxFile = require("write-excel-file/node");
const fs = require("fs");
/**
 * 表格名称
 */
var SheetName;
(function (SheetName) {
  SheetName["Language"] = "Language";
})(SheetName || (SheetName = {}));
const sheets = new Map();
function addRow(row, sheetName) {
  const sheet = sheets.get(sheetName);
  sheet.rows.push(
    row.map((item) => {
      return { value: item };
    })
  );
}
/**
 * 导入表格
 * @param filePath 表格路径
 * @returns
 */
async function importSheet(filePath) {
  return readXlsxFile(fs.createReadStream(filePath)).then((rows) => {
    const sheetFullName = filePath.split("/").pop();
    const sheetName = sheetFullName.split("_")[0].split(".")[0];
    if (sheets.has(sheetName)) {
      throw new Error(`${sheetName} already exists`);
    }
    sheets.set(sheetName, { rows: [], sheetFullName });
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      addRow(row, sheetName);
    }
    return sheets.get(sheetName);
  });
}
/**
 * 读取表格中的语言tag
 * @param sheet
 * @returns
 */
async function readLanguage(sheet) {
  // languague tag 所在的列
  const langIndices = [];
  const colNames = [];
  const names = sheet.rows[1];
  const tags = sheet.rows[3];
  tags.forEach((tag, index) => {
    var _a;
    if (
      ((_a = tag.value) === null || _a === void 0
        ? void 0
        : _a.toLowerCase()) === "language"
    ) {
      langIndices.push(index);
      colNames.push(names[index].value);
    }
  });
  if (langIndices.length > 0) {
    const fileName = sheet.sheetFullName.split("_")[0].split(".")[0];
    for (let i = 0; i < langIndices.length; i++) {
      // 列
      const index = langIndices[i];
      for (let j = 4; j < sheet.rows.length; j++) {
        // 行
        const row = sheet.rows[j];
        for (let k = 0; k < row.length; k++) {
          // 单元格
          if (k === index) {
            const name = `${fileName}_${colNames[i]}_${sheet.rows[j][0].value}`;
            const cnName = row[k].value;
            const enName = "";
            addRow(
              [
                (sheets.get(SheetName.Language).id++).toString(),
                name,
                cnName,
                enName,
              ],
              SheetName.Language
            );
            sheet.rows[j][index].value = name;
          }
        }
      }
    }
  }
  return sheet;
}
/**
 * 输出表格
 * @param sheet
 * @returns
 */
async function writeFile(sheet) {
  const output = fs.createWriteStream(`./outputs/${sheet.sheetFullName}`);
  const stream = await writeXlsxFile(sheet.rows);
  stream.pipe(output);
  return sheet;
}
function readExcelFiles(dirName) {
  const promises = [];
  let files = fs.readdirSync(dirName);
  files = files.filter((file) => file.split(".").pop() === "xlsx");
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = `${dirName}/${fileName}`;
    const promise = importSheet(filePath)
      .then((sheet) => readLanguage(sheet))
      .then((sheet) => writeFile(sheet));
    promises.push(promise);
  }
  return promises;
}
sheets.set("Language", {
  rows: [],
  sheetFullName: "Language.xlsx",
  id: 1,
});
addRow(["int", "string", "string", "string"], SheetName.Language);
addRow(["id", "name", "Value", "Value_E"], SheetName.Language);
addRow(["", "名称", "中文", "英文"], SheetName.Language);
addRow(
  ["", "Key|ReadByName", "MainLanguage", "ChildLanguage"],
  SheetName.Language
);
let count = 0;
const promises = readExcelFiles("./dist/working");
for (let i = 0; i < promises.length; i++) {
  promises[i].then((sheet) => {
    count++;
    console.log(
      `Done loading ${sheet.sheetFullName}, Progress: ${count}/${promises.length}`
    );
    if (count === promises.length) {
      writeFile(sheets.get(SheetName.Language));
    }
  });
}
