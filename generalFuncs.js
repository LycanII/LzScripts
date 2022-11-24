
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

    let tableFull = getTableName(query).replaceAll(';','');
    let breakdown = tableFull.split('.');
    let table = breakdown[breakdown.length-1].replaceAll('[','').replaceAll(']','').replaceAll(';','');

    //--> the place of sadness :(
    // let table = tableFull.indexOf('dbo') >= 0 ?
    //     tableFull.slice(tableFull.indexOf('dbo') + 4).replaceAll('.', '').replaceAll('[', '').replaceAll(']', '')
    //     : tableFull.replaceAll('.', '').replaceAll('[', '').replaceAll(']', '');
    //--> the place of sadness :(

    let tblExist = await tableExists(connection, table);
    if (!tblExist)
        throw new Error('Target Table not found');


    let data = await runQuery(connection, query);
    if (data.rowCount == 0)
        throw new Error('No records found');

    let ins = 'insert into ' + tableFull + ' (';

    //--> get cols except identity , autogen cols
    for (let i = 0; i < data.columnInfo.length; i++) {
        if (data.columnInfo[i].isIdentity === true && !allowIdentity)
            continue;

        if (data.columnInfo[i].dataTypeName !== 'timestamp')
            ins += (' [' + data.columnInfo[i].columnName + '] ,');
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


    return PostProcessing(insetStr, tableFull, vscode.workspace.getConfiguration('LzScripts'));
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
async function runQuery(connection, query) {

    try {
        if (connection == null)
            throw new Error('No Connection Found');
        let conProvider = azdata.dataprotocol.getProvider(connection.providerId, azdata.DataProviderType.ConnectionProvider);
        await conProvider.changeDatabase(connection.connectionId, connection.databaseName);
        let connectionUri = await azdata.connection.getUriForConnection(connection.connectionId);


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
async function tableExists(connection, table) {
    let qstr = `IF EXISTS (SELECT 1 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE='BASE TABLE' 
        AND TABLE_NAME='${table}') 
        SELECT 1 AS res ELSE SELECT 0 AS res;`;
    let res = await runQuery(connection, qstr);
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
function getTableName(query) {
    let ql = query.toLowerCase();
    let indexFrom = ql.indexOf('from');
    let indexJoin = ql.indexOf('join');
    let indexOrder = ql.indexOf('order');
    if (indexJoin > 0)
        return ql.slice(indexFrom + 4, (indexJoin > 0 ? indexJoin : ql.length)).trim().split(' ')[0];

    if (indexOrder > 0)
        return ql.slice(indexFrom + 4, (indexOrder > 0 ? indexOrder : ql.length)).trim().split(' ')[0];

    let indexWhere = ql.indexOf('where');
    return ql.slice(indexFrom + 4, (indexWhere > 0 ? indexWhere : ql.length)).trim().split(' ')[0];
}

module.exports.runForInsert = runForInsert;
module.exports.runQuery = runQuery;



