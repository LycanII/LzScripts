
const azdata = require('azdata');
const vscode = require('vscode');
/**
 * @param {azdata.connection.ConnectionProfile} connection
 * @param {string} query
 */
async function runForInsert(connection, query) {
    let allowIdentity = vscode.workspace.getConfiguration('LzScripts').get('addIdentityColumns') === true;
    let allowMultipleInsert = vscode.workspace.getConfiguration('LzScripts').get('allowInsertPerRow') === true;
    let insetStr = [];

    let openPar = '';
    let closePar = '';
    if (connection.providerId == "MSSQL") {
       openPar = ' [';
       closePar = ']'; 
    }

    let tableInfos = extractTableInfo(query, connection.providerId);
    let tableInfo = tableInfos.length > 0 ? tableInfos[0] : {};
    let table = IsEmptyObj(tableInfo)  ? '' : tableInfo.table.replaceAll('[','').replaceAll(']','');

	
    //--> the place of sadness :(
    // let table = tableFull.indexOf('dbo') >= 0 ?
    //     tableFull.slice(tableFull.indexOf('dbo') + 4).replaceAll('.', '').replaceAll('[', '').replaceAll(']', '')
    //     : tableFull.replaceAll('.', '').replaceAll('[', '').replaceAll(']', '');
    //--> the place of sadness :(
    let tblExist = await tableExists(connection, table, tableInfo.database);
    if (!tblExist)
        throw new Error(`Target Table ${table} not found`);


    let data = await runQuery(connection, query, tableInfo.database);
    if (data.rowCount == 0)
        throw new Error('No records found');

    let ins = 'insert into ' + tableInfo.full + ' (';

    //--> get cols except identity , autogen cols
    for (let i = 0; i < data.columnInfo.length; i++) {
        if (data.columnInfo[i].isIdentity === true && !allowIdentity)
            continue;

        if (data.columnInfo[i].dataTypeName !== 'timestamp')
            ins += (openPar + data.columnInfo[i].columnName + closePar +' ,');
    }
    //--> remove last comma
    ins = ins.slice(0, ins.length - 1);
    ins = ins + ') \n';
    //--> look at data

    if (allowMultipleInsert) {
        for (let row = 0; row < data.rowCount; row++) {
            let dataStr = 'values ('
            for (let col = 0; col < data.columnInfo.length; col++) {

                if (data.columnInfo[col].isIdentity === true && !allowIdentity)
                    continue;

                if (data.columnInfo[col].dataTypeName !== 'timestamp')
                    dataStr += (`/* ${data.columnInfo[col].columnName} */ ` + (
                        data.rows[row][col].isNull === true ? 'null' :
                            getValue(data.rows[row][col].displayValue, data.columnInfo[col]))
                        + ' ,');
            }

            dataStr = dataStr.slice(0, dataStr.length - 1);
            dataStr = dataStr + '); \n ';
            insetStr.push(ins + dataStr);
        }
    } 
    else
    {
        let dataStr = 'values '
        for (let row = 0; row < data.rowCount; row++) {
            dataStr += '( '
            for (let col = 0; col < data.columnInfo.length; col++) {

                if (data.columnInfo[col].isIdentity === true && !allowIdentity)
                    continue;

                if (data.columnInfo[col].dataTypeName !== 'timestamp')
                    dataStr += (`/* ${data.columnInfo[col].columnName} */ ` + (
                        data.rows[row][col].isNull === true ? 'null' :
                            getValue(data.rows[row][col].displayValue, data.columnInfo[col]))
                        + ' ,');
            }

            dataStr = dataStr.slice(0, dataStr.length - 1);
            dataStr = dataStr + ' ), \n';
        }
        //--> we remove 3 because we don't need the last \n
        insetStr.push(ins + dataStr.slice(0, dataStr.length - 3) + ';');
    }


    return PostProcessing(insetStr, tableInfo.full, vscode.workspace.getConfiguration('LzScripts'));
}


/**
 * @param {string[]} insetStr
 * @param {vscode.WorkspaceConfiguration} config
 * @param {string} table
 */
function PostProcessing(insetStr, table, config) {
    let allowIdentity = config.get('addIdentityColumns') === true;
    if (allowIdentity) {
        insetStr.unshift(`set identity_insert ${table} on; \ngo; \n`);
        insetStr.push(`set identity_insert ${table} off; \ngo; \n`);
    }

    return insetStr;
}

/**
 * @param {azdata.connection.ConnectionProfile} connection
 * @param {string} query
 */
async function runQuery(connection, query, database = null) {

    try {
        if (connection == null)
            throw new Error('No Connection Found');
        let conProvider = azdata.dataprotocol.getProvider(connection.providerId, azdata.DataProviderType.ConnectionProvider);
        let connectionUri = await azdata.connection.getUriForConnection(connection.connectionId);
	if (connection.providerId == 'MSSQL') {

	   if(database && database != connection.databaseName) {
	   	await conProvider.changeDatabase(connectionUri, database);
           }
	}


        let queryProvider = azdata.dataprotocol.getProvider(connection.providerId, azdata.DataProviderType.QueryProvider);
        return await queryProvider.runQueryAndReturn(connectionUri, query);
    } catch (error) {
        throw new Error(`Error : ${error.message}`);
    }
}
/**
 * @param {azdata.connection.ConnectionProfile} connection
 * @param {string} table
 */
async function tableExists(connection, table, database) {
    let qstr = `select case when 
	(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' and 
	TABLE_NAME = '${table}') = 1 THEN 1 ELSE 0 END as res;`;
    let res = await runQuery(connection, qstr, database);
    return res.rows[0][0].displayValue === "1";
}
function getValue(displayValue, colinfo) {
    switch (colinfo.dataTypeName) {
        case "int": case "bigint": case "bit": case "binary": case "tinyint":
            return parseInt(displayValue);
        case "money": case "decimal": case "float": case "smallmoney": case "numeric":
            return parseFloat(displayValue);
        case "nvarchar":
            return `N'${displayValue.replaceAll("'", "''")}'`;
        case "image":
            return `cast('${displayValue}' as image)`;
        case "varbinary":
            return `cast('${displayValue}' as varbinary(${colinfo.columnSize})`;
        default:
            return `'${displayValue.replaceAll("'", "''")}'`;

    }
}

function IsEmptyObj(obj)
{
    for(var i in obj) 
        return false; 
    return true;
}

function extractTableInfo(sql, providerId) {
    let regex = /\bFROM\s+([\w\.\[\]]+)|\bJOIN\s+([\w\.\[\]]+)|\bUPDATE\s+([\w\.\[\]]+)|\bINTO\s+([\w\.\[\]]+)/ig;
    let match;
    let tables = [];

    while ((match = regex.exec(sql)) !== null) {
        let table = match.slice(1).find(m => m);
        if (table) {
            let parts = table.split(".");
            let tableInfoObj = {};
	    tableInfoObj.database = null;
	
	    if ( providerId == 'MSSQL' ){
		if (parts.length === 3) {
		        tableInfoObj.database = parts[0];
		        tableInfoObj.schema = parts[1];
		        tableInfoObj.table = parts[2];
		        tableInfoObj.full = `${parts[0]}.${parts[1]}.${parts[2]}`;
		} 
	    } 
	    if (parts.length === 2) {
                tableInfoObj.schema = parts[0];
                tableInfoObj.table = parts[1];
                tableInfoObj.full = `${parts[0]}.${parts[1]}`;
            }
	    if (parts.length === 1){
                tableInfoObj.table = parts[0];
                tableInfoObj.full = `${parts[0]}`;
            }

            tables.push(tableInfoObj);
        }
    }

    return tables;
}

//-->obsolete
// function getTableName(query) {
//     let ql = query.toLowerCase();
//     let indexFrom = ql.indexOf('from');
//     let indexJoin = ql.indexOf('join');
//     let indexOrder = ql.indexOf('order');
//     if (indexJoin > 0)
//         return ql.slice(indexFrom + 4, (indexJoin > 0 ? indexJoin : ql.length)).trim().split(' ')[0];

//     if (indexOrder > 0)
//         return ql.slice(indexFrom + 4, (indexOrder > 0 ? indexOrder : ql.length)).trim().split(' ')[0];

//     let indexWhere = ql.indexOf('where');
//     return ql.slice(indexFrom + 4, (indexWhere > 0 ? indexWhere : ql.length)).trim().split(' ')[0];
// }

module.exports.runForInsert = runForInsert;
module.exports.runQuery = runQuery;



