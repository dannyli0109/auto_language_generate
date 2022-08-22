const readXlsxFile = require("read-excel-file/node");
const writeXlsxFile = require("write-excel-file/node");
const fs = require("fs");

type RowItem = {
    value: string
};


const languageRows: RowItem[][] = [];
addRow(["int", "string", "string", "string"], languageRows);
addRow(["id", "name", "Value", "Value_E"], languageRows);
addRow(["", "名称", "中文", "英文"], languageRows);
addRow(["", "Key|ReadByName", "MainLanguage", "ChildLanguage"], languageRows);
let id = 1;

function addRow(row: string[], rows: RowItem[][]) {
    rows.push(
        row.map((item: string) => {
            return { value: item };
        }
    ));
}

async function readFile(filePath: string) {
    readXlsxFile(fs.createReadStream(filePath)).then((rows: string[][]) => {
        const langIndices: number[] = [];
        const colNames: string[] = [];
        const names = rows[1];
        const tags = rows[3];

        const langStrings: string[][][] = [];
        /**
         * 读取有language标签的列
         */
        tags.forEach((tag: string, index: number) => {
            if (tag.toLowerCase() === "language")
            {
                langIndices.push(index);
                colNames.push(names[index]);
            }
        });


        if (langIndices.length > 0)
        {
            const fileName = filePath.split("/").pop().split("_")[0];
            for (let i = 0; i < langIndices.length; i++)
            {
                langStrings.push([]);
                const index = langIndices[i];
                for (let j = 4; j < rows.length; j++)
                {
                    const row = rows[j];
                    for (let k = 0; k < row.length; k++)
                    {
                        if (k === index)
                        {
                            console.log(`${colNames[i]} ${row[k]}`);
                            console.log(`${fileName}_${colNames[i]}_${rows[j][0]}`)
                            const name = `${fileName}_${colNames[i]}_${rows[j][0]}`;
                            const cnName = row[k];
                            langStrings[i].push([(id++).toString(), name, cnName, ""]);
                        }
                    }
                }
            }
        }
        return langStrings;
    }).then((langStrings: string[][][]) => {
        console.log(langStrings);
        for (let i = 0; i < langStrings.length; i++)
        {
            for (let j = 0; j < langStrings[i].length; j++)
            {   
                // TODO: Change this column to the the lanaguge column
                const langString = langStrings[i][j];
                addRow(langString, languageRows);
            }
        }
        writeFile();
    });
}

async function writeFile()
{
    const output = fs.createWriteStream("./outputs/Language.xlsx");
    const stream = await writeXlsxFile(languageRows);
    stream.pipe(output);
}

readFile("./dist/working/ObstacleProps_障碍物_资源.xlsx");