# Lazy Scripts

## An Sql Script Generator for Azure Data Studio

Here's a simple script generator for lazy devs like moi 😊.
It generates Insert queries from a select query. The idea here is to allow insert scripts to be generated quickly from a select query.

### How to Use
In the editor, simply select, right-click on the SQL script and click on the `Generate Insert from Result` context menu, Select `To Clipboard` or `To New Tab` to generate query to the clipboard or a new tab respectively.

![Generate Insert from Result](https://raw.githubusercontent.com/LycanII/LzScripts/810e72cfe85a8267a0b35c947893d7f8f867535d/images/contex_2.png)


### Note
* This was done in one caffeine-fueled weekend, so pardon any bugs and prompt me by opening an issue if it acts up.
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

### Change Log

#### [1.0.0]

* Initial release

#### [1.1.0]

* Added Copy to Clipbord feature

#### [1.2.0]

* Added support for strings with single quotes
* Added Progress notification.
* Added Settings to enable export of identity columns(Disabled by default),
to enable go to Settings page `Ctl+,`. Under the `Extensions > LzScripts` section [see release](https://github.com/LycanII/LzScripts/releases/tag/v.1.2.0).

#### [1.3.0]
- No longer restricted to dbo.
- Generates a single insert with multiple values by default, you can disable this behavior, via the settings page, `Ctl+,`. Under the `Extensions > LzScripts`, section enable `Allow Insert Per Row`.

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://raw.githubusercontent.com/LycanII/LzScripts/master/LICENSE) file for details


## Acknowledgments
- This project was highly inspired by the [extraSqlScriptAs Extension](https://github.com/pacoweb/extraSqlScriptAs) by [pacoweb](https://github.com/pacoweb)
- Much Thanks to Eugene the Sql Doctor 👌 

**Enjoy!**
