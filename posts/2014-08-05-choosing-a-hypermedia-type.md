---
title: Choosing a Hypermedia Type
description: Choosing a Hypermedia Type; HAL vs JSON-LD vs Collection+JSON vs Siren vs JSON API.
date: 2014-08-05
tags:
  - REST
  - API
  - Hypermedia
layout: layouts/post.njk
---

This post is inspired by a blogpost of Kevin Sookocheff "[on choosing a hypermedia format](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/)". Kevin compares four hypermedia types: [JSON-LD](http://www.w3.org/TR/json-ld/), [HAL](http://stateless.co/hal_specification.html), [Collection+JSON](http://amundsen.com/media-types/collection/), and [Siren](https://github.com/kevinswiber/siren). Continuing on his work in this blog I review a fifth one: [JSON:API](http://jsonapi.org/). Furthermore I want to compare what sets these five different hypermedia types apart to aid you in selecting your preferred hypermedia type or perhaps help designing your own.

Contents:

1. <a href="{{ '#what-is-hypermedia' | url }}">What is Hypermedia</a>
2. <a href="{{ '#hypermedia-spec-comparison' | url }}">Hypermedia spec comparison</a>
3. <a href="{{ '#conclusion' | url }}">Conclusion</a>
4. <a href="{{ '#opinion' | url }}">Opinion</a>

# What is Hypermedia

I won't explain Hypermedia in detail, others have already done this quite well; I particularly like the article of Martin Fowler on [Richardson's REST Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). In this model the most matured REST API designs include what is referred to as **Hypermedia Controls** ("Level 3" of the REST maturity model). Hypermedia Controls tell the service consumer what it can or should do next.

For example, instead of:

```json
// GET /person/494135
{
  "firstName": "John",
  "managerId": 24678
}
```

you might get the following response:

```json
// GET /person/494135
{
  "firstName": "John",
  "managerId": 24678,
  "links": [
    { "rel": "self", "href": "https://api.example.org/person/494135" },
    { "rel": "manager", "href": "https://api.example.org/person/24678" }
  ]
}
```

The property `links` adds two resource locations:

1. the current location of the returned person resource in a `self`-link and
2. a link where the manager resource can be retrieved.

The advantage of these hypermedia controls is the API becomes discoverable; all resources can be found by traversing the links-hierarchy. In addition if all clients make use of this hierarchy rather than hardcode endpoints it is possible to dynamically change these urls on the server-side when necessary.

## The example "vanilla" model

In my review of JSON:API I continued with the design of [Kevin](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/) who uses a simple player-model to demonstrate the differences between various hypermedia types. The player-representation of this model looks like this (this is taken directly from Kevin's blogpost):

```json
// GET https://api.example.com/player/1234567890
{
  "playerId": "1234567890",
  "alias": "soofaloofa",
  "displayName": "Kevin Sookocheff",
  "profilePhotoUrl": "https://api.example.com/player/1234567890/avatar.png"
}
```

A naive representation of a collection of players may look like this:

```json
// GET https://api.example.com/player/1234567890/friends
[
  {
    "playerId": "1895638109",
    "alias": "sdong",
    "displayName": "Sheldon Dong",
    "profilePhotoUrl": "https://api.example.com/player/1895638109/avatar.png"
  },
  {
    "playerId": "8371023509",
    "alias": "mliu",
    "displayName": "Martin Liu",
    "profilePhotoUrl": "https://api.example.com/player/8371023509/avatar.png"
  }
]
```

I would recommend you to review the following Gist to compare implementations of this model in JSON-LD, HAL, Collection+JSON and Siren: [https://gist.github.com/soofaloofa/9350847](https://gist.github.com/soofaloofa/9350847).

## JSON:API

JSON:API is a hypermedia specification that works best for smart clients able to cache documents to prevent redundant requests. This requires more logic on the client side but fortunately JSON:API has decent tool support for [several languages](http://jsonapi.org/examples/).

The single player model would look like this using JSON:API:

```json
// GET https://api.example.com/player/1234567890
{
    "players": [{
        "id": "1234567890",
        "alias": "soofaloofa",
        "displayName": "Kevin Sookocheff",
        "profilePhotoUrl": "href": "https://api.example.com/player/1234567890/avatar.png",
        "href": "https://api.example.com/player/1234567890",
    }]
}
```

Notice the player model is wrapped in an array the same way a collection resource would be:

```json
"players": [{
    ...
}]
```

The advantage of this is the client parser can parse single resources the same way it parses collection resources. The disadvantage is it feels a bit odd to represent a resource in an array if you know there is at most one single resource within an array.

JSON:API makes use of this by allowing requests such as `GET https://api.example.com/player/1234567890,9876543210`, returning two resources in a single request. This is very powerful but requires more advanced server and client software to make effective use of.

### Resource identity

A key requirement of any hypermedia type is to be able to link to other resources. JSON:API forces you to identify resources with the reserved keyword `id`; as a result in our player model the attribute `playerId` was replaced by `id`.

Is this a problem? It might.

Often you cannot represent a resource using a single [idempotent](http://en.wikipedia.org/wiki/Idempotence) [business/natural key](http://en.wikipedia.org/wiki/Natural_key). For example, you might represent comments on a blogpost as follows:

```json
// GET https://api.example.com/post/51/comments/1
{
  "comments": [
    {
      "commentId": "1",
      "blogId": "51",
      "message": "This is the first comment"
    }
  ]
}
```

In this example the `comment` maintains a reference to the blogpost it was posted in and the `commentId` is a sequential number incremented every time a comment is added to that specific blogpost. While you might argue whether this is good design or not; in practice such designs are fairly common.

The comment can only be uniquely identified by the combination of `commentId` and `blogId`; together they form the business key (a compound key). This does not translate naturally with a single `id`-attribute. To adapt this blog API to JSON:API you might change `commentId` to `id` consider the `blogId` as inferred by the resource URL or substitute `id` with a [surrogate key](http://en.wikipedia.org/wiki/Surrogate_key).

Also, when using an UUID as an ID supporting requests like `GET http://api.example.com/persons/{id},{id},{id}` might cause you to hit the [2000-character limit](http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers) for an URL; make sure to limit your requests for max 50 ID's.

So while the `id` in JSON:API might appear simple and elegant, its use might be limiting in more advanced use cases.

### JSON:API collection

A friends-collection can be represented as follows:

```json
{
  "friends": [
    {
      "id": "1234567890",
      "name": "soofaloofa",
      "displayName": "Kevin Sookocheff"
    },
    {
      "id": "9876543210",
      "name": "Martin Liu",
      "displayName": "Kevin Sookocheff"
    }
  ],
  "links": {
    "friends.profile": {
      "href": "https://api.example.com/player/{friends.id}",
      "type": "albums"
    },
    "friends.photo": {
      "href": "https://api.example.com/player/{friends.id}/avatar.png",
      "type": "songs"
    }
  },
  "meta": {
    "friends": {
      "page": 1,
      "page_size": 10,
      "count": 3,
      "page_count": 1,
      "previous_page": null,
      "previous_href": null,
      "next_page": 2,
      "next_href": "https://api.example.com/player/1234567890/friends?page=2"
    }
  }
}
```

The JSON:API links can be very powerful; by specifying a link only once the client should be able to figure out all of the relationships without the unnecessary repeating of links.

It should be noted JSON:API does not specify how to implement pagination; the "meta" is just an example.

# Hypermedia spec comparison

In the table below I compare features and the format of hypermedia types. The table contains the following:

- _Primary keywords_: a list of keywords used in the format.
- _Embedded resources_: whether resources from another type can be embedded in the result of another type.
- _Single object wrapper_: whether or not a single resource representation is wrapped (for example `{ persons: [ { name: 'Frank' } ] }` instead of `{ name: 'Frank' }` ).
- _Documentation links_: whether the hypermedia type specifies how to access human readable documentation of a resource.
- _Pagination_: whether pagination has been specified. To fully support this feature the response should include a size or total so the client knows how many pages are available. If the specification only lists the use of `next/prev`-relationships this is marked as `minimal` supprt.
- _Sorting_: whether a collection sort standard is specified (e.g. `/persons/?sort=name`).
- _Error_: whether a standard error format is specified.
- _Patch_: whether PATCH-requests are supported. PATCH requests allow partial updates of a resource.
- _Query_: whether the client can determine which queries are supported on a collection resource.
- _Actions_: whether the hypermedia type specificies in detail which actions can be executed on a given resource.
- _Partial result_: whether the client can filter the result to specific fields.
- _Matches vanilla_: a subjective measure that expresses how much the hypermedia type resembles Kevin's original (vanilla) model.

<table class="table table-striped small">
  <tr>
    <th>Hypermedia Type</th>
	<th>Primary keywords</th>
	<th>Embedded resources</th>
	<th>Single object wrapper</th>
	<th>Documentation links</th>
	<th>Pagination</th>
	<th>Sorting</th>
	<th>Error</th>
	<th>Partial updates</th>
	<th>Query</th>
	<th>Actions</th>
	<th>Partial result</th>
	<th>Matches vanilla</th>
  </tr>
  <tr>
	<td>JSON:API</td>
	<td>id, links, meta, linked, type, href</td>
	<td>Yes</td>
	<td>In array</td>
	<td>No</td>
	<td>No</td>
	<td>Yes</td>
	<td>Yes</td>
	<td>PATCH</td>
	<td>No</td>
	<td>No</td>
	<td>Yes</td>
	<td>3/5</td>
  </tr>
  <tr>
	<td>HAL</td>
	<td>_links, _embedded, curies</td>
	<td>Yes</td>
	<td>No</td>
	<td>Yes</td>
	<td>Minimal</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>4/5</td>
  </tr>
  <tr>
	<td>Collection+JSON</td>
	<td>links, collection, items, href, data, queries, template, version, error</td>
	<td>No</td>
	<td>In array</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>Yes</td>
	<td>Write representations</td>
	<td>Yes</td>
	<td>No</td>
	<td>Yes</td>
	<td>2/5</td>
  </tr>
  <tr>
	<td>Siren</td>
	<td>class, properties, entities, links, actions, title, rel, href, type</td>
	<td>Yes</td>
	<td>In properties</td>
	<td>No</td>
	<td>Minimal</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>Yes</td>
	<td>Yes</td>
	<td>No</td>
	<td>2/5</td>
  </tr>
  <tr>
	<td>JSON+LD</td>
	<td>@context, @id, @value, @language, @type, @container, @list, @graph ...</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
	<td>3/5</td>
  </tr>
</table>

(If in your opinion there are errors in this table drop me an email and I will update it asap!)

In this table I did not include possible extensions to the hypermedia type; Collection + JSON in particular provides many of the above features using [extensions](https://github.com/collection-json/extensions).

#### JSON:API

JSON:API provides many features and is the only hypermedia type to specify how to implement sorting and to support [PATCH](http://tools.ietf.org/html/rfc5789) requests. JSON:API is an attempt to be a complete API specification. Unfortunately it is not complete as it does not specify pagination, querying nor actions.

JSON:API is different from other linking strategigies in that it focusses heavily on an `id`-property specified for each resource representation. This allows JSON:API to create more complex resource links and enable a client application to prevent redundant resource requests. To fully utilize these features advanced client software is required which JSON:API provides for several [languages](http://jsonapi.org/examples/). If you're unable to use such a library JSON:API wil be more difficult to make full use of.

#### HAL

HAL is very focused in doing two things: providing links to other resources and embedding resources in a response message. In practice these are likely the two key features you are most interested in when choosing a hypermedia type; you can specify all other features in your API documentation.

Surprisingly HAL is the only hypermedia type to specify how to access additional API documentation, no other hypermedia type discussed in this article does this as explicitly as HAL does. To understand why, consider what hypermedia is all about: "service discoverablity". To quote directly from Martin Fowler's article on the REST Maturity Model:

> The links give client developers a hint as to what may be possible next. It doesn't give all the information: both the "latest" and "cancel" controls point to the same URI - they need to figure out that one is a GET and the other a DELETE. But at least it gives them a starting point as to what to think about for more information and to look for a similar URI in the protocol documentation. [Martin Fowler](http://martinfowler.com/articles/richardsonMaturityModel.html)

Considering this and you'd consider it odd no other hypermedia type is as explicit as HAL in defining links to documentation.

If I discovered one thing while writing this article it is that no single hypermedia type is capable of automatically supporting all possible service capabilities; no matter which hypermedia type you choose, decent API documentation will be required. You just as well may include API documentation in your service response.

#### Siren

Siren focusses on the concept of an "entity" which has a "class"-attribute. This class attribute is a type-descriptor (for example "order", or "person") and may help you to deserialize the JSON response into an object. In addition this type-descriptor may guide your view-layer in how to display the result. In other hypermedia types this class information is similar to the 'rel' (relationship) property of a link.

Siren is the only hypermedia type providing detailed information to the client what sort of actions can be executed on the entity. For example, as part of an order entity it may define an action to add order-items like this:

```json
//...
"actions": [
    {
        "name": "add-item",
        "title": "Add Item",
        "method": "POST",
        "href": "http://api.x.io/orders/42/items",
        "type": "application/x-www-form-urlencoded",
        "fields": [
            {
                "name": "orderNumber",
                "type": "hidden",
                "value": "42"
            },
            {
                "name": "productCode",
                "type": "text"
            },
            {
                "name": "quantity",
                "type": "number"
            }
        ]
    }
]
// ...
```

No other hypermedia type goes this far in specifying which actions can be executed on a resource. Then again, implementing a client responsive enough to fully utilize this information will take significant effort.

#### Collection+JSON

A collection resource has many more characteristics than a single resource; collections should consider pagination, ordering and filtering. Collection+JSON focusses on filtering primarily. In addition it supports limiting message size by supporting partial results through the use of `templates`. For example a collection that can be queried by `name` and whose representations can be limited to `name`, `email`, `blog` and `avater`-properties might look like this:

```json
{
  "collection": {
    "version": "1.0",
    "href": "http://example.org/friends/",
    "links": [
      {
        "rel": "feed",
        "href": "http://example.org/friends/rss"
      }
    ],
    "items": [
      //...resourcerepresentations...
    ],
    "queries": [
      {
        "rel": "search",
        "href": "http://example.org/friends/search",
        "prompt": "Search",
        "data": [
          {
            "name": "search",
            "value": ""
          }
        ]
      }
    ],
    "template": {
      "data": [
        {
          "name": "name",
          "value": "",
          "prompt": "Full Name"
        },
        {
          "name": "email",
          "value": "",
          "prompt": "Email"
        },
        {
          "name": "blog",
          "value": "",
          "prompt": "Blog"
        },
        {
          "name": "avatar",
          "value": "",
          "prompt": "Avatar"
        }
      ]
    }
  }
}
```

Why pagination and ordering are not covered in Collection+JSON I don't understand. In addition Collection+JSON discusses partial updates using "[Write representations](http://amundsen.com/media-types/collection/examples/#ex-write)" with POST or PUT; something [PATCH](http://tools.ietf.org/html/rfc5789) is better suited for.

#### JSON-LD

JSON-LD looks deceptively simple based on the example from their homepage:

```json
{
  "@context": "http://json-ld.org/contexts/person.jsonld",
  "@id": "http://dbpedia.org/resource/John_Lennon",
  "name": "John Lennon",
  "born": "1940-10-09",
  "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
}
```

However, supporting all possible ways to structure linked data (http://www.w3.org/TR/json-ld-api/) is a daunting task. In addition JSON-LD does only one thing really, which is linking resources. Fair enough it does this better than any of the other specifications and enables strict type checking.

Given its scope and complexity JSON-LD looks to be more of an academic exercise rather than a current practical solution.

I cannot beg to question, if you have a use case that requires the formality of JSON-LD, why not use WSDL/SOAP instead?

# Conclusion

Which hypermedia type works for you depends entirely on your use case. In its core a hypermedia type should provide hypermedia controls telling what a client can do next. JSON-LD is the most pure form of defining links between resources and the most formal as well; if proper linking of resources is a core requirement for your project definitely give JSON-LD a look.

Most other hypermedia types go further than just linking resources and allow embedding resources within a response to improve efficiency (e.g. HAL, JSON:API and Siren).

Some hypermedia types go further still and define how your API should look like (e.g. JSON:API, Collection+JSON, Siren). If this is your goal one word of caution; none of those hypermedia types are complete and substitute proper API documentation.

Siren serves a niche by focussing on representing entities and their actions; if you want to hydrate JSON responses directly to an object and automatically guide the client in executing subsequent actions on this entity Siren might be an interesting option.

Collection+JSON focusses on collection resources and how to filter/query them. If your API is primarily search-driven and you want to flexibly add new search capabilities give Collection+JSON a look.

When designing a public API consumed by lots of different consumers you will want to use HAL. HAL leaves most of the "vanilla" model intact making it easiest to adopt; HAL can easily be ignored by clients who don't care about hypermedia (which in a public open environment will often be the case).

If a key concern is caching resources within the client while designing a very neat and formal REST service, JSON:API would be my first choice.

# Opinion

**For now I'd stick with documenting REST API's using Swagger/OpenAPI with resources being represented in their vanilla format until one of those hypermedia controls becomes really popular across multiple programming languages and frameworks.**

Hypermedia controls add significant complexity to your API design and for many clients may provide no benefits at all and simply complicate your API. Support in automated clients is poor and its intent is often misunderstood and not adopted fully. They are not a substitute to documentation as context and business logic cannot be captured in the API specification alone.

Public adoption of hypermedia types has been poor at best, in fact while researching for this article I found few implementations of the discussed hypermedia types.

Having said that, HAL appears to be the best known and most popular hypermedia type currently (and the easiest to implement), arguably JSON:API comes in second with tool support for [several languages](http://jsonapi.org/examples/). The other hypermedia types feel very much specialized and suitable for niche use cases only.

If you do need very strict and rigid API's that ought to be automatically interpreted in a wide range of tools; you should appreciate this has already been achieved more than a a decade ago in the form of SOAP/WSDL/UDDI. While these technologies work well in many business (and thus controlled) environments these technologies never caught on in the public API space simply because the technology is too complicated and cumbersome to use. Many of the hypermedia examples I've seen reminded me of WSDL/SOAP/UDDI; adding a lot of complexity.
