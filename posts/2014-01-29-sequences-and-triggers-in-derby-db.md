---
title: Sequences and Triggers in Derby DB
description: Sequences and Triggers in Derby DB
date: 2014-01-29
tags:
  - Derby DB
  - SQL
layout: layouts/post.njk
---

**Context**

For our unit testing (and data access classes in particular) we use an in-memory Derby Database and auto-map JPA to database objects (DDL). Using EclipseLink this is achieved by setting the property eclipselink.ddl-generation to drop-and-create-tables in Derby DB startup properties. This allows you to test JPA mappings without having to struggle with the difficulties of setting up, maintaining and cleaning up (in our case) an Oracle database. While for the most part the DDL-generation has proven sufficient to test our application logic, not all DDL can be inferred by JPA mappings.

**Problem**

JPA does not support using sequences or auto generated fields on anything other than primary keys. In our case we wanted to use a sequence on a non-primary key. More specifically, we want to store a modification counter that increments each time when any of our entities is updated and use this to calculate the delta in a synchronization job.

**Solution**

To solve the lack of JPA support for sequences on non-primary keys we created our own sequence and a `BEFORE INSERT OR UPDATE` trigger in Oracle to inject the next sequence value in the modification counter field before each insert or update. This caused Derby DB to misrepresent actual application behavior in our unit tests because we were now using non-JPA to set application state. As a result we had to mimic the sequence and trigger behavior in Derby DB as well. Doing so turned out to be somewhat difficult because the Derby documentation section on triggers is [limited](https://db.apache.org/derby/docs/10.3/devguide/cdevspecial27163.html). The example given in the documentation is as follows:

```sql
CREATE TRIGGER trig1
AFTER UPDATE ON flights
REFERENCING OLD AS UPDATEDROW
FOR EACH ROW MODE DB2SQL
INSERT INTO flights_history
VALUES (UPDATEDROW.FLIGHT_ID, UPDATEDROW.SEGMENT_NUMBER,
UPDATEDROW.ORIG_AIRPORT, UPDATEDROW.DEPART_TIME,
UPDATED ROW.DEST_AIRPORT, UPDATEDROW.ARRIVE_TIME,
UPDATEDROW.MEAL, UPDATEDROW.FLYING_TIME, UPDATEDROW.MILES,
UPDATEDROW.AIRCRAFT,'INSERTED FROM trig1');
```

After struggling with syntax errors for a long time while creating a `BEFORE INSERT` in Derby DB (and failing to find any documentation on how to do this), I got the suspicion Derby DB doesn't support this use case.

As a workaround create an `AFTER INSERT` trigger that updates the modification counter in Derby DB like this:

```java
Connection connection = DriverManager.getConnection(
            "jdbc:derby:memory:stampsDB;create=true", "sa", "");

Statement sta = connection.createStatement();

sta.execute("CREATE SEQUENCE MODIFICATION_COUNTER_SEQ AS BIGINT" +
            "START WITH 100 INCREMENT BY 1 MAXVALUE 1000000 NO CYCLE");

sta.execute("CREATE TRIGGER MODIFICATION_COUNTER_TRG " +
            "AFTER INSERT ON MY_TABLE " +
            "REFERENCING NEW AS NEWROW FOR EACH ROW MODE DB2SQL " +
            "UPDATE MY_TABLE O " +
            "SET O.MODIFICATION_COUNTER = " +
                "NEXT VALUE FOR MODIFICATION_COUNTER_SEQ " +
            "WHERE O.ID = NEWROW.ID ");
```

Because entity state is now determined by database logic we do not have the modification counter value available within the application. Normally when using a generated value in JPA the ORM will automatically fetch this for you and update your managed entity. Now you will have to refresh your entity after persisting it:

```java
getEntityManager().persist(entity);

// Flush changes to the database so the modification counter trigger is executed
getEntityManager().flush();

// Refresh the state of the managed entity from the database
getEntityManager().refresh(entity);
```
