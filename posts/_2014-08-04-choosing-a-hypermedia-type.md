# Choosing a Hypermedia Type: HAL vs JSON-LD vs Collection+JSON vs Siren vs JSON API.

This post is inspired by a blogpost of Kevin Sookocheff "[on choosing a hypermedia format](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/)". Kevin compares four hypermedia types: [JSON-LD](http://www.w3.org/TR/json-ld/), [HAL](http://stateless.co/hal_specification.html), [Collection+JSON](http://amundsen.com/media-types/collection/), and [Siren](https://github.com/kevinswiber/siren). Continuing on his work in this blog I review a fifth one: [JSON API](http://jsonapi.org/). Furthermore I want to compare what sets these five different hypermedia types apart to aid you in selecting your preferred hypermedia type or perhaps help designing your own.

## What is Hypermedia?

I won't explain Hypermedia in detail, others have already done this quite well; I particularly like the article of Martin Fowler on [Richardson's REST Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). In this model the most matured REST API designs include what is referred to as **Hypermedia Controls** ("Level 3" of the REST maturity model). Hypermedia Controls tell the service consumer what it can or should do next.

For example, instead of:

	GET /person/494135
	{
		"firstName": "John",
		"managerId": 24678
	}

you might get the following response:

	GET /person/494135
	{
		"firstName": "John",
		"managerId": 24678,
		"links": [
			{ "rel": "self", "href": "https://api.example.org/person/494135" },
			{ "rel": "manager", "href": "https://api.example.org/person/24678" }
		]
	}

The property `links` adds to two resource locations: 1) the current location of the returned person resource in a `self`-link and 2) a link where the manager resource can be retrieved.

The advantage of these hypermedia controls is the API becomes discoverable; all resources can be found by traversing the links-hierarchy. In addition if all clients make use of this hierarchy rather than hardcode endpoints it is possible to dynamically change these urls on the server-side when necessary.

## The example "vanilla" model

In my review of JSON API I continue with the design of [Kevin](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/) who uses a simple player-model to demonstrate the differences between various hypermedia types. The player-representation of this model looks like this (this is taken directly from Kevin's blogpost):

	GET https://api.example.com/player/1234567890

	{
		"playerId": "1234567890",
   	 	"alias": "soofaloofa",
    	"displayName": "Kevin Sookocheff",
    	"profilePhotoUrl": "https://api.example.com/player/1234567890/avatar.png"
	}

A naive representation of a collection of players may look like this:

	GET https://api.example.com/player/1234567890/friends

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

I would recommend you to review the following Gist to compare implementations of this model in JSON-LD, HAL, Collection+JSON and Siren: [https://gist.github.com/soofaloofa/9350847](https://gist.github.com/soofaloofa/9350847).

## JSON API

JSON API is a hypermedia specification that works best for smart clients able to cache documents to prevent redundant requests. This requires more logic on the client side but fortunately JSON API has decent tool support for [several languages](http://jsonapi.org/examples/).

The single player model would look like this using JSON API:

	GET https://api.example.com/player/1234567890

    {
        "players": [{
            "id": "1234567890",
            "alias": "soofaloofa",
            "displayName": "Kevin Sookocheff",
            "profilePhotoUrl": "href": "https://api.example.com/player/1234567890/avatar.png",
            "href": "https://api.example.com/player/1234567890",
        }]
    }

Notice the player model is wrapped in an array the same way a collection resource would be:

	"players": [{
		...
	}]

The advantage of this is the client parser can parse single resources the same way it parses collection resources. The disadvantage is it feels a bit odd to represent a resource in an array if you know there is at most one single resource within an array.

JSON API makes use of this by allowing requests such as `GET https://api.example.com/player/1234567890,9876543210`, returning two resources in a single request. This is very powerful but requires more advanced server and client software to make effective use of.

### Resource identity

A key requirement of any hypermedia type is to be able to link to other resources. JSON API forces you to identify resources with the reserved keyword `id`; as a result in our player model the attribute `playerId` was replaced by `id`.

Is this a problem? It might.

Often you cannot represent a resource using a single [idempotent](http://en.wikipedia.org/wiki/Idempotence) [business/natural key](http://en.wikipedia.org/wiki/Natural_key). For example, you might represent comments on a blogpost as follows:

	GET https://api.example.com/post/51/comments/1

    {
        "comments": [{
            "commentId": "1",
            "blogId": "51",
            "message": "This is the first comment"
        }]
    }

In this example the `comment` maintains a reference to the blogpost it was posted in and the `commentId` is a sequential number incremented every time a comment is added to that specific blogpost. While you might argue whether this is good design or not; in practice such designs are fairly common.

The comment can only be uniquely identified by the combination of `commentId` and `blogId`; together they form the business key (a compound key). This does not translate naturally with a single `id`-attribute. To adapt this blog API to JSON API you might change `commentId` to `id` consider the `blogId` as inferred by the resource URL or substitute `id` with a [surrogate key](http://en.wikipedia.org/wiki/Surrogate_key).

Also, when using an UUID as an ID supporting requests like `GET http://api.example.com/persons/{id},{id},{id}` might cause you to hit the [2000-character limit](http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers) for an URL; make sure to limit your requests for max 50 ID's.

So while the `id` in JSON API might appear simple and elegant, its use might be limiting in more advanced use cases.

### JSON API collection

A collection can be represented as follows:

    {
        "friends": [
            {
                "id": "1234567890",
                "name": "soofaloofa",
                "displayName": "Kevin Sookocheff",
                "profilePhotoUrl": "https://api.example.com/player/1234567890/avatar.png"
            },
            {
                "id": "9876543210",
                "name": "Martin Liu",
                "displayName": "Kevin Sookocheff",
                "profilePhotoUrl": "https://api.example.com/player/1234567890/avatar.png"
            }
        ],
        "links": {

        },
        "meta": {
            "artists": {
                "page": 1,
                "page_size": 10,
                "count": 3,
                "include": [],
                "page_count": 1,
                "previous_page": null,
                "previous_href": null,
                "next_page": 2,
                "next_href": "https://api.example.com/player/1234567890/friends?page=2"
            }
        }
    }

# Hypermedia types comparisons

In the table below I compare functions and format of the hypermedia types. The table contains the following:

- *Primary keywords*: a list of keywords used in the format.
- *Embedded resources*: whether resources from another type can be embedded in the result of another type.
- *Single object wrapper*: whether or not a single resource representation is wrapped (for example `{ persons: [ { name: 'Frank' } ] }` instead of `{ name: 'Frank' }` ).
- *Documentation links*: whether the hypermedia type specifies how to access human readable documentation of a resource.
- *Pagination*: whether pagination has been specified. To fully support this feature the response should include a size or total so the client knows how many pages are available. If the specification only lists the use of `next/prev`-relationships this is marked as `minimal` supprt.
- *Sorting*: whether a collection sort standard is specified (e.g. `/persons/?sort=name`).
- *Error*: whether a standard error format is specified.
- *Patch*: whether PATCH-requests are supported. PATCH requests allow partial updates of a resource.
- *Query*: whether the client can determine which queries are supported on a collection resource.
- *Actions*: whether the hypermedia type specificies in detail which actions can be executed on a given resource.
- *Partial result*: whether the client can filter the result to specific fields.
- *Matches original*: a subjective measure that expresses how much the hypermedia type resembles the original (vanilla) model specified in the beginning.
- *Complexity*: a subjective measure that expresses how difficult it is to implement a client and server implementation of the standard.

<table class="table table-striped">
  <tr>
    <th>Hypermedia Type</th>
	<th>Primary keywords</th>
	<th>Embedded resources</th>
	<th>Single object wrapper</th>
	<th>Documentation links</th>
	<th>Pagination</th>
	<th>Sorting</th>
	<th>Error</th>
	<th>Patch</th>
	<th>Query</th>
	<th>Actions</th>
	<th>Partial result</th>
	<th>Matches original</th>
	<th>Complexity</th>
  </tr>
  <tr>
	<td>JSON API</td>
	<td>id, links, meta, linked, type, href</td>
	<td>Yes</td>
	<td>In array</td>
	<td>No</td>
	<td>No</td>
	<td>Yes</td>
	<td>Yes</td>
	<td>Yes</td>
	<td>No</td>
	<td>No</td>
	<td>Yes</td>
	<td>3/5</td>
	<td>Medium</td>
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
	<td>Low</td>
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
	<td>No</td>
	<td>Yes</td>
	<td>No</td>
	<td>No</td>
	<td>2/5</td>
	<td>Medium</td>
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
	<td>High</td>
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
	<td>High</td>
  </tr>
</table>

In this table I did not include possible extensions to the hypermedia type; Collection + JSON in particular provides many of the above features using [extensions](https://github.com/collection-json/extensions).

#### JSON API 

JSON API is the only hypermedia type specifying how to sort, do partial result requests and support PATCH-requests. JSON API is an attempt to be a complete API sepcification. Unfortunately it is not complete as it does not specify pagination, querying nor actions. 

What sets JSON-API apart from the other specifications is it focusses heavily on an `id`-property. This allows it to create more complex resource links and prevent a client application to do redundant resource requests. To fully utilize these features more advanced client software is required. If such client software is not available the API style is more difficult to implement than for example HAL.

#### HAL

HAL is very focused in doing two things: providing links to other hypermedia types and embedding resources in a response. In practice these are two key features you might be interested in when choosing a hypermedia type, all other REST service characteristics may be defined in your API style guide.

Surprisingly HAL does specify how to refer the user to further documentation of the API, no other hypermedia type reviewed here does this so explicitly. Consider what hypermedia is all about: service discoverablity. To quote directly from Martin Fowler's article on the REST Maturity Model:

> The links give client developers a hint as to what may be possible next. It doesn't give all the information: both the "latest" and "cancel" controls point to the same URI - they need to figure out that one is a GET and the other a DELETE. But at least it gives them a starting point as to what to think about for more information and to look for a similar URI in the protocol documentation. [Martin Fowler](http://martinfowler.com/articles/richardsonMaturityModel.html)

Considering this viewpoint it is odd no other hypermedia type is as explicit as HAL in defining links to documentation.


#### Siren

Siren focusses on the concept of an entity which has a "class"-attribute. This class attribute resembles a type-descriptor (for example "order", or "person") and may help you to deserialize the JSON response into an object. In addition this type-descriptor may guide your view-layer in how to display the result. In other hypermedia types this class information is similar to the 'rel' (relationship) property of a link.

Siren is the only hypermedia type providing detailed information to the client what sort of actions can be executed on the entity. For example, as part of an order entity  it may define an action to add an another item like this:

	...
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
    ...

No other hypermedia type goes this far in specificying which actions can be executed on a given resource. Then again, implementing a client responsive enough to fully utilize this information will take significant effort.

#### Collection+JSON


#### JSON-LD

JSON-LD looks deceptively simple based on the example from their homepage:

    {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@id": "http://dbpedia.org/resource/John_Lennon",
        "name": "John Lennon",
        "born": "1940-10-09",
        "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
    }

However, supporting all possible ways to structure the linked data (http://www.w3.org/TR/json-ld-api/) is a daunting task. In addition JSON-LD does only one thing really, which is linking resources. Fair enough it does this better than any of the other specifications and enables strict type checking, but given its scope and complexity JSON-LD looks to be more of an academic exercise rather than a current practical solution. 

I cannot beg to question, if you have a use case that requires the formality of JSON-LD, why not use WSDL/SOAP instead?

# Conclusion

Which hypermedia type works for you depends on your use case. In its core a hypermedia type should tell what the client can do next. JSON-LD is the most pure form of defining links between resources and the most formal as well; if proper linking of resources is a key requirement definitely give JSON-LD a look.

Most other hypermedia types go further than linking resources and allow embedding resources within a response as well to improve efficiency (HAL, JSON-API and Siren). 

Some hypermedia types go further still and define how your API should look like (JSON-API, Collection+JSON, Siren); however none of these do so completely and are no substitute for API documentation. 

Siren serves a niche by focussing on representing entities and their actions; if you want to hydrate JSON responses directly to an object and automatically guide the client in executing subsequent actions on this entity Siren might be an interesting option.

Collection+JSON focusses on collection resources and how to filter/query them. If your API focusses heavily on search and you want to flexibly add new search capabilities give Collection+JSON a look.

When designing an API that is going to be consumed by a lot of different types of consumers you likely want to use HAL. HAL leaves most of the original model intact making it easiest to adopt; and HAL can easily be ignored by clients who don't care about hypermedia (which frankly will often be the case).

If a key concern is limiting the number of requests to your API while designing a very neat and formal REST service, JSON-API would be my first choice.

**So what should I do?**

Public adoption of hypermedia types has been poor at best, in fact while researching for this article I had a very tough time in finding actual use cases implementing any of the mentioned hypermedia types. As far as I know the big boys (Google, Amazon, Facebook, Twitter) haven't. 

Having said that, HAL appears to be the best known and most popular hypermedia type currently (and the easiest to implement), arguably JSON API comes in second with tool support for [several languages](http://jsonapi.org/examples/). The other hypermedia types feel very much specialized and suitable for niche use cases only. Unless you control both the producer and and client implementations be wary about adopting any hypermedia type; support for them is poor and they are frequently misunderstood. Adopting a hypermedia type might very well just complicate your API and cost you a lot of time without delivering sufficient benefits. 

If you do need very strict and rigid API's that ought to be automatically interpreted in a range of tools; first appreciate this has already been achieved a decade ago and is called SOAP/WSDL/UDDI. While these technologies work in many business environments it never caught on in the public API space simply because it is too complicated and cumbersome to use. Much of the examples I've seen for hypermedia types reminded me of this; as a result I don't believe the more advanced hypermedia types work unless proper tool support for them is available in a wide range of languages.

There are definitely use cases where one hypermedia type way work and provide significant advantages. If you're unsure, plain old JSON with proper API documentation works well too. From an Agile standpoint; keep it simple at first and if need be you can always implement HAL or JSON-LD on top of your existing API when someone shouts you should support Hypermedia.