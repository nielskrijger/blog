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

When adding a new request to a service I found the following list a fairly common sequence of steps I need to take care of somehow:

1. <a href="{{ '#1.-routing' | url }}">Routing</a>
2. <a href="{{ '#2.-authentication' | url }}">Authentication</a> (who is the user?)
3. <a href="{{ '#3.-authorization' | url }}">Authorization</a> (is the user allowed?)
4. <a href="{{ '#4.-deserialize-payload' | url }}">Deserialize payload</a>
5. <a href="{{ '#5.-input-validation' | url }}">Syntax validation</a>
6. <a href="{{ '#6.-retrieve-domain-objects' | url }}">Retrieve domain objects</a> (database records, external services, read files, ...)
7. <a href="{{ '#7.-semantic-validation-(business-rules)' | url }}">Semantic validation</a> (business rules)
8. <a href="{{ '#8.-side-effects' | url }}">Side-effects</a> (database updates, invoke third-party services, writing a file, ...)
9. <a href="{{ '#9.-send-response' | url }}">Send response</a>

In this blog I'll walk through the entire lifecycle and share some learnings I've had along the way. I'll use the following example along the way:

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

## 1. Routing

The application receives the request and makes it available in some form of Request object. Either you the programmer or the framework you're using determines which pieces of code will receive and process this request. The receiver is usually a Controller or RequestHandler.

This distinction between a Controller or RequestHandler I've come to experience as an important architectural decision of the codebase. RequestHandlers tend to process a single type of request. Controllers however delegate and organize the interaction of different parts of the codebase usually for multiple requests (e.g. all `GET DELETE POST /user` requests).

I've come to favour RequestHandlers because I feel there is little coupling involved in different requests for the same resource. Consider:

- `GET /users/3` requires authentication and authorization before fetching the database record and sending back a response.
- `POST /users` is a public endpoint that validates the JSON request body, encrypts password, checks if email is already in use, creates a database record, sends an activation email to the recipient and sends back a response.

The main thing these two endpoints share is the response format, but nothing else. From a code-perspective these two endpoints together are not a meaninigful unit. As your controllers grow (which they tend to do), consider splitting this up into separate request handlers.

Right now I've have come to prefer creating a separate file for each request handler, e.g. `get_user.xy` and `post_user.xy` and reuse code in separate files.

## 2. Authentication

In our `POST /articles`-example the Authorization-header contains a Bearer-type token. There are many ways to identify a client but they all include some identifier that uniquely identifies the client or session. Either the token is invalid and 401 Unauthorized is returned, or the token is valid and session details are added to the request context. Job done.

Because authentication-handling logic is very similar across all your backend endpoints it is usually performed before anything else. You may want to ignore authentication for public endpoints (the `GET /articles/123` is a public endpoint), hence this is the 2nd lifecycle method and not the 1st.

Usually authentication is added as middleware, a decorator or request interceptor to centrally enforce authentication rules. Public endpoints are often "excluded" and additional authentication options whitelisted. While this works, I've come across a codebase that had 4 types of such white- and blacklists for various types of authentication. It was terribly difficult to work out what was mandatory or not. In such scenarios it is better to treat authentication not as a cross-cutting concern but as part of the request handler itself (i.e. after routing).

## 3. Authorization

Authorization is arguably one of the most difficult topics and can wreak havoc on your code organization because of its inherit complexity in a growing system.

In our `POST /articles`-request we sould start with a simple Role-based mechanism where only users with `role = "WRITER"` are allowed to execute `POST /articles`-requests. A simple check `if user.role != "WRITER"` then returns a ForbiddenError and we're done.

This simple role-based authorization logic can be performed immediately after the authentication which adds the user's details to the request context.

Done. Simple right?

Now imagine the following scenarios:

- Add a `PATCH /articles/:id`-endpoint which enables authors to update their content. Only writers who authored the content should be allowed to update the article.
- Only users with "EDITOR" role are allowed to promote the article and publish it, changing the article's status from "DRAFT" to "PUBLISHED".
- If an article is in "DRAFT" the `GET /articles/:id`-endpoint should return a 404 for unprivileged users.
- The author and any other user with the "EDITOR"-role should be able to send a link to anyone with the "DRAFT" article for proofreading purposes.

With such requirements a basic role based mechanism quickly breaks down, and Attribute-based access control and/or ACL come into play.

You can try to keep authorization as a single step within the lifecycle but it's common for evolving systems to start spreading around their authorization logic across various steps in the request lifecycle.

Try to get a good idea about your security requirements before you start designing the application and consider the available options within your framework and ecosystem. If you are able to keep authorization simple and standardised it will definitely pay of in development speed, readability and future maintenance. I have never been fully satisfied with the authorization logic of any systems I've worked on; trade-offs need to be made.

## 4. Deserialize payload

Ruby, JavaScript, Python and PHP developers may wonder what this step is all about as translating a JSON request payload into usable application code is no effort within a dynamically typed language. It's a big time-saver over statically-typed languages; JSON is simply translated to a single variable with data contents mimicking the received payload.

In statically-typed languages I've done either of the following:

- map the payload to a data-type according to a user-defined mapping using either annotations, tags, PO\*O object converters or some other type of mapping specification;
- or load the payload into an raw object and use reflection to access the payload later on.

The latter foregoes some of the statically-typed goodness in which case a dynamically-typed language might make more sense... hence I prefer to statically cast it into an well-defined object.

Usually the framework/language does the heavy lifting but this may cause issues by itself:

- It is often difficult to transform errors thrown during deserialization (e.g. malformed JSON) to your own error-response.
- Unwanted conversions may occur, e.g. a string "123" being cast to an int automatically without you knowing. While this may sound convenient it is much cleaner to stick to strict conversions.

## 5. Input validation

Input or syntax validation can be done in several ways. The naive approach is to check each input field for their associated type and basic requirements. To reduce boilerplate libraries and/or utility functions are used.

One of the tools I've used a lot is JSON Schema:

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

Within statically typed languages input validation is usually part of the deserialisation mapping using annotations or something similar. I found these solutions are generally not as comprehensive or flexible as JSON schema or custom validators and require quite some customization to craft a mature well-designed API.

## 6. Retrieve domain objects

Most backend requests require additional data from external sources (db, cache, third-party service, ...) to process the business logic.

If your primary dependency is a single database and you're using an ORM that resolves relationships automatically you have little to do further. Do be aware most (if not all) ORMs resolve relationships lazily; I once debugged a slow JPA-based system and it turned out the logic ended up resolving 7 select queries sequentially (i.e 7 times the app-DB latency, which in itself was 20-30ms I recall). A couple of eager annotations fixed the issue.

But with the prevelance of cloud apps and microservices it has become less common your app primarily interacts with just a single database.

When accessing multiple datasources and services I tend to fetch all data in parallel before doing anything else; and store long-lived data in an app context or within singletons. That way the average response time is lower and your business logic can be processed synchronously which simplifies code in most languages and frameworks. Particularly JavaScript-based languages and C# suffer from red-colored functions (read [What color is your function](http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) for an explanation).

## 7. Semantic validation (business rules)

Business rules are validations based on (usually) runtime information retrieved from domain objects. Some examples:

- When placing an order the stock of all order items must be sufficient.
- A news article may only be published if at least two news editors have given their approval.
- A Gold member receives free shipping.

While there may only be a couple business rules initially, the amount and complexity of these rules can become significant over time, particularly in a mature business domain. When practicing Domain-Driven Design these rules are captured within the domain-layer of your application.

Business Rule Engines (BREs) and Workflow Engines are solutions that provide a configurable management environment that domain experts can use to flexibly adjust their business processes. These systems are configured either through a visual editor or some Domain-Specific Language.

While these solutions sound great they generally require expert knowledge to operate and reconfigure. Moreover configuration changes are usually poorly tested, let alone automatically covered in end-to-end tests.

Having worked on one BRE & Workflow application and having seen several in use in multiple businesses my verdict is simple; avoid for pretty much all your projects. They sound great in principle but the return on investment is really slow, and quite possibly a net loss.

Right now I favour capturing business rule configuration in a headless CMS and programatically process and test these config settings. This I found is a fairly cost-efficient way to enable domain experts to adjust certain parameters that are covered by tests.

## 8. Side-effects

Apart from simple data-retrieval requests most requests will:

- modify database records/documents
- invoke external service(s)
- push messages to queues & topics

When executing multiple side-effects you should carefully consider the order and transactionality of those effects. A relational database can guarantee you an [all-or-nothing transaction](https://en.wikipedia.org/wiki/Atomic_commit) while most NoSQL databases cannot.

I often end up asking the question; _"How bad is it that this fails?"_

In an advanced application framework you might have built-in transactions across databases, requests and queues; but this is rare. Usually you don't have any guarantees and such mechanisms are complex to build yourself (and never 100% fail-safe). In these scenarios I tend to order side-effects synchronously in the following order:

1. **Primary side-effects**. These are the most important and cannot be recovered from when failing.
2. **Secondary side-effects**. These are very difficult or painful to recover from. This I'll usually implement through an extremely high-available queue-based service that is unlikely to fail; or where I can rollback the primary side-effect.
3. **Tertiary side-effects**. These are recoverable effects through good UX, backup processes or have only limited impact when they fail. These don't affect the response at all (i.e. an error is logged when they fail but the eror doesn't bubble up).

In practice most of my side-effects are either primary or tertiary side-effects while I'll avoid secondary effects as much as I can. This is mainly because I do not want to invest a lot of time in developing and testing the complex mechanisms for these secondary side-effects to work properly.

For example; a new user makes a `POST /users`-request which inserts some database records within a transaction (the primary side-effect) and sends a verification email through a third-party email service afterwards. That verification email is either a:

- secondary side-effect when the user cannot verify his account in any other way;
- or a tertiary side-effect if you show a "resend verification email"-action when a user attempts to login with an unverified account.

It makes much more sense to upgrade a secondary side-effect to a tertiary side-effect most of the time; on the web nothing is ever guaranteed.

## 9. Send response

This is by far the most important aspect of your API design and ―in contrast to most other steps― is often reused across different types of requests.

The main problem with response messages is backwards compatibility. It is safe to assume any typo, status code, error message, ... any previous behaviour by the service a client will rely upon.

While backwards-incompatible changes are manageable through API-version increments they too are fraught with problems, primarily because in practice it takes a lot of overhead and time to update all clients to a new API version. It is not uncommen for a third-party client to take years before getting upgraded.

Therefore usually I'll try to implement changes within the existing API.

Changes that are usually safe are:

- Adding a new field.

... and that's it.

Changes that are sometimes safe are:

- Adding a new value to an existing field.
- Deleting a field.

Changes that are usually unsafe are:

- Renaming a field.
- Changing existing values or types.

Getting your API response correct on the first try usually involves a lot of research & communication. As a rule of thumb add as few fields as possible to your response and only incrementally add new ones when the need arises. While annoying and slow, the reverse is much more painful.
