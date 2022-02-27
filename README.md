# Lazy Scripts

## An Sql Script Generator for Azure Data Studio

Here's a simple script generator for lazy devs like moi :)
As at now it generates Insert Queries from a select query. The idea here is to allow quick insert scripts to be genterated from a select query.

### How to Use
In the editor, simply select, right click on the sql scrip and click on the `Generate Insert from Result` context menu.

![Generate Insert from Result](https://user-images.githubusercontent.com/49438182/155882668-4a1c5c7a-5865-4182-ac21-0c867ce9590b.png)


### Note 
* Supports only the `dbo` database schema if added.
* Uses the first table it finds after the `from` clause in your select query as the target table for Insert.
  So `select * from table` and `select * from databaseName.dbo.table` is supported. See below for more examples.
 
####  Examples of possible scripts supported.
`plain old joins`
```
select t1.* from table1 t1
inner join table2 t2 on t1.ItemID  = t2.ItemID
where i.ItemID = 10 
```
`with subqueries`
```
select t1.* from table1 t1
where t1.ItemID in (
  select top (20) t2.ItemID from table2 t2 
) 
```

**Enjoy!**
