---
title: The Request Lifecycle
description: The Request Lifecycle
date: 2018-09-22
permalink: /posts/2018-09-22/the-request-lifecycle/index.html
tags:
  - API
  - REST
  - PubSub
layout: layouts/post.njk
---

When adding a new service request I've found the following list a fairly common sequence of steps I should take care of:

1. <a href="{{ '#1.-routing' | url }}">Routing</a>
2. <a href="{{ '#2.-authentication' | url }}">Authentication</a>
3. <a href="{{ '#3.-authorization' | url }}">Authorization</a>
4. <a href="{{ '#4.-deserialize-payload' | url }}">Deserialize payload</a>
5. <a href="{{ '#5.-input-validation' | url }}">Syntax validation</a>
6. <a href="{{ '#6.-retrieve-domain-objects' | url }}">Retrieve domain objects</a>
7. <a href="{{ '#7.-business-rules-(semantic-validation)' | url }}">Business rules</a>
8. <a href="{{ '#8.-side-effects' | url }}">Side-effects</a>
9. <a href="{{ '#9.-response' | url }}">Response</a>

While the order of these steps vary and some are optional depending on the context, the list is roughly the same for all protocols, frameworks and languages.

In this blog I'll walk through these steps and share some learnings I've had along the way.

## 1. Routing

The application receives the request and makes it available in some form of Request object. Either you the programmer or the framework you're using determines which pieces of code will receive and process this request. The receiver is usually a Controller or RequestHandler.

**The choice of using either a Controller or a RequestHandler is an architectural decision for your codebase.**

RequestHandlers tend to process a single type of request fully and only delegate where applicable. Controllers however delegate as much as possible and focus on the interaction of the different parts of your codebase to fulfill a variety of requests (e.g. all `GET DELETE POST /user` requests).

I've come to favour RequestHandlers because I feel there is little coupling Between different types of requests for the same resource. Consider:

- `GET /users/3` requires authentication and authorization before fetching the database record and sending back a response.
- `POST /users` is a public endpoint that validates the JSON request body, encrypts the user's password, checks if the email is already in use, creates a database record, sends an activation email to the recipient and sends back a response.

The main thing these two endpoints share is the response format, but nothing else. From a code-perspective these two endpoints together are not a meaninigful unit. As your controllers grow (which they tend to do), consider splitting this up into separate request handlers.

Right now I tend to create a separate file for each request type, e.g. `get_user.xy` and `post_user.xy` and organize reusable code as I see fit. This is a simple basic approach that scales out well.

## 2. Authentication

In an HTTP request authentication data is usually stored in a Cookie or Authorization-header. There are many ways to identify a client but they all include some identifier that uniquely identifies the client or session.

Validating these tokens is fairly simple; either the token is invalid and an unauthorized-error is returned, or the token is valid and session details are added to the request context.

Job done.

Because authentication-handling logic is very similar across all your backend endpoints it is usually performed before anything else within middleware, a decorator or request interceptor. Some challenges with this approach are:

- Disabling authentication for public endpoints (the `GET /articles/123` is a public endpoint)
- Multiple types of sessions token (e.g. Session ID's and JWTs).
- Different ways to send a token (Cookie vs Header).

I've come across a codebase that had 4 types of authentication and used various lists to whitelist and blacklist endpoint for each authentication methdo. It was terribly difficult to work out which authentication methods actually applied to an individual request handler. I resorted to writing lots of tests simply to find out what's happing.

In such scenarios it is better to treat authentication not as a cross-cutting concern but as part of the request handler itself (i.e. after routing). This might cause some boilerplate but the reverse is much worse: magic.

## 3. Authorization

Authorization is arguably one of the most difficult topics and can wreak havoc on your code organization because of its inherit complexity in a growing system.

Imagine the following request:

```json
// POST /articles HTTP/1.1
// Host: example.com
// Content-type: application/json
// Authorization: Bearer 94a1f626d174

{
  "title": "No hipsters here",
  "content": "La croix scenester PBR&B drinking vinegar YOLO austin. I'm an Etsy master",
  "status": "DRAFT"
}
```

For this `POST /articles`-request we could start with a simple role-based mechanism where users with `role = "WRITER"` are allowed to execute `POST /articles`-requests. A simple check `if request.user.role == "WRITER"` would be sufficient.

This simple role-based authorization logic can be executed immediately after the authentication-step because the primary user details have been added to the request context after authentication.

Done.

Now imagine the following use cases:

- Add a `PATCH /articles/:id`-endpoint which enables authors to update their content. Only writers who authored the content should be allowed to update the article.
- Only users with the "EDITOR" role are allowed to approve an article and publish it, changing the article's status from "DRAFT" to "PUBLISHED".
- If an article is in "DRAFT"-state the `GET /articles/:id`-endpoint should return a 404 for unprivileged users.
- The author should be able to send a link to anyone with a "DRAFT" article for proofreading purposes.

With such requirements a basic role based mechanism quickly breaks down, and attribute-based access control and/or ACL come into play.

You can try to keep authorization as a single step within the request-lifecycle but it is common for evolving systems to start spreading around their authorization logic across various steps.

Try to get a good idea about your security requirements before you start designing the application and consider the available options within your framework and ecosystem (you should also read [this article on authorization models](https://dinolai.com/notes/others/authorization-models-acl-dac-mac-rbac-abac.html)).

If you are able to keep authorization simple and standardised it will definitely pay of in development speed, readability and future maintenance. I have never been fully satisfied with the authorization logic of any systems I've worked on; trade-offs need to be made.

## 4. Deserialize payload

One of the main advantages of a dynamically typed language is you don't have to waste your time with typecasting; so Ruby, JavaScript, Python and PHP developers can simply skip this section and feel smug.

In statically typed languages I've done either of the following:

- map the payload to a data-type according to a user-defined mapping using either annotations, tags, PO\*O object converters or some other type of mapping specification;
- or load the payload into a raw object and use reflection to access its fields.

The latter foregoes some of the static typing goodness hence I generally prefer to statically cast it into a well-defined type.

Usually the framework/language does the heavy lifting but this may cause issues by itself:

- It is often difficult to transform errors thrown during deserialization (e.g. malformed JSON) to your own error-format.
- Unwanted conversions may occur, e.g. a string "123" being cast to an int automatically without you knowing. While this may sound convenient it is much cleaner to stick to strict conversions.

These two issues alone have made me give up on two different frameworks; it was just to cumbersome to bend deserialization to my will.

## 5. Input validation

Input or syntax validation can be done in several ways. The naive approach is to check each input field for their associated type and basic requirements. To reduce boilerplate libraries and/or utility functions are used.

After all these years I still use this naive approach regularly, particularly for microservices.

One of my favourite tools is [JSON schema](https://json-schema.org/) which specifies validation rules like so:

```json
{
    "type": "object",
    "properties": {
    "title": {
        "type": "string",
        "minLength": 5,
        "maxLength": 40
    },
    "content": {
        "type": "string"
    }
    "status": {
        "enum": [ "DRAFT", "PUBLISHED" ]
    },
    "required": [ "title", "content", "status" ]
}
```

Parsing and validating your object against a JSON schema requires a powerful library, but makes for very readable and clearly spearated validation specs. It is part of Swagger/OpenAPI as well.

Within statically typed languages input validation is usually part of the deserialisation mapping using annotations or something similar. I found these solutions are generally not as comprehensive or flexible as JSON schema or custom functions; I usually end up adding quite a bit of customization and boilerplate to capture all input validation rules using these mappers.

## 6. Retrieve domain objects

Most backend requests require additional data from external sources (db, cache, third-party service, ...) to process business logic.

If your primary dependency is a single database and you're using an ORM that resolves relationships automatically you have little to do further. Do be aware most (if not all) ORMs resolve relationships lazily; I once debugged a slow JPA-based system and it turned out the logic ended up resolving 7 select queries sequentially (i.e 7 times the app-DB latency, which for this system was significant). A couple of eager annotations fixed this issue.

However, due to the rise of distributed cloud apps and microservices it has become less common your app primarily interacts with just a single database.

When accessing multiple datasources and services I tend to fetch all data in parallel before doing anything else; and store long-living data in an application context object. That way the average response time is lower and your business logic can be processed synchronously which simplifies code in most languages and frameworks. Particularly JavaScript-based languages, Python and C# suffer from red-colored functions (read [What color is your function](http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) for an explanation).

## 7. Business rules (semantic validation)

Business rules are validations based on (usually) runtime information retrieved from domain objects. Some examples:

- When placing an order the stock of all order items must be sufficient.
- A news article may only be published if at least two news editors have given their approval.
- A Gold member receives free shipping.

While there may only be a couple business rules initially, the amount and complexity of these rules can become significant over time, particularly in a mature business domain. When practicing Domain-Driven Design these rules are captured within the domain-layer of your application.

Alternative solutions are Business Rule Engines (BREs) and Workflow Engines which provide a configurable management environment that domain experts can use to adjust their business processes on the fly. These systems are configured either through a visual editor or some Domain-Specific Language.

That sounds great but typically these solutions require expert knowledge to operate and reconfigure. Moreover configuration changes are usually poorly tested, let alone covered in automated tests.

Having worked on a BRE & Workflow application and seen several others used in practice my verdict is simple; avoid them for pretty much all your projects. They sound great in principle but the return on investment is very low, if not usually a net loss.

Right now I favour capturing business rule configuration in a headless CMS and programatically process and test these config settings. While not as flexible as a Bussiness Rule or Workflow engine I found it a more cost-effective way to enable domain experts to adjust parameters while also covering them by automated tests.

## 8. Side-effects

Except for data-retrieval requests most requests will stuff like:

- modify database records/documents
- invoke external service(s)
- push messages to queues & topics
- ...

When executing multiple side-effects you should carefully consider the order and transactionality of those effects. A relational database can guarantee you an [all-or-nothing transaction](https://en.wikipedia.org/wiki/Atomic_commit) but most NoSQL databases cannot.

I often end up asking the question; _"How bad is it if this fails?"_

In an advanced application framework you might have built-in transactions across databases, requests and queues; but this is rare. Usually you don't have any guarantees and such mechanisms are complex to build yourself (and never 100% fail-safe). In these scenarios I tend to order side-effects synchronously in the following order:

1. **Primary side-effects**. These are the most important and cannot be recovered from when failing. The service returns an error.
2. **Secondary side-effects**. These are difficult to recover from when failing, usually requiring technical intervention to resolve. This I'll usually implement by either rolling back the primary side-effect or trust an extremely high-available queue-based service.
3. **Tertiary side-effects**. These are recoverable effects through good UX, automated recovery mechanisms or have only limited impact when they fail. These effects never affect the response at all (i.e. an error is logged when they fail but the eror doesn't bubble up).

In practice most of my side-effects are either primary or tertiary side-effects while I'll avoid secondary effects as much as I can. This mainly because I do not want to invest time in developing and testing the complex mechanisms required for secondary side-effects to work properly, let alone I'll trust those mechanisms in all possible scenarios.

For example; a new user makes a `POST /users`-request which executes a database transaction (the primary side-effect) and sends a verification email through a third-party email service afterwards. That verification email is either a:

- secondary side-effect when the user cannot verify his account in any other way;
- or a tertiary side-effect if you'd show a "resend verification email"-action when this user attempts to login with the unverified account.

It makes much more sense to upgrade a secondary side-effect to a tertiary side-effect most of the time; on the web nothing is ever guaranteed.

## 9. Response

This is by far the most important aspect of your API design and ―in contrast to most other steps― is often reused across different types of requests.

The main problem with response messages is backwards compatibility. It is safe to assume any status code, error message, typo... any outdated behaviour by the service a client will rely upon when the system has been in production for a while.

While backwards-incompatible changes are manageable through incrementing the API-version they too are fraught with problems, primarily because in practice it takes a lot of overhead and time to update all clients to this new API version. It is not uncommon for a third-party client to take years before getting upgraded.

Therefore usually I'll try to implement changes within the existing API saving a lot of overhead.

Changes that are usually safe are:

- Adding a new field.

Changes that are sometimes safe are:

- Adding a new value of the same type to an existing field.

Changes that are usually unsafe are:

- Deleting a field.
- Renaming a field.
- Changing existing values.
- Changing field types.

Given it is so difficult to guarantee backwards-compatibility it pays off to invest extra time in your initial API design. This usually involves a lot of research and collaboration. One rule of thumb: add as few fields as possible to your response and only incrementally add new ones when the need arises. While annoying and slow, the reverse is usually much more painful.
