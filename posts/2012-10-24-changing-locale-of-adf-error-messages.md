---
title: Changing Locale of ADF Error Messages
description: Changing Locale of ADF Error Messages
date: 2012-10-24
permalink: /posts/2012-10-24/changing-locale-of-adf-error-messages/index.html
tags:
  - ADF
layout: layouts/post.njk
---

Working with ADF (11.1.1.6) on a Dutch locale I was getting error message like these:

```text
Caused by: oracle.mds.core.MetadataNotFoundException: MDS-00013: Geen metagegevens gevonden voor metagegevensobject "/nl/svb/ddb/dossierviewer/view/DataControls.dcx"
```

A query in Google with error type and/or code often yields different errors in blogs, forums and documentation. Rather than looking for the right one or translating the native (in my case Dutch) message, you can force the server to use a different locale.

In JDeveloper select “Application” from the menubar and click “Application Properties -> Run -> Application Server Properties”. Next go to the "Launch Settings"-tab (see also screenshot below). In this tab add the following java options:

```text
-Duser.language=en -Duser.country=US
```

Change the language ('en') and territory suffix ('US') to your liking.

![Application settings](/img/application_settings_java_options.jpg)

If you want to change the locale only for a single project rather than all your applications; select the project, right-click and go to "Project Properties -> Run/Debug/Profile" and select a run configuration. Click "Edit" and add the `user.language` and `user.country` java options. Restart the server afterwards.

If you are working on a separate server you can add the java options directly to the startup script of your webserver as well (for WebLogic look for `setDomainEnv.cmd/.sh`).
