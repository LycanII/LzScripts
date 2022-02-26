'use strict';
const azdata = require('azdata');

async function runForInsert(connection, query) {
    let insetStr = [];
    let ins = 'insert into [';
    let data = await runQuery(connection, query);
    //--> get cols expect identity , autogen cols
    for (let i = 0; i < data.columnInfo.length; i++) {
        if(data.columnInfo[i].isAutoIncrement !== true && data.columnInfo[i].isIdentity !== true )
            ins += (' ' + data.columnInfo[i].columnName + ' ,');
    }

    ins = ins.slice(0, ins.length - 1); //--> remove last comma
    ins = ins + '] \n values []';
    //--> look at data
    for (let row = 0; row < data.rowCount; row++) {
        for (let col = 0; col < data.columnInfo.length; col++) {
            if(data.columnInfo[col].isAutoIncrement !== true && data.columnInfo[col].isIdentity !== true )
                ins += (' ' + getValue(data.rows[row][col].displayValue,data.columnInfo[col]) + ' ,');
        }

    }

    return ins;
};
async function runQuery(connection, query) {
    //let connectionResult = await azdata.connection.connect(connection, false, false);
    let connectionUri = await azdata.connection.getUriForConnection(connection.connectionId);
    let queryProvider = azdata.dataprotocol.getProvider('MSSQL', azdata.DataProviderType.QueryProvider);
    return await queryProvider.runQueryAndReturn(connectionUri, query);
};
function getValue(displayValue,colinfo) {
    switch (colinfo.dataTypeName)
    {
        case "int": case "bigint": case "bit":
            return parseInt(displayValue);
        case "money": case "decimal": case "float": 
            return parseFloat(displayValue);
        default:
            return displayValue;

    }
   
}


module.exports.runForInsert = runForInsert;
module.exports.runQuery = runQuery;


