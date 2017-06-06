# Creating tablespace and user in Oracle XE 11g

I was asked several times how to create a new tablespace and assign it to a new user with permission in Oracle XE. Not being a DBA it took me some trial & error to get it working. For future reference (primarily for myself) I'll share the commands I used here.

**Creating an Oracle XE tablespace**

Execute the following SQL command on the Oracle XE database:

    create tablespace MYTABLESPACE datafile '<path>' 
        size 32m autoextend on 
        next 32m maxsize 2048m extent management local;

In windows the `<path>` can be something like `C:\oraclexe\app\oracle\oradata\XE\MYTABLESPACE.dbf` and in linux `/oracle/xehome/app/oracle/oradata/XE/MYTABLESPACE.dbf` or `/u01/app/oracle/oradata/XE/MYTABLESPACE.dbf`. The `.dbf` file should be created automatically. If it doesn't, check if the path is valid.

It should go without saying you should change the quota to fit your needs.

**Creating a user and granting permissions**

Run the following SQL statements to create a `MYTABLESPACE`-user with common permissions:

    CREATE USER MYTABLESPACEUSER IDENTIFIED BY MyPassword123 
    DEFAULT TABLESPACE "MYTABLESPACE" 
    TEMPORARY TABLESPACE "TEMP";

    ALTER USER MYTABLESPACEUSER QUOTA UNLIMITED ON MYTABLESPACE;

    GRANT create procedure, create session, create table,
    create type, create view, create synonym, create trigger, resource TO MYTABLESPACEUSER;