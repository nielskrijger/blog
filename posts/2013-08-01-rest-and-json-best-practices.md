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

REST is an architecture style that has been poorly understood for a long time. Nowadays there are lots of excellent style guides. Below I've gathered some guidelines and best practices from various sources.

## HTTP methods

- The collection must be in plural, e.g. `GET /users/bob` instead of `GET /user/bob`
- If you need to do something that may yield different results if you call it multiple times after each other (i.e. the service is not idempotent) use POST.
- GET and DELETE do what you think they do.
- Use POST when creating a new resource and the server determines the resource identifier.
- Use PUT when creating a new resource and the client determines the resource identifier/URI. For example, when the business key is a UUID set by the client.
- Use PUT if you want to overwrite an existing resource (e.g. update all properties of `/users/bob`).
- Use PATCH if you want to partially update an existing resource. 
- Use PUT to invoke an action on a resource, e.g. `PUT /users/bob/authenticate`. Ideally you avoid actions altogether by turning them into resource collections, e.g. `POST /tokens`.
- If the client is limited to making POST and GET requests add an additional query parameter to the url, for example `/users/bob?method=DELETE`. Be aware software that is HTTP-aware may no longer work properly, for example caching.

## HTTP result codes

The following list contains the more relevant REST-service HTTP status codes. A common mistake is to return a 200 OK when something went wrong; REST services ought to utilize what HTTP has on offer.

- 200 OK: when a request was processed successfully, for example when a partial update succeeded.
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

- ~~Write JSON in camelCase if your API is primarily consumed by JavaScript applications. JSON is most likely consumed by front-end JavaScript and JSON originated from JavaScript.~~ I tend to write my API's in snake_case these days as I noticed most of my favourite APIs use snake_case, presumably because it's easier to read and avoids the difficulty with handling abbreviations (URL or Url) (2019-01-19)
- Avoid unnecessary data envelopes. The client knows he is requesting a user when the url is `/users/bob` so returning a response like this is of little use:

  ```json
  {
    "user": {
      "firstName": "Bob"
    }
  }
  ```

- Prefer ISO-8601 / [RFC-3339](https://www.ietf.org/rfc/rfc3339.txt) timestamps over unix timestamps.
- Prefer linking resources over embedding resources unless the linked resource is almost always required while fetching the main resource. For example, in the following the address is linked rather than embedded in the GET `/users/bob` response:

  ```json
  {
    "firstName": "Bob",
    "lastName": "Marley",
    "address": {
      "href": "http://example.com/users/bob/address"
    }
  }
  ```

- When a resource is available under under two different urls (a scenario common when embedding resources) consider using partial result queries instead (e.g. `GET /users/bob?fields=firstName,lastLame`. Having two different urls for the same resource may improperly invalidate a HTTP cache causing two different representations of the same resource to exist at the same time.
- Be descriptive in error messages and include a code/constant that can be interpreted by a machine. This is useful for machine interpretation, and internationalization in particular.

  ```json
  {
    "status": 401,
    "message": "Insufficient priviliges",
    "code": 1205,
    "more_info": "http://www.someresult.com/docs/errors/1205"
  }
  ```

## JSON/REST API documentation (\*)

- OpenAPI/Swagger is the defacto standard for business REST API documentation.
- Mention title, url, method, url parameters (if any), data parameters (if any), success response, error responses and a request sample.
- For each url and data paramter state whether the argument is optional or required.
- For each url and data parameter state which other constraints apply (formatting, relationships, etc)
- For each success and error response message state which HTTP status accompanies it.

Some sources I've bookmarked on these subjects subjects:

- https://s3.amazonaws.com/tfpearsonecollege/bestpractices/RESTful+Best+Practices.pdf
- http://www.slideshare.net/rmaclean/json-and-rest
- http://www.youtube.com/watch?v=hdSrT4yjS1g
- http://www.slideshare.net/stormpath/rest-jsonapis
- http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#useful-post-responses
