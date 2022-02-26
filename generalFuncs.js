
const azdata = require('azdata');

async function runForInsert(connection, query) {
    let insetStr = [];
    let data = await runQuery(connection, query);
    let table = getTableName(query);
    let ins = 'insert into '+ table + ' (';

    //--> get cols expect identity , autogen cols
    for (let i = 0; i < data.columnInfo.length; i++) {
        if(data.columnInfo[i].isAutoIncrement !== true && data.columnInfo[i].isIdentity !== true )
            ins += (' ' + data.columnInfo[i].columnName + ' ,');
    }

    ins = ins.slice(0, ins.length - 1); //--> remove last comma
    ins = ins + ') \n';
    //--> look at data
    for (let row = 0; row < data.rowCount; row++) {
        let dataStr ='values ('
        for (let col = 0; col < data.columnInfo.length; col++) {
            if(data.columnInfo[col].isAutoIncrement !== true && data.columnInfo[col].isIdentity !== true )
            dataStr += (' ' + ( 
                data.rows[row][col].isNull ===true ? 'Null' :
                getValue(data.rows[row][col].displayValue,data.columnInfo[col]) ) 
            + ' ,');
        }
       
        dataStr = dataStr.slice(0, dataStr.length - 1);
        dataStr = dataStr + '); \n ';
        insetStr.push(ins + dataStr);
    }
    
    return insetStr;
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
            return `'${displayValue}'`;

    }
};

function getTableName(query) {
    let ql = query.toLowerCase();
    let dexFrom = ql.indexOf('from');
    let dexWhere = ql.indexOf('where');
    return ql.slice(dexFrom+4 , (dexWhere > 0 ? dexWhere : ql.length ));
}
module.exports.runForInsert = runForInsert;
module.exports.runQuery = runQuery;



