---
title: Installing Deployable Libraries on WebLogic
description: Installing Deployable Libraries (e.g. JSF/JSLT) on WebLogic 10.3
date: 2013-01-04
tags:
  - Java
  - WebLogic
layout: layouts/post.njk
---

WebLogic comes with a set of deployable libraries available in `{WL_HOME}/wlserver_10.3/common/deployable-libraries` that can easily be deployed as shared libraries. The deployable libraries available on my WLS 10.3.5 installation are:

- active-cache-1.0.jar
- jsf-1.2.war
- jstl-1.2.war
- jackson-core-asl-1.1.1.war
- jsf-2.0.war rome-1.0.war
- jackson-jaxrs-1.1.1.war
- jsf-myfaces-1.1.7.war
- toplink-grid-1.0.jar
- jackson-mapper-asl-1.1.1.war
- jsf-ri-1.1.1.war
- weblogic-sca-1.1.war
- jersey-bundle-1.1.5.1.war
- jsr311-api-1.1.1.war
- jettison-1.1.war
- jstl-1.1.2.war

Because I prefer my EAR, WAR and EJB archives to be self-contained I've experimented little with these shared libraries thus far. However I ran into a problem where my `@EJB` wouldn't load in a managed bean. The cause was the following startup error:

```xml
<Jan 3, 2013 11:27:42 PM CET> <Error> <javax.enterprise.resource.webcontainer.jsf.application> <BEA-000000> <JSF1030: The specified InjectionProvider implementation 'com.bea.faces.WeblogicInjectionProvider' cannot be loaded.>
```

The solution was to install the shared JSF 2.0 weblogic deployable and update the `weblogic.xml` like this:

```xml
<weblogic-web-app xmlns="http://xmlns.oracle.com/weblogic/weblogic-web-app"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd http://xmlns.oracle.com/weblogic/weblogic-web-app http://xmlns.oracle.com/weblogic/weblogic-web-app/1.0/weblogic-web-app.xsd">

    <!-- Needed if you deploy on weblogic server with a JSF shared library -->
    <library-ref>
        <library-name>jsf</library-name>
        <specification-version>2.0</specification-version>
        <implementation-version>1.0.0.0_2-0-2</implementation-version>
        <exact-match>true</exact-match>
    </library-ref>

</weblogic-web-app>
```

This made my application use the shared library instead of using its own JSF bundled library. Not sure why this made any difference at all, possibly a versioning problem, but haven't found out since and it has been running without issues.

To install and configure the JSF 2.0 Weblogic deployable archive have a look here:
[http://docs.oracle.com/cd/E21764_01/web.1111/e13712/configurejsfandjtsl.htm](http://docs.oracle.com/cd/E21764_01/web.1111/e13712/configurejsfandjtsl.htm)

The idea is to use `weblogic.Deployer` located in `{WL_HOME}wlserver_10.3/server/lib/weblogic.jar`. You can add `weblogic.jar` to your classpath or include it directly in the java command like this:

```text
java -cp /u01/app/oracle/Middleware/wlserver_10.3/server/lib/weblogic.jar weblogic.Deployer -adminurl t3://localhost:7001 -user weblogic -password Welcome1 -deploy -library /u01/app/oracle/Middleware/wlserver_10.3/common/deployable-libraries/jsf-2.0.war
```
