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

*// Update 2019-01-24: rewritten most of the article*

When adding a new backend request I've found the following list a fairly common sequence of steps I should take care of:

1. <a href="{{ '#1.-request' | url }}">Request</a>
2. <a href="{{ '#2.-routing' | url }}">Routing</a>
3. <a href="{{ '#3.-authentication' | url }}">Authentication</a>
4. <a href="{{ '#4.-authorization' | url }}">Authorization</a>
5. <a href="{{ '#5.-deserialize-payload' | url }}">Deserialize payload</a>
6. <a href="{{ '#6.-input-validation' | url }}">Input validation</a>
7. <a href="{{ '#7.-retrieve-domain-objects' | url }}">Retrieve domain objects</a>
8. <a href="{{ '#8.-business-rules-(semantic-validation)' | url }}">Business rules</a>
9. <a href="{{ '#9.-side-effects' | url }}">Side-effects</a>
10. <a href="{{ '#10.-response' | url }}">Response</a>

The order of these steps vary and some are optional depending on the type of request and environment, but this list is fairly similar for all protocols, frameworks, languages and environments I've worked in thus far.

In this blog I'll walk through these steps and share some learnings I've had along the way.

## 1. Request

The first thing to consider when designing an API  is to select a protocol. While a comparison between protocols is a blogpost in itself, I'll quickly go through the protocols I've used or experimented with:

1. **REST / JSON.** Used for most API's these days and relies on the fundamental principles of HTTP (how it was originally intended). Despite its popularity weirdly I've come acros very few custom REST API's that are designed well, most struggling to reach even level 1 on the  <a href="https://martinfowler.com/articles/richardsonMaturityModel.html" target="_blank">Richardson Maturity Model</a> (I should note, I'm not a fan of <a href="https://nielskrijger.com/posts/2014-08-05/choosing-a-hypermedia-type/" target="_blank">level 3</a> myself myself). That is not surprising because REST is not very strict, something I struggled with in the past <a href="https://nielskrijger.com/posts/2013-08-01/rest-and-json-best-practices/" target="_blank">as well</a>. In a business environment REST API's go well together with <a href="https://swagger.io/" target="_blank">Swagger/OpenAPI</a>.
2. **gRPC / Protobufs.** A binary RPC protocol that is much more compared to REST / JSON. It relies on <a href="https://developers.google.com/protocol-buffers/" target="_blank">protobufs</a> which require you to specify your API as follows:

    ```protobuf
    message Person {
      string name = 1;
      int32 id = 2;
      string email = 3;
    }

    message AddressBook {
      repeated Person people = 1;
    }
    ```

    Using this specification you then generate your client and server code (the <a href="https://en.wikipedia.org/wiki/Stub_(distributed_computing)" target="_blank">stubs</a>) using a code generation tool. For a long time gRPC was only available as a backend technology and thus limited to service-to-service communication. As of October 2018 <a href="https://github.com/grpc/grpc-web" target="_blank">gRPC-Web</a> became public which enables JavaScript-based frontend gRPC communication, so you should be able to build gRPC-based web services as well now. 
3. **GraphQL.** I've only briefly played with <a href="https://en.wikipedia.org/wiki/GraphQL" target="_blank">GraphQL</a> but several co-workers have tried it out on production systems and their results were mixed, usually negative. GraphQL is much more flexible protocol compared to REST / JSON and gRPC, but in practice for most use cases you do not want flexibility at all. Creating a user, resetting a password, changing a subscription; these types of commands are a better fit for an RPC or REST-based API. Because GraphQL is the new kid on the block people tend to overuse it and create monstrously complex code; don't expect it to be the hammer that elegently solves your API problems. However if your use case does require a very flexible query-based API then GraphQL is very interesting; for example when lots of different clients have different requirements across a broad dataset.
4. **Messaging protocols.** Publish-subscribe, queues and topics provide asynchronous communication and are usually a more reliable/predictable way of communication compared to standard REST/HTTP. It's a good way to decouple services and ensure when backend services go down messages don't get lost. Various standardized protocols are in use for this, <a href="https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol" target="_blank">AMQP</a> and <a href="https://en.wikipedia.org/wiki/MQTT" target="_blank">MQTT</a> are popular. In practice I usually use proprietary cloud services with non-standard protocols (<a href="https://aws.amazon.com/sqs/" target="_blank">AWS SQS</a>/<a href="https://aws.amazon.com/sns/" target="_blank">SNS</a> or <a href="https://cloud.google.com/pubsub/docs/overview" target="_blank">Google PubSub</a>) since they offer high reliability and very low maintenance. If quality of service is not your main concern but instead you want a decoupled, efficient high-throughput event-based communication protocol you can use memory-based pubsub services as well, e.g. <a href="https://redis.io/topics/pubsub" target="_blank">Redis</a> or <a href="https://en.wikipedia.org/wiki/NATS_Messaging" target="_blank">NATS</a> (haven't used NATS yet, but looks interesting).
5. **Websockets.** Provides two-way communication between frontend and backend.  <a href="https://en.wikipedia.org/wiki/WebSocket" target="_blank">Websockets</a> are commonly used for use cases where real-time frontend updates are a requirement. Websockets work nicely with an in-memory pubsub protocol in the backend, e.g. Redis or NATS. Because websockets are a bit trickier to setup and manage (each connection becomes stateful rather than a stateless REST API) I have frequently resorted to use polling over REST instead. Given HTTP/2 + gRPC-Web also support this use case they may be considered an alternative.
6. **SOAP / XML**. Just... don't.

Which protocol to use strongly depends on your use case and business context. I would advise to select only one or two protocols for your system; tools, best practices, system behaviour, documentation, logging and testing all tend to be different for each protocol.

Because REST/JSON is the most common I'll use that as an example in the rest of this blog.

Later in the <a href="{{ '#10.-response' | url }}">Response</a>-section I'll discuss some other topics that apply to the Request as well.

## 2. Routing

The application receiving a request makes it available in some form of a Request object. Either you the programmer or the framework you're using determines which pieces of code will receive and process this request object and return a response. This receiver is usually a Controller or RequestHandler.

**The choice of using either a Controller or a RequestHandler is an architectural decision for your codebase.**

RequestHandlers tend to process a single type of request fully and only delegate where applicable. Controllers however delegate as much as possible and focus on the interaction of subsystems. Usually a single controller fulfills several requests (e.g. all `GET`, `DELETE` and `POST /users` requests).

I've come to favour RequestHandlers for most use cases because I feel there is little coupling between different types of requests for the same resource. Consider:

- `GET /users/3` requires authentication and authorization before fetching the database record and sending back a response.
- `POST /users` is a public endpoint that validates the JSON request body, encrypts the user's password, checks if the email is already in use, creates a database record, sends an activation email to the recipient and sends back a response.

The main thing these two endpoints share is the response format, but nothing else. From a code-perspective these two endpoints together are not a meaninigful unit. As your controller grows (which they tend to do), consider splitting this up into separate request handlers.

Right now I tend to create a separate file for each request type, e.g. `get_user.xy` and `post_user.xy` and organize reusable code as I see fit. This is a simple basic approach that scales out well.

## 3. Authentication

In an HTTP request authentication information is usually stored in a Cookie or Authorization-header. There are many ways to identify a client but they all include some identifier that uniquely identifies the client or session.

Validating these tokens is fairly simple; either the token is invalid and an unauthorized-error is returned; or the token is valid and session details are added to the request context.

Job done. Authentication is only concerned with identitying the user/subject but should not make any claims whether he is authorized.

Because authentication-handling logic is very similar across all your backend endpoints it is usually performed before anything else within middleware, a decorator or request interceptor. It is a <a href="https://en.wikipedia.org/wiki/Cross-cutting_concern" target="_blank">cross-cutting concern</a>. Some challenges with such a global setup are:

- Disabling authentication for public endpoints (the `GET /articles/123` is a public endpoint)
- Multiple types of session tokens (e.g. Session ID's and JWTs).
- Different ways to send a token (Cookie vs Header).

I've come across a codebase that had 4 types of authentication and used various lists to whitelist and blacklist endpoints for each authentication method. It was terribly difficult to work out which authentication methods actually applied to an individual request handler. I resorted to writing lots of tests simply to find out what is happing.

In such scenarios it is better to treat authentication not as a cross-cutting concern but as part of the request handler itself (i.e. after routing). This might cause some boilerplate but the reverse is much worse: magic.

## 4. Authorization

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

For this `POST /articles`-request we could start with a simple role-based mechanism where users with `role = "WRITER"` are allowed to execute `POST /articles`-requests. A simple check `if request.user.roles.includes("WRITER")` would be sufficient. Job done.

Now imagine the following use cases:

- Add a `PATCH /articles/:id`-endpoint which enables authors to update their content. Only writers who authored the content should be allowed to update the article.
- Only users with the "EDITOR" role are allowed to approve an article and publish it, changing the article's status from "DRAFT" to "PUBLISHED".
- When an article is a "DRAFT" the `GET /articles/:id`-endpoint should return a 404 for unprivileged users.
- The author should be able to send a link to anyone with a "DRAFT" article for proofreading purposes.

With such requirements a basic role based mechanism quickly breaks down, and attribute-based access control and/or ACL come into play.

You can try to keep authorization as a single step within the request-lifecycle but it is common for evolving systems to start spreading around their authorization logic across various steps.

Try to get a good idea about your security requirements before you start designing the application and consider the available options within your framework and ecosystem (you should also read <a href="https://dinolai.com/notes/others/authorization-models-acl-dac-mac-rbac-abac.html" target="_blank">this article on authorization models</a>).

If you are able to keep authorization simple and standardised it will definitely pay of in development speed, readability and future maintenance. I have never been fully satisfied with the authorization logic of any systems I've worked on; trade-offs between complexity and flexibility have to be made.

## 5. Deserialize payload

One of the main advantages of a dynamically typed language is you don't have to waste your time with typecasting; so Ruby, JavaScript, Python and PHP developers can simply skip this section and feel smug.

In statically typed languages I've done either of the following:

- map the payload to a data-type according to a user-defined mapping using annotations, tags, PO\*O object converters or some other mapping specification;
- or load the payload into a raw object and use reflection to access its fields.

The latter foregoes much of the static typing goodness hence I generally prefer to statically cast it into a well-defined type.

Usually the framework/language does the heavy lifting but this may cause issues by itself:

- It is often difficult to transform errors thrown during deserialization (e.g. malformed JSON) to your own error-format.
- Unwanted conversions may occur, e.g. a string "123" being cast to an int automatically without you knowing. While this may sound convenient it is much cleaner to stick to strict conversions.

These two issues alone have made me give up on two different frameworks; it was just to cumbersome to bend deserialization to my will.

## 6. Input validation

Input or syntax validation can be done in several ways.

The naive approach is to check each input field for their associated type and basic requirements. To reduce boilerplate libraries and/or utility functions are used. After all these years I still use this naive approach regularly, particularly for microservices.

One of my favourite tools is <a href="https://json-schema.org/" target="_blank">JSON schema</a> which specifies validation rules like so:

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

Parsing and validating your object against a JSON schema requires a powerful library but makes for very readable validation specs. It is part of Swagger/OpenAPI as well. 

Within statically typed languages input validation requirements are often part of the deserialisation mapping using annotations or something similar. I found these solutions are generally not as comprehensive or flexible as JSON schema or custom functions. I usually end up adding quite a bit of customization and boilerplate to capture all input validation rules using these mappers. The great thing about this approach is it's usually well understood by other developers, is simple and avoids boilerplate.

## 7. Retrieve domain objects

Most backend requests require additional data from external sources (db, cache, third-party service, ...) during their processing.

If your primary dependency is a single database and you're using an ORM that resolves relationships automatically you have little to do further. Do be aware most (if not all) ORMs resolve relationships lazily; I once debugged a slow JPA-based system and it turned out the logic ended up resolving 7 `SELECT` queries sequentially (i.e 7 times the app-DB latency, which for this system was significant). A couple of eager annotations fixed this issue.

However, due to the rise of distributed cloud apps and microservices it has become less common your app primarily interacts with just a single database.

When accessing multiple datasources and services I tend to fetch all data in parallel before doing any real processing. Pre-fetching dependant domain objects significantly reduces your average response time and as a bonus it renders semantic validation a synchronous operation keeping your functions "blue" (read <a href="(http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/" target="_blank">What color is your function</a>) for an explanation).

## 8. Business rules (semantic validation)

Business rules are validations based on (usually) runtime information retrieved from domain objects. Some examples:

- When placing an order the stock of all order items must be sufficient.
- A news article may only be published if at least two news editors have given their approval.
- A Gold member receives free shipping.

While there may only be a couple business rules initially, the amount and complexity of these rules can become significant over time, particularly in a mature business domain. When practicing Domain-Driven Design these rules are captured within the domain-layer of your application.

Alternative solutions are Business Rule Engines (BREs) and Workflow Engines which provide a configurable management environment that domain experts can use to adjust their business processes on the fly. These systems are configured either through a visual editor or some Domain-Specific Language.

That sounds great but typically these solutions require expert knowledge to operate and reconfigure. Moreover configuration changes are usually poorly tested, let alone covered in automated tests.

Having worked on a BRE & Workflow application and seen several others used in practice my verdict is simple; avoid them for pretty much all your projects. They sound great in principle but the return on investment is very low, if not usually a net loss.

Right now I favour capturing business rule configuration in a headless CMS and programatically process and test these config settings. While not as flexible as a BRE or Workflow engine I found it a more cost-effective way to enable domain experts to adjust parameters while also covering them by automated tests.

## 9. Side-effects

Except for data-retrieval requests most requests will do stuff like:

- modify database records/documents
- invoke external service(s)
- push messages to queues & topics
- ...

When executing multiple side-effects you should carefully consider the order and transactionality of those effects. A relational database can guarantee you an <a href="https://en.wikipedia.org/wiki/Atomic_commit" target="_blank">all-or-nothing transaction</a> but most other side-effects cannot.

I often end up asking the question; _"How bad is it if this fails?"_

In an advanced application framework you might have built-in transactions across databases, requests and queues rolling back everything if something failed. But this is rare. Usually you don't have any guarantees and such mechanisms are complex to build yourself (and never 100% fail-safe). In these scenarios I tend to order side-effects synchronously in the following order:

1. **Primary side-effects**. This is the most important side-effect and cannot be recovered from when failing. The service simply returns an error.
2. **Secondary side-effects**. These are difficult to recover from when failing, usually requiring technical intervention to resolve. This I'll usually implement by either rolling back the primary side-effect (if at all possible at that point) or put my faith in an extremely high-available queue-based service with retry-mechanisms and dead-letter queues.
3. **Tertiary side-effects**. These are recoverable effects through good UX, automated recovery mechanisms or have only limited impact when they fail. These effects never affect the response at all (i.e. an error is logged when they fail but the eror doesn't bubble up).

In practice most of my side-effects are either primary or tertiary side-effects while I'll avoid secondary effects as much as I can. This mainly because I do not want to invest time in developing and testing the complex mechanisms required for secondary side-effects to work properly, let alone I'll trust those mechanisms in all possible scenarios.

For example; a new user makes a `POST /users`-request which executes a database transaction (the primary side-effect) and sends a verification email through a third-party email service afterwards. That verification email is either a:

- _secondary side-effect_ when the user cannot verify his account in any other way;
- or a _tertiary side-effect_ if you show a "resend verification email"-action when this user attempts to login with the unverified account.

It makes much more sense to upgrade a secondary side-effect to a tertiary side-effect most of the time; on the web nothing is ever guaranteed.

## 10. Response

First a word of caution: **your response is seldom a 1-to-1 mapping of your domain, database or third-party service**. It is not uncommon for dynamic languages in particular to passthrough an object directly as the response. While sometimes this makes sense, think carefully before you do. Some fields may not be optimized for your clients, some fields should be hidden (e.g. password hashes), and others may not be consistenly named. The "R" in REST stands for Representational; i.e. it represents but is not necessarily identical to the server state.

Having said that, my main concern with API design is backwards compatibility, even when designing a completely new API. It is safe to assume any status code, error message, typo... any behaviour of a service eventually some client will rely upon when in production.

While backwards-incompatible changes are manageable through incrementing the API-version they too are fraught with problems, primarily because in practice it takes a lot of overhead and time to update all clients to this new API version. It is not uncommon for a third-party client to take years before getting upgraded.

Therefore I usually try to implement changes within an existing API to save a lot of overhead.

Changes that are usually safe are:

- Adding a new field.

Changes that are sometimes safe are:

- Adding a new value of the same type to an existing field.

Changes that are usually unsafe are:

- Deleting a field.
- Renaming a field.
- Changing existing values.
- Changing field types.

Given it is so difficult to guarantee backwards-compatibility it pays off to invest extra time in your initial API design. This usually involves a lot of research and collaboration. I usually end up googling similar API's on the web and compare them with my own design. One rule of thumb: add as few fields as possible to your response and only incrementally add new ones when the need arises. While annoying and slow, the reverse is usually much more painful.
