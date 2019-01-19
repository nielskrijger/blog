---
title: REST and JSON Best Practices
description: REST and JSON Best Practices
date: 2013-08-01
permalink: /posts/2013-08-01/rest-and-json-best-practices/index.html
tags:
  - REST
  - JSON
layout: layouts/post.njk
---

For a long time I was struggling with REST API conventions. REST was -and is- a difficult concept which has been poorly understood for a long time. Nowadays there are lots of excellent style guides. Below I've gathered some guidelines and best practices from various sources.

In all guidelines I've assumed the REST service returns JSON because it is the most common format these days. Most guidelines should work for other formats (XML in particular) as well.

## HTTP methods

- The collection must be in plural, `GET /users/bob` instead of `GET /user/bob`
- If you need to do something that may yield different results if you call it multiple times after each other (i.e. the service is not idempotent) use POST.
- GET and DELETE do what you think they do.
- POST and PUT might not do what you think they do. POST and PUT can both be used to create and update depending on the circumstances.
- Use POST when creating a new resource and the server determines the resource identifier.
- Use POST if you run queries with very large inputs (only as a last resort because of limited URI length).
- Use PUT when creating a new resource and the client determines the resource identifier/URI. For example, when the business key is a UUID set by the client, use PUT to create the resource.
- Use PUT if you want to overwrite an existing resource (e.g. update all properties of `/users/bob`).
- Use PATCH if you want to partially update an existing resource (e.g. only update the first and last name of a user entity). While PATCH is supported fairly well, it is not a formal HTTP standard and should be avoided if service consumers are not able to make PATCH requests.
- Use POST if you want to partially update an existing resource (e.g. change the password of `/users/bob` but leave the rest intact)
- Use PUT to invoke an action on a resource, e.g. `PUT /users/bob/authenticate`. Ideally you avoid actions altogether by turning them into resource collections, e.g. `POST /tokens`.
- If the client is limited to making POST and GET requests add an additional query parameter to the url, for example `/users/bob?method=DELETE`. Be warned that this breaks with every principle of HTTP! A perceived safe and idempotent GET request would no longer be safe nor idempotent. Software that is HTTP-aware may no longer work propery, for example caching. Best to avoid this practice at all costs.
- Avoid custom HTTP headers if they are important for your request; include them in the request body instead to keep a clean interface. If you do decide to include custom HTTP headers do no longer use "X-" as a prefix (e.g. "X-Powered-By"), the "X-" is a convention that is now deprecated.

## HTTP result codes

The following list contains the more relevant REST-service HTTP status codes.
A common mistake is to return a 200 OK when something went wrong. REST services ought to utilize what HTTP has on offer.
200 OK: when a request was processed successfully, for example when a partial update succeeded.

- 201 CREATED: when creating a new resource instance using a POST or PUT succeeded. Send the new resource representation in the body.
- 202 ACCEPTED: when a POST or DELETE was accepted but not yet processed. The response body should contain the current status of the asynchronous job and provide a link to track the progress of the request. Make a clear distinction between the asynchronous job and the resource that is being created as a result of that job. The job itself was accepted and should return a 200 OK result with status of the asynchronous job (for example, running, deleted or failed). If the job was successful and produced a new resource return 303 SEE OTHER with a Location header containing the new resource url.
- 204 NO CONTENT: when the request was processed successfully but no response body is available.
- 400 BAD REQUEST: when a syntactical error occurred, for example when a validation constraint failed.
- 401 UNAUTHORIZED: when user is not authorized and authenticated. When user is authenticated but just not authorized issue a 403 FORBIDDEN.
- 403 FORBIDDEN: when the user is authenticated but has insufficient priviliges to access the resource.
- 404 NOT FOUND: when a resource was not found.
- 405 NOT ALLOWED: when a HTTP method is not allowed, for example when a GET request is received but only POST is returned. The standard says a "Allow-header" MUST be present when issueing a 405, e.g.: Allow: GET, HEAD, PUT.
- 406 NOT ACCEPTABLE: when the client sends a list of Accept-Encoding values and none of the encodings are available for the requested resource return 406.
- 409 CONFLICT: when a resource already exists (i.e. the business key exists). The response body should describe how to resolve the conflict.
- 410 GONE: when the resource no longer exists. Use 404 NOT FOUND when you don't keep track of removed resources.
- 412 PRECONDITION FAILED: when a PUT requests contains If-Unmodified-Since or If-Match HTTP headers do not match the ETag values on the server. These tags are used to implement concurrency control for PUT requests.
- 413 REQUEST ENTITY TOO LARGE: when the body of a POST or PUT request is too large.
- 415 UNSUPPORTED MEDIA TYPE: when a client sent a message body in a format the service does not understand.
- 500 INTERNAL SERVER ERROR: when an exception occurred on the server. This is a good "catch-all" or "fallback" error code when an uncaught exception occurred.
- 503 SERVICE UNAVAILABLE: when the server cannot fulfill a request for some time. Add a Retry-After HTTP header if possible.

## URL format

- Keep the base API url short, for example `http://api.example.com`.
- Keep urls lowercase, avoid camelCase (even for slugs!) and use hyphens in your slugs rather than underscores. Treating `/users/bob` and `/users/Bob` as two different instances is confusing (and most likely incorrect as well).
- Use nouns in urls, not verbs.
- Pagination: `/users?limit=20&offset=60`
- Search: `/search?q=my+search`
- Ordering: `/posts?sort=date` and `/posts?sort=-date` for descending.
- Search within a specific collection: `/users/search?q=bob`.
- Versioning: use `/v1/users`, do not change the media type so you guarantee the same url can't be used for different representations.
- Request partial result: `/users/bob?fields=firstName,lastName`
- Avoid communicating minor version numbers (like 1.1), minor versions must be backwards compatible and can be published without worrying about consumer compatibility. Only backwards incompatibile changes warrent releasing a new version in the url of your service (also, limiting the number of supported versions reduces the maintenance burden).
- Don't expose surrogate keys like generated sequence numbers in the interface, use a slug or some other generated string.

## Response body

- ~~Write JSON in camelCase if your API is primarily consumed by JavaScript applications. JSON is most likely consumed by front-end JavaScript and JSON originated from JavaScript.~~ I tend to write my API's in snake_case these days as I noticed most of my favourite APIs use snake_case presumably because it's easier to read and avoids the difficulty with handling abbreviations (URL or Url) (2019-01-19)
- Avoid unnecessary data envelopes. The client knows he is requisting a user when the url is `/users/bob` returning a response like this is of little use:

  ```json
  {
    "user": {
      "firstName": "Bob"
    }
  }
  ```

- Use ISO-8601 / [RFC-3339](https://www.ietf.org/rfc/rfc3339.txt) timestamps without exception in your service protocol. UNIX timestamps do not support timezones nor milliseconds.
- Prefer linking resources over embedding resources unless the linked resource is almost always required while fetching the main resource. This is context-dependent. For example, a GET `/users/bob` might return the following:

  ```json
  {
    "firstName": "Bob",
    "lastName": "Marley",
    "address": {
      "href": "http://example.com/users/bob/address"
    }
  }
  ```

- When accessing the address is fairly uncommon this response works well for service consumers; the client has sufficient details to retrieve the address if it needs to. However, if in say 80% of requests the consumer also requests the user's address you can lower the number of network requests by embedding the resource within the GET /users/bob response body.
- When a resource is available under under two different urls (a scenario common when embedding resources) consider using partial result queries instead (e.g. GET /users/bob?fields=firstName,lastLame. Having two different urls for the same resource may improperly invalidate a HTTP cache causing two different representations of the same resource to exist at the same time.
- Be descriptive in error messages and include a code that can be interpreted by a machine. This is useful for machine interpretation, and internationalization in particular.

  ```json
  {
    "status": 401,
    "message": "Insufficient priviliges",
    "code": 1205,
    "more_info": "http://www.someresult.com/docs/errors/1205"
  }
  ```

## JSON/REST API documentation (\*)

- Mention title, url, method, url parameters (if any), data parameters (if any), success response, error responses and a request sample.
- For each url and data paramter state whether the argument is optional or required.
- For each url and data parameter state which other constraints apply (formatting, relationships, etc)
- For each success and error response message state which HTTP status accompanies it.

(\*) Most JSON/REST API style guides stress you should put in the effort to make understandable error response messages. I tend to disagree; a custom error code has sufficed in many applications for decades, why not for JSON/REST services? This avoids the issue of system error message internationalization and you need proper JSON/REST API documentation anyway because JSON/REST lacks a schema definition. Without documentation any service constraints will be a matter of development trial & error (which makes for an unhappy programmer).

Some sources I've bookmarked about these subjects:

- https://s3.amazonaws.com/tfpearsonecollege/bestpractices/RESTful+Best+Practices.pdf
- http://www.slideshare.net/rmaclean/json-and-rest
- http://www.youtube.com/watch?v=hdSrT4yjS1g
- http://www.slideshare.net/stormpath/rest-jsonapis
- http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#useful-post-responses
