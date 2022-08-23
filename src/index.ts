const readXlsxFile = require("read-excel-file/node");
const writeXlsxFile = require("write-excel-file/node");
const fs = require("fs");

type RowItem = {
    value: string
};

type Sheet = {
    rows: RowItem[][],
    sheetFullName: string,
    id?: number
};

/**
 * 表格名称
 */
enum SheetName {
    Language = "Language"
}

const sheets: Map<string, Sheet> = new Map();

function addRow(row: string[], sheetName: string) {
    const sheet = sheets.get(sheetName);
    sheet.rows.push(
        row.map((item: string) => {
            return { value: item };
        }
    ));
}

/**
 * 导入表格
 * @param filePath 表格路径
 * @returns 
 */
async function importSheet(filePath: string): Promise<Sheet> {
    return readXlsxFile(fs.createReadStream(filePath)).then((rows: string[][]) => {
        const sheetFullName = filePath.split("/").pop();
        const sheetName = sheetFullName.split("_")[0].split(".")[0];
        if (sheets.has(sheetName))
        {
            throw new Error(`${sheetName} already exists`);
        }
        sheets.set(sheetName, { rows: [], sheetFullName });
        for (let i = 0; i < rows.length; i++)
        {
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
async function readLanguage(sheet: Sheet): Promise<Sheet>
{
    // languague tag 所在的列
    const langIndices: number[] = [];
    const colNames: string[] = [];
    const names = sheet.rows[1];
    const tags = sheet.rows[3];

    tags.forEach((tag: RowItem, index: number) => {
        if (tag.value?.toLowerCase() === "language")
        {
            langIndices.push(index);
            colNames.push(names[index].value);
        }
    });

    if (langIndices.length > 0)
    {
        const fileName = sheet.sheetFullName.split("_")[0].split(".")[0];
        for (let i = 0; i < langIndices.length; i++)
        {
            // 列
            const index = langIndices[i];
            for (let j = 4; j < sheet.rows.length; j++)
            {
                // 行
                const row = sheet.rows[j];
                for (let k = 0; k < row.length; k++)
                {
                    // 单元格
                    if (k === index)
                    {
                        const name = `${fileName}_${colNames[i]}_${sheet.rows[j][0].value}`;
                        const cnName = row[k].value;
                        const enName = "";
                        addRow([(sheets.get(SheetName.Language).id++).toString(), name, cnName, enName], SheetName.Language);
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
async function writeFile(sheet: Sheet): Promise<Sheet>
{
    const output = fs.createWriteStream(`./outputs/${sheet.sheetFullName}`);
    const stream = await writeXlsxFile(sheet.rows);
    stream.pipe(output);
    return sheet;
}

function readExcelFiles(dirName: string): Promise<Sheet>[]
{
    const promises: Promise<Sheet>[] = [];
    let files: string[] = fs.readdirSync(dirName);
    files = files.filter((file: string) => file.split(".").pop() === "xlsx");
    for (let i = 0; i < files.length; i++)
    {
        const fileName = files[i];
        const filePath = `${dirName}/${fileName}`;
        const promise = importSheet(filePath)
        .then((sheet: Sheet) => readLanguage(sheet))
        .then((sheet: Sheet) => writeFile(sheet))
        promises.push(promise);
    }
    return promises;
}

sheets.set("Language", {
    rows: [],
    sheetFullName: "Language.xlsx",
    id: 1
});

addRow(["int", "string", "string", "string"], SheetName.Language);
addRow(["id", "name", "Value", "Value_E"], SheetName.Language);
addRow(["", "名称", "中文", "英文"], SheetName.Language);
addRow(["", "Key|ReadByName", "MainLanguage", "ChildLanguage"], SheetName.Language);

let count = 0;
const promises = readExcelFiles("./dist/working");
for (let i = 0; i < promises.length; i++)
{
    promises[i].then((sheet: Sheet) => {
        count++;
        console.log(`Done loading ${sheet.sheetFullName}, Progress: ${count}/${promises.length}`);
        if (count === promises.length)
        {
            writeFile(sheets.get(SheetName.Language));
        }
    });
}

