---
title: Adding a File to Framework Folders in WebCenter Content using RIDC
description: Adding a File to Framework Folders in WebCenter Content using RIDC
date: 2012-10-08
tags:
  - WebCenter Content
  - RIDC
layout: layouts/post.njk
---

Lately I've been experimenting with [RIDC](http://docs.oracle.com/cd/E23943_01/doc.1111/e10807/c23_ridc.htm) (Remote Intradoc Client), a light-weight communication protocol for Oracle WebCenter Content.

One requirement I was trying to solve was adding a file to a Framwork Folder. "Framework Folders" is a new folder hierachy component introduced in PatchSet 5 (11.1.1.6) and replaces the older "Folders_g" component. Framework Folders fixed the scalability issues which occurred using Folders_g.

Before I discuss my approach, let me make it clear I am unfamiliar with the old Folders_g approach and I have limited experience using WebCenter Content. Nevertheless the material I found on this subject on the web is sufficiently limited to warrent this blogpost.

I'll split this blogpost in two parts:

1. Uploading a File in WebCenter Content PS5
2. Adding a file to a Framework Folder in WebCenter Content using RIDC

## 1. Uploading a File in WebCenter Content PS5

**Context**

You have got a WebCenter Content (WCC) server running (PS5 minimum) and have decided on using RIDC to integrate your (independent) software component with WCC.

**Problem**

You want to upload a file in WebCenter Content.

**Solution**

Create a [RIDC connection](http://docs.oracle.com/cd/E23943_01/doc.1111/e10807/c23_ridc.htm) and use the [CHECKIN_UNIVERSAL](http://docs.oracle.com/cd/E23943_01/doc.1111/e11011/c04_core.htm#BABJGAFB) service to upload the file to the content server.

**Detailed Solution**

In your IDE (I am using Eclipse) create a new standard Java project. First we need to establish a connection with our content server. There are several methods available to do this but currently the most popular one is using Remote Intradoc Client (RIDC). RIDC supports several connection types (idc, idcs, http, https, and jax-ws) and depending on the connection type you need to import [one or more dependencies](http://docs.oracle.com/cd/E23943_01/doc.1111/e10807/c23_ridc.htm#BABDCJAA). Because I want to keep things simple and I am connecting to a server running on localhost I will be using the idc protocol. For this protocol you only need the `oracle.ucm.ridc-11.1.1.jar` which you can find in the UCM distribution folder of your WCC install. In my case this was: `D:\Oracle\WebCenter\Oracle_ECM1\ucm\Distribution\RIDC`

Time to create the connection:

```java
import oracle.stellent.ridc.IdcClient;
import oracle.stellent.ridc.IdcClientException;
import oracle.stellent.ridc.IdcClientManager;
import oracle.stellent.ridc.IdcContext;

public class TestUpload {

    private IdcClient client;
    private IdcContext connectionContext;

    public static void main(String[] args) throws IdcClientException {
        TestUpload upload = new TestUpload();
        upload.createConnection("idc://localhost:4444", "sysadmin", "Welcome1");
    }

    public void createConnection(final String connectURL, String username,
        String password) throws IdcClientException {
        System.out.println("Connecting to content server at " + connectURL
                + " using username " + username + " and password");
        try {
            IdcClientManager idcClientManager = new IdcClientManager();
            this.client = idcClientManager.createClient(connectURL);
        } catch (IdcClientException e) {
            System.out.println("Error occurred while establishing client");
            throw e;
        }
        this.connectionContext = new IdcContext(username, password);
        System.out.println("Succesfully connected RIDC client to " + connectURL);
    }
}
```

What suprised me a was the username and password are stored separately from the client and are added to each individual service request later on (you'll see this in the next code example). This allows some flexibility if you want to swap user credentials over the same connection... a flexibility I won't be using here. If you don't need this flexibility in your application you might want to create a connection wrapper for the `IdcClient` and `IdcContext` (and possibily the `IdcClientManager` as well) to create more readable code.

In the example I'm using the "sysadmin" account which is allowed to do pretty much anything in WCC. In production code you're advised to connect using the most limited account sufficient to fulfill the user requirement ([principle of least privilege](http://en.wikipedia.org/wiki/Principle_of_least_privilege)).

Checking in a file in WCC PS5 is no different than prior versions of WCC as far as I know. I'll be using the [CHECKIN_UNIVERSAL](http://docs.oracle.com/cd/E23943_01/doc.1111/e11011/c04_core.htm#BABJGAFB) service which is the most versatile checkin service WCC provides. Depending on whether the file already exists and whether it is in a workflow or not it executes a more specific checkin service.

Whenever using WCC services, read their [specification](http://docs.oracle.com/cd/E23943_01/doc.1111/e11011/c04_core.htm#BABJGAFB) carefully. If you get any parameter names wrong you're likely to receive vague error messages. and work throuh several hours of unnecessary debugging.

This next piece of code demonstrates `CHECKIN_UNIVERSAL`:

```java
import java.io.File;
import java.io.IOException;

import oracle.stellent.ridc.IdcClient;
import oracle.stellent.ridc.IdcClientException;
import oracle.stellent.ridc.IdcClientManager;
import oracle.stellent.ridc.IdcContext;
import oracle.stellent.ridc.model.DataBinder;
import oracle.stellent.ridc.model.TransferFile;
import oracle.stellent.ridc.protocol.ServiceResponse;
import ridcoo.ridc.util.RIDCUtils;

public class TestUpload {

    private IdcClient client;
    private IdcContext connectionContext;

    public static void main(String[] args) throws IdcClientException, IOException {
        TestUpload upload = new TestUpload();
        upload.createConnection("idc://localhost:4444", "sysadmin", "Welcome1");
        upload.uploadFile("Test RIDC", "Public", "D:\\Temp\\testfile.png");
    }

    public void createConnection(final String connectURL, String username,
            String password) throws IdcClientException {
        System.out.println("Connecting to content server at " + connectURL
                + " using username " + username + " and password");

        try {
            IdcClientManager idcClientManager = new IdcClientManager();

            this.client = idcClientManager.createClient(connectURL);
        } catch (IdcClientException e) {
            System.out.println("Error occurred while establishing client");
            throw e;
        }

        this.connectionContext = new IdcContext(username, password);

        System.out.println("Succesfully connected RIDC client to " + connectURL);
    }

    public ServiceResponse uploadFile(String docTitle, String securityGroup,
            String filePath) throws IdcClientException, IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            System.out.println("File " + filePath + " does not exist");
            return null;
        }
        DataBinder requestData = client.createBinder();

        // 1) Empty data
        System.out.println(RIDCUtils.dataBinderToString(requestData));

        requestData.putLocal("IdcService", "CHECKIN_UNIVERSAL");
        requestData.putLocal("dDocType", "Document");
        requestData.putLocal("dDocTitle", docTitle);
        requestData.putLocal("dDocAuthor", connectionContext.getUser());
        requestData.putLocal("dSecurityGroup", securityGroup);
        requestData.addFile("primaryFile", new TransferFile(file));

        // 2) Service request data
        System.out.println(RIDCUtils.dataBinderToString(requestData));

        ServiceResponse response = client.sendRequest(connectionContext, requestData);
        DataBinder responseData = response.getResponseAsBinder();

        // 3) Service request response data
        System.out.println(RIDCUtils.dataBinderToString(responseData));

        return response;
    }
}
```

The new method `uploadFile` takes three parameters: a `docType`, `securityGroup` and `filePath`. The `filePath` is converted to an `oracle.stellent.ridc.model.TransferFile` which RIDC uses to transport the file over the IDC protocol.

By default there are two security groups you can play with: Public and Secure. You can create your own security groups to separate content better (for example by department). Finally the docType describes the content type. You can retrieve the available content types using [GET_DOCTYPES](http://docs.oracle.com/cd/E28389_01/doc.1111/e11011/c04_core.htm#autoId19), the most likely candidate however is "Document".

If you would have read the previous code example carefully you would have noticed the `DataBinder` class. This `DataBinder` is the data container used throughout WCC and contains four components:

- `LocalData`: all data associated with the request and response itself. These include request parameters you set yourself and any response parameters set by the content server.
- `Options`: I have no idea yet what these do, I haven't seen them used in my RIDC experiments.
- `ResultSets`: data stored in key/value pairs which have been requested by the user through a service call. These key/value pairs are stored in a named set. Depending on the service the response contains zero, one or multiple named sets.
- `Files`: used for TransferFiles.

I have been unable to find exact definitions of these `DataBinder`-components in the Oracle documentation. I like to think of `LocalData` as the header data and `ResultSets` & `Files` as the message body (or bodies), much like the HTTP protocol.

To get a better understanding of the DataBinder during development and debugging I've printed the DataBinder three times in the previous code (if you hadn't noticed; despite the admirable laziness of your geek-reading skillz, I do ask you to pay better attention in the future).

Just after creating a new `DataBinder` it contains the following:

```text
DataBinder {
    Files {
        none
    }
    LocalData {
        UserDateFormat = iso8601
        UserTimeZone = UTC
    }
    Options {
        none
    }
    ResultSets {
        none
    }
}
```

By default the user's date format (iso8601) and timezone are set.

After setting the request parameters the `DataBinder` changes to something like this:

```text
DataBinder {
    Files {
        File name = primaryFile
        Content length = {testfile.png [application/octet-stream,71754]}    }
    LocalData {
        IdcService = CHECKIN_UNIVERSAL
        UserDateFormat = iso8601
        UserTimeZone = UTC
        dDocAuthor = sysadmin
        dDocTitle = Test Folder upload
        dDocType = Document
        dSecurityGroup = Public
    }
    Options {
        none
    }
    ResultSets {
        none
    }
}
```

Not much suprising here; the `primaryFile` is added to the `Files` section of the `DataBinder` and the other request parameters are set as `LocalData`. More interesting is the `DataBinder` response after executing the service request:

```text
DataBinder {
    Files {
        none
    }
    LocalData {
        ClientEncoding = UTF-8
        DocExists =
        IdcService = CHECKIN_UNIVERSAL
        LockedContents1 = dDocName:CS000876
        NoHttpHeaders = 0
        RenditionId = webViewableFile
        StatusCode = 0
        StatusMessage = Inhouditem 'CS000876' is ingecheckt.
        StorageRule = DispByContentId
        UserDateFormat = iso8601
        UserTimeZone = UTC
        VaultfilePath = d:/tools/Oracle/WEBCEN~1/USER_P~1/domains/WEBCEN~1/ucm/cs/vault/document/mgnz/mdaw/875.png
        WebfilePath = d:/tools/Oracle/WEBCEN~1/USER_P~1/domains/WEBCEN~1/ucm/cs/weblayout/groups/public/documents/document/mgnz/mdaw/~edisp/cs000876~1.png
        auditAction = wwCreate
        auditActionClass = wwCreate
        auditObjectType = wwRmaRecord
        auditResultSet = DOC_INFO
        blDateFormat = yyyy-MM-dd HH:mm:ssZ!tUTC!mAM,PM
        blFieldTypes = xCategoryFolder text,dSubscriptionNotifyDate date,xHasFixedClone int,xWebFlag text,xIPMSYS_STATUS text,xReportDataSourceType text,xIsFixedClone int,xStorageRule text,xIPMSYS_REDACTION int,xForceFolderSecurity text,xFreezeID memo,xReadOnly text,xIsEditable text,xWCTags text,xInhibitUpdate text,xWCWorkflowAssignment text,xHideIncludeChildFolders int,dCreateDate date,xCategoryID bigtext,xHidden text,dSubscriptionCreateDate date,xReportScheduledInfo text,xCpdIsLocked int,StatusMessage message,xCollectionID int,dSubscriptionUsedDate date,xLifeCycleID bigtext,xIPMSYS_APP_ID text,xWCWorkflowApproverUserList memo,xComments memo,xIsRecord text,xReportContentType text,dActionDate date,xWCPageId bigtext,xCpdIsTemplateEnabled int,xRecordFilingDate date,xReportType text,xIPMSYS_BATCH_ID1 int,xIPMSYS_PARENT_ID int,dOutDate date,xExternalDataSet bigtext,xIsFrozen text,xIsDeletable text,xReportFormat text,xPartitionId text,dInDate date,xIPMSYS_BATCH_SEQ text,dMessage message,xReportTemplate text,xReportDataSourceParams text,xIPMSYS_SCKEY text,xFreezeReason memo,dReleaseDate date,xFolderID bigtext,xReportDataSource text,xIsRevisionable text,xIdcProfile text
        changedMonikers =
        changedSubjects = documents,1349171311089
        dAction = Checkin
        dActionDate = 2012-10-08 15:36:00Z
        dActionMillis = 52514543
        dClbraName =
        dConversion = PassThru
        dCreateDate = 2012-10-08 15:36:14Z
        dDocAccount =
        dDocAuthor = sysadmin
        dDocCreatedDate = {ts '2012-10-08 17:36:14.522'}
        dDocCreator = sysadmin
        dDocID = 932
        dDocLastModifiedDate = {ts '2012-10-08 17:36:14.522'}
        dDocLastModifier = sysadmin
        dDocName = CS000876
        dDocOwner = sysadmin
        dDocTitle = Test Folder upload
        dDocType = Document
        dDocType:rule = IpmSystemFields_Restricted
        dExtension = png
        dFileSize = 71754
        dFormat = image/png
        dID = 875
        dInDate = 2012-10-08 15:36:14Z
        dIsPrimary = 1
        dIsWebFormat = 0
        dLastModifiedDate = {ts '2012-10-08 17:36:14.545'}
        dLocation =
        dOriginalName = testfile.png
        dOutDate =
        dProcessingState = Y
        dPublishState =
        dPublishType =
        dRawDocID = 931
        dReleaseState = N
        dRevClassID = 876
        dRevLabel = 1
        dRevRank = 0
        dRevisionID = 1
        dRmaProcessState = O
        dSecurityGroup = Public
        dSecurityGroup:rule = IpmSystemFields_Restricted
        dStatus = DONE
        dUser = sysadmin
        dVitalState = O
        dWebExtension = png
        dWebOriginalName = CS000876~1.png
        dWorkflowState =
        dpAction = CheckinNew
        dpEvent = OnImport
        dpTriggerField = xIdcProfile
        idcToken =
        isCheckin = 1
        isDocProfileDone = 1
        isDocProfileUsed = true
        isEditMode = 1
        isInfoOnly =
        isNew = 1
        isStatusChanged = 1
        localizedForResponse = 1
        mustAllowDeletes =
        mustAllowEdits =
        mustAllowRevisions =
        noDocLock = 1
        prevReleaseState =
        primaryFile = testfile.png
        primaryFile:path = d:/tools/Oracle/WEBCEN~1/USER_P~1/domains/WEBCEN~1/ucm/cs/vault/~temp/2015661264.png
        refreshMonikers =
        refreshSubMonikers =
        refreshSubjects =
        reserveLocation = false
        scriptableActionErr =
        scriptableActionFlags = 12
        scriptableActionFunction = determineCheckin
        scriptableActionParams =
        scriptableActionType = 3
        xCategoryFolder =
        xCategoryFolder:isSetDefault = 1
        xCategoryID =
        xCategoryID:isSetDefault = 1
        xClbraAliasList =
        xClbraUserList =
        xCollectionID = 0
        xCollectionID:isSetDefault = 1
        xComments =
        xComments:isSetDefault = 1
        xCpdIsLocked = 0
        xCpdIsLocked:isSetDefault = 1
        xCpdIsTemplateEnabled = 0
        xCpdIsTemplateEnabled:isSetDefault = 1
        xExternalDataSet =
        xExternalDataSet:isSetDefault = 1
        xFolderID =
        xFolderID:isSetDefault = 1
        xForceFolderSecurity = FALSE
        xForceFolderSecurity:isSetDefault = 1
        xFreezeID = 0
        xFreezeID:isSetDefault = 1
        xFreezeReason =
        xFreezeReason:isSetDefault = 1
        xHasFixedClone = 0
        xHasFixedClone:isSetDefault = 1
        xHidden = FALSE
        xHidden:isSetDefault = 1
        xHideIncludeChildFolders = 0
        xHideIncludeChildFolders:isSetDefault = 1
        xIPMSYS_APP_ID =
        xIPMSYS_APP_ID:isSetDefault = 1
        xIPMSYS_APP_ID:rule = IpmSystemFields_Hide
        xIPMSYS_BATCH_ID1 = 0
        xIPMSYS_BATCH_ID1:isSetDefault = 1
        xIPMSYS_BATCH_ID1:rule = IpmSystemFields_Hide
        xIPMSYS_BATCH_SEQ =
        xIPMSYS_BATCH_SEQ:isSetDefault = 1
        xIPMSYS_BATCH_SEQ:rule = IpmSystemFields_Hide
        xIPMSYS_PARENT_ID = 0
        xIPMSYS_PARENT_ID:isSetDefault = 1
        xIPMSYS_PARENT_ID:rule = IpmSystemFields_Hide
        xIPMSYS_REDACTION = 0
        xIPMSYS_REDACTION:isSetDefault = 1
        xIPMSYS_REDACTION:rule = IpmSystemFields_Hide
        xIPMSYS_SCKEY =
        xIPMSYS_SCKEY:isSetDefault = 1
        xIPMSYS_SCKEY:rule = IpmSystemFields_Hide
        xIPMSYS_STATUS =
        xIPMSYS_STATUS:isSetDefault = 1
        xIPMSYS_STATUS:rule = IpmSystemFields_Hide
        xIdcProfile =
        xIdcProfile:isSetDefault = 1
        xInhibitUpdate = FALSE
        xInhibitUpdate:isSetDefault = 1
        xIsDeletable = 1
        xIsDeletable:isSetDefault = 1
        xIsEditable = 1
        xIsEditable:isSetDefault = 1
        xIsFixedClone = 0
        xIsFixedClone:isSetDefault = 1
        xIsFrozen = 0
        xIsFrozen:isSetDefault = 1
        xIsRecord = 0
        xIsRecord:isSetDefault = 1
        xIsRevisionable = 1
        xIsRevisionable:isSetDefault = 1
        xLifeCycleID =
        xLifeCycleID:isSetDefault = 1
        xPartitionId =
        xPartitionId:isSetDefault = 1
        xReadOnly = FALSE
        xReadOnly:isSetDefault = 1
        xRecordFilingDate = 2012-10-08 15:36:14Z
        xRecordFilingDate:isSetDefault = 1
        xReportContentType =
        xReportContentType:isSetDefault = 1
        xReportDataSource =
        xReportDataSource:isSetDefault = 1
        xReportDataSourceParams =
        xReportDataSourceParams:isSetDefault = 1
        xReportDataSourceType =
        xReportDataSourceType:isSetDefault = 1
        xReportFormat =
        xReportFormat:isSetDefault = 1
        xReportScheduledInfo =
        xReportScheduledInfo:isSetDefault = 1
        xReportTemplate =
        xReportTemplate:isSetDefault = 1
        xReportType =
        xReportType:isSetDefault = 1
        xStorageRule = DispByContentId
        xStorageRule:isSetDefault = 1
        xWCPageId =
        xWCPageId:isSetDefault = 1
        xWCTags =
        xWCTags:isSetDefault = 1
        xWCWorkflowApproverUserList =
        xWCWorkflowApproverUserList:isSetDefault = 1
        xWCWorkflowAssignment =
        xWCWorkflowAssignment:isSetDefault = 1
        xWebFlag =
        xWebFlag:isSetDefault = 1
    }
    Options {
        none
    }
    ResultSets {
        none
    }
}
```

This long dataset provides a wealth of information but also makes it challenging to find what you need. One important parameter in this case is the `dDocName` (value = CS000864), also known as the content ID. This is the generated content ID of our uploaded file. Many other WCC services require this content ID as a service request parameter and if your third-party application has its own hydrated domain model you'll likely want to store this value somewhere.

Other parameters you are likely going to need are `StatusCode` and `StatusMessage` which contain the service request execution result. So far I've found a `StatusCode` of 0 and null (not set) indicate success, and anything else requires explicit processing like error handling or warning messages.

If you're interested in the code how to print the `DataBinder` (using `ridcoo.ridc.utils.RIDCUtils`) go to the bottom of this blog.

This section showed a minimalist approach to adding a file in WebCenter Content. Let us now look at how to add our newly created file to a Framework Folder.

## 2. Adding a file to a Framework Folder in WebCenter Content using RIDC

**Context**

You have a WebCenter Content (WCC) server running (PS5 minimum), enabled the Framework Folders component and have decided on using RIDC to add a file to a folder in WebCenter Content.

**Problem**

There is no service request parameter in the `CHECKIN` service to specify in which folder to put the uploaded document.

**Solution**

The short answer is you cannot _put a file_ in a content server folder; you can only create a link to the file in a Framework Folder. Think of it as creating a shortcut or symbolic link instead of copying the file to the actual folder.

While I'm unfamiliar with the old Folders_g (or Contribution Folders) component, I believe this is a radical change from the old model which makes Framework Folders more scalable than Folders_g.

To create a link to the file in a Framework Folder you can use the [FLD_CREATE_FILE](http://docs.oracle.com/cd/E23943_01/doc.1111/e11011/c08_frameworkfolders.htm#CHDJDDDD) service after you've uploaded the document in WCC.

Be aware, the documentation of `FLD_CREATE_FILE` is yet, well... _cough_... slightly, uhm... limited. So you might want to keep reading.

**Detailed solution**

Due to ambiguity in the WCC Service API I lost quite some time solving naming bugs. The following definition list is a heads up:

- **Contribution folders**: a collection of features that used to be the Folders and Folders_g components (see [documentation](http://docs.oracle.com/cd/E28389_01/doc.1111/e11011/c07_folders.htm#i1082567)). The main feature of these components is a directory structure users can checkin and checkout content from. Additional features include search, locking, moving, updating and securing content items. Everything related to contribution folders is consistently referred to as a `COLLECTION`. All contribution folder services are prefixed with `COLLECTION`, and service parameter have `dCollectionXXX` as their name. Most documentation on the web on how to add and change content using RIDC will use the old contribution folders functionality so you're likely to see it from time to time. Just know this: contribution folders should be considered deprecated.
- **Archive**: the WebCenter Content archive is a feature I'm yet unfamiliar with. I do know from (painful) experience it adds to the ambiguous language of the WCC service API. Services like `ADD_COLLECTION` and `REMOVE_COLLECTION` refer to an Archive Collection rather than a Contribution Folder/Collection. Just remember, service names starting with `COLLECTION` are Contribution Folder services and the rest isn't.
- **Records management**: records describe a physical or digital asset. Because records management comes with WebCenter Content you can easily create records for digital assets stored in the content server. Records are often used for retention management. Records are stored in folders for better manageability (Yay!), but unfortunately for us developers the RecordFolder is referred to as simply Folder. The database table used for storing RecordFolders is called `FOLDERS` and any services with `[A-Z_]_FOLDER_[A-Z_]` as their name are a RecordFolder service. Finally, record service parameters usually start with dFolder (for example dFolderID).
  I'm guessing this situation came about because records management and content management used to be two different products and later got integrated without resolving the language ambiguity.
- **Framework Folders**: Framework Folders replace the Contribution Folders features. The documentation refers to them as [Folders Services](http://docs.oracle.com/cd/E28389_01/doc.1111/e11011/c08_frameworkfolders.htm#CHDCBDBJ) which can be confusing for developers who have used the old Folders component, and for us newbees it is confusing with Records Folders. Fortunately the `FLD_` prefix naming convention is applied consistently and makes the new Folders Services clearly stand out. Folder Service parameters are usually prefixed with an "f" instead of a "d" to avoid confusion between framework folders and records management service parameters.

If you're a bit confused by this list, don't worry, I still am. Just be careful, that's all.

The documentation on (Framework) Folder Services is quite brief. The documentation on 8-10-2012 for `FLD_CREATE_FILE` reads as follows:

> 8.2.4 FLD_CREATE_FILE
>
> Service that creates a link to a document in Folders.
> Service Class: intradoc.folders.FoldersService
>
> Location: IdcHomeDir/resources/frameworkfolders_service.htm
>
> Required Service Parameters
>
> fParentGUID: The GUID of the parent folder in which the new link will be created.
>
> Optional Service Parameters
>
> \$fileMeta: Metadata to be assigned to the link.

(I have been unable to find a definition of \$fileMeta)

With this description you won't get far. The service appears to take only one service parameter: `fParentGUID`. There is no service parameter describing which file you want to link to. Not getting any further I found a post on [OTN](https://forums.oracle.com/forums/thread.jspa?threadID=2445145&tstart=1) of someone who experienced the exact same problem. The answer didn't get me far but the author describes two other service parameters: `dDocName` and `fFileType`. `dDocName` is the content item ID, and `fFileType` is more like a 'fRelationshipType' or 'fLinkType' describing the type of link/relationship between the folder and file. The only two possible values for `fFileType` are "owner" and "soft". An "owner" link you can think of as the actual location of the file, "soft"-links are mere shortcuts to this file. You can have only one "owner" link and any number of "soft" links.

I simply tried calling `FLD_CREATE_FILE` with these three parameters and it worked. As it turns out all three parameters are required and you get vague error messages when you leave them out.

Knowing this we can now create a file link in a Framework Folder:

```java
package ridcoo;

import java.io.File;
import java.io.IOException;

import oracle.stellent.ridc.IdcClient;
import oracle.stellent.ridc.IdcClientException;
import oracle.stellent.ridc.IdcClientManager;
import oracle.stellent.ridc.IdcContext;
import oracle.stellent.ridc.model.DataBinder;
import oracle.stellent.ridc.model.DataResultSet;
import oracle.stellent.ridc.model.TransferFile;
import oracle.stellent.ridc.protocol.ServiceResponse;
import ridcoo.ridc.util.RIDCUtils;

public class TestUpload {

    private IdcClient client;
    private IdcContext connectionContext;

    public static void main(String[] args) throws IdcClientException, IOException {
        TestUpload upload = new TestUpload();

        // Create IDC connection
        upload.createConnection("idc://localhost:4444", "sysadmin", "Welcome1");

        // Upload file
        DataBinder response = upload.uploadFile("Test Folder upload", "Public",
                "D:\\Temp\\testfile.png");

        // Store the content ID
        String contentID = response.getLocal("dDocName").toString();

        // Retrieve the folder GUID by the folder path (browse in WCC to
        // identify the path you want)
        String folderGUID = upload.getFolderGUID("/Test");

        // Link file to folder
        ServiceResponse fileResponse = upload
                .createFileLinkInFolder(folderGUID, contentID, "owner");

        // Let's see what the service response contains
        DataBinder binder = fileResponse.getResponseAsBinder();
        System.out.println(RIDCUtils.dataBinderToString(binder));

    }

    public void createConnection(final String connectURL, String username, String password)
            throws IdcClientException {
        System.out.println("Connecting to content server at " + connectURL + " using username "
                + username + " and password");

        try {
            IdcClientManager idcClientManager = new IdcClientManager();

            this.client = idcClientManager.createClient(connectURL);
        } catch (IdcClientException e) {
            System.out.println("Error occurred while establishing client");
            throw e;
        }

        this.connectionContext = new IdcContext(username, password);

        System.out.println("Succesfully connected RIDC client to " + connectURL);
    }

    public DataBinder uploadFile(String docTitle, String securityGroup, String filePath)
            throws IdcClientException, IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            System.out.println("File " + filePath + " does not exist");
            return null;
        }
        DataBinder requestData = client.createBinder();

        requestData.putLocal("IdcService", "CHECKIN_UNIVERSAL");
        requestData.putLocal("dDocType", "Document");
        requestData.putLocal("dDocTitle", docTitle);
        requestData.putLocal("dDocAuthor", connectionContext.getUser());
        requestData.putLocal("dSecurityGroup", securityGroup);
        requestData.addFile("primaryFile", new TransferFile(file));

        ServiceResponse response = client.sendRequest(connectionContext, requestData);

        return response.getResponseAsBinder();
    }

    public ServiceResponse createFileLinkInFolder(String folderGUID, String docName, String fileType)
            throws IdcClientException {
        System.out.println("Invoking service FLD_CREATE_FILE (folderGUID=\"" + folderGUID + "\")");

        // Set service request parameters
        DataBinder requestData = client.createBinder();
        requestData.putLocal("IdcService", "FLD_CREATE_FILE");
        requestData.putLocal("fParentGUID", folderGUID);
        requestData.putLocal("fFileType", fileType);
        requestData.putLocal("dDocName", docName);

        // Return the first folder, there should be only one.
        return client.sendRequest(connectionContext, requestData);
    }

    public String getFolderGUID(String folderPath) throws IdcClientException {
        System.out.println("Invoking service FLD_INFO (path=\"" + folderPath + "\")");

        // Set service request parameters
        DataBinder requestData = client.createBinder();
        requestData.putLocal("IdcService", "FLD_INFO");
        requestData.putLocal("path", folderPath);

        // Execute service request
        ServiceResponse response = client.sendRequest(connectionContext, requestData);
        DataResultSet result = response.getResponseAsBinder().getResultSet("FolderInfo");

        // Retrieve folder GUID
        String folderGUID = result.getRows().get(0).get("fFolderGUID").toString();
        if (folderGUID.isEmpty()) {
            System.out.println("Folderpath " + folderPath + " not found");
        } else {
            System.out.println("Folder " + folderPath + " has GUID: " + folderGUID);
        }

        // Return the first folder, there is only one.
        return folderGUID;
    }
}
```

Two new methods were added: `createFileLinkInFolder` which does the actual work of creating a file link in the folder, and `getFolderGUID` which retrieves the folder GUID of a folder path from the content server. In addition several changes were made to `main(String[] args)` to upload a file, retrieve its content ID and invoke the folder services.

The standard output when executing this code should look something like this:

```text
Connecting to content server at idc://localhost:4444 using username sysadmin and password
Succesfully connected RIDC client to idc://localhost:4444
Invoking service FLD_INFO (path="/Test")
Folder /Test has GUID: 688381C27711285F5D8227E6FC4EDDA5
Invoking service FLD_CREATE_FILE (folderGUID="688381C27711285F5D8227E6FC4EDDA5")
DataBinder {
    Files {
        none
    }
    LocalData {
        ClientEncoding = UTF-8
        IdcService = FLD_CREATE_FILE
        IsJava = 1
        NoHttpHeaders = 0
        UserDateFormat = iso8601
        UserTimeZone = UTC
        blDateFormat = yyyy-MM-dd HH:mm:ssZ!tUTC!mAM,PM
        blFieldTypes = fLastModifiedDate date,xCategoryFolder text,xHasFixedClone int,xWebFlag text,xIPMSYS_STATUS text,xReportDataSourceType text,xIsFixedClone int,xStorageRule text,xIPMSYS_REDACTION int,xForceFolderSecurity text,xFreezeID memo,xReadOnly text,xIsEditable text,xWCTags text,fCreateDate date,xInhibitUpdate text,xWCWorkflowAssignment text,xHideIncludeChildFolders int,dCreateDate date,xCategoryID bigtext,xHidden text,xReportScheduledInfo text,xCpdIsLocked int,StatusMessage message,xCollectionID int,xLifeCycleID bigtext,xIPMSYS_APP_ID text,xComments memo,xWCWorkflowApproverUserList memo,xIsRecord text,xReportContentType text,xWCPageId bigtext,xCpdIsTemplateEnabled int,xRecordFilingDate date,xReportType text,xIPMSYS_BATCH_ID1 int,xIPMSYS_PARENT_ID int,dOutDate date,xExternalDataSet bigtext,xIsDeletable text,xIsFrozen text,xReportFormat text,xPartitionId text,xIPMSYS_BATCH_SEQ text,dInDate date,dMessage message,xReportTemplate text,xReportDataSourceParams text,xIPMSYS_SCKEY text,xFreezeReason memo,dReleaseDate date,xFolderID bigtext,xReportDataSource text,xIsRevisionable text,xIdcProfile text
        changedMonikers =
        changedSubjects =
        computePermissions = 1
        dDocAccount =
        dDocAuthor = sysadmin
        dDocName = CS000876
        dDocTitle = Test Folder upload
        dDocType = Document
        dExtension = png
        dInDate = 2012-10-08 15:36:14Z
        dOriginalName = testfile.png
        dProcessingState = Y
        dPublishedRevisionID =
        dRevClassID = 876
        dRevLabel = 1
        dRevisionID = 1
        dSecurityGroup = Public
        dUser = sysadmin
        doSorting = 0
        fApplication = framework
        fClbraAliasList =
        fClbraRoleList =
        fClbraUserList =
        fCreateDate = 2012-10-08 15:36:14Z
        fCreator = sysadmin
        fDocAccount =
        fFileGUID = CBFB1BE10FA920B859524B54EB8EFA67
        fFileName = testfile.png
        fFileType = owner
        fFolderGUID = 688381C27711285F5D8227E6FC4EDDA5
        fInhibitPropagation = 17
        fLastModifiedDate = 2012-10-08 15:36:14Z
        fLastModifier = sysadmin
        fLinkRank = 0
        fOwner = sysadmin
        fParentGUID = 688381C27711285F5D8227E6FC4EDDA5
        fParentGUID_display = /Test
        fPublishedFileName = testfile.png
        fSecurityGroup = Public
        fldBrowsingMode = contribution
        idcToken =
        itemCount = -1
        itemStartRow = 0
        itemType = 2
        localizedForResponse = 1
        refreshMonikers =
        refreshSubMonikers =
        refreshSubjects =
        xClbraAliasList =
        xClbraRoleList =
        xClbraUserList =
    }
    Options {
        none
    }
    ResultSets {
        none
    }
}
```

## Resources

- RIDC overview: [http://docs.oracle.com/cd/E23943_01/apirefs.1111/e17274/toc.htm](http://docs.oracle.com/cd/E23943_01/apirefs.1111/e17274/toc.htm)
- Datasase description (10g !) Appendix A: [http://docs.oracle.com/cd/E10316_01/cs/cs_doc_10/documentation/admin/troubleshooting_10en.pdf](http://docs.oracle.com/cd/E10316_01/cs/cs_doc_10/documentation/admin/troubleshooting_10en.pdf)
- RIDC examples from Meghna Kabnurkar: [http://senasystems.blogspot.co.uk/2012/03/ucm-file-operations-add-edit-delete.html](http://senasystems.blogspot.co.uk/2012/03/ucm-file-operations-add-edit-delete.html)
  \*RIDC resource list from Jonathan Hult: [http://jonathanhult.com/blog/2012/07/ridc-versus-cis/](http://jonathanhult.com/blog/2012/07/ridc-versus-cis/)

The code I used to print the `DataBinder` (`RIDCUtils.dataBinderToString()`) can be found [here](https://gist.github.com/nielskrijger/3818569) (it does the job and that's it!).
