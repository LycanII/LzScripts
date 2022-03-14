# Lazy Scripts

## An Sql Script Generator for Azure Data Studio

Here's a simple script generator for lazy devs like moi 😊.
As at now it generates Insert queries from a select query. The idea here is to allow  insert scripts to be genterated quickly from a select query.

### How to Use
In the editor, simply select, right click on the sql script and click on the `Generate Insert from Result` context menu, Select `To Clipboard` or `To New Tab` to generate query to clipboard or to a new tab respectively.

![Generate Insert from Result](https://raw.githubusercontent.com/LycanII/LzScripts/5c7dabc293b459e32c9ce7e2c9ad3b7f18b87a98/images/contex_2.png)


### Note
* This was done in One caffine-fueled weekend, hence it's likely buggy and is provided as is. Kindly prompt me, by opening an issue if it's acting up.
* Currently supports only `MSSQL`.
* Supports only the `dbo` database schema if added.
* Uses the first table it finds after the `from` clause in your select query as the target table for Insert.
  So `select * from table` and `select * from databaseName.dbo.table` is supported. See below for more examples.
 
####  Examples of possible scripts supported.
`plain old joins`
```
select t1.* from table1 t1
inner join table2 t2 on t1.ItemID  = t2.ItemID
where t1.ItemID = 10 
```
`with subqueries`
```
select t1.* from table1 t1
where t1.ItemID in (
  select top (20) t2.ItemID from table2 t2 
) 
```
## License

This project is licensed under the MIT License - see the [LICENSE.md](https://raw.githubusercontent.com/LycanII/LzScripts/master/LICENSE) file for details


## Acknowledgments
- This project was highly inspired by the [extraSqlScriptAs Extension](https://github.com/pacoweb/extraSqlScriptAs) by [pacoweb](https://github.com/pacoweb)
- Much Thanks to Eugene the Sql Doctor 👌 

**Enjoy!**
