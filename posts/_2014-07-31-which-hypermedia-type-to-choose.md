# Which Hypermedia type to choose? JSON-LD, HAL, Collection+JSON, Siren and JSON API.

This post is inspired by a blogpost of Kevin Sookocheff on [choosing a hypermedia types](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/). Kevin compares four hypermedia types: [JSON-LD](http://www.w3.org/TR/json-ld/), [HAL](http://stateless.co/hal_specification.html), [Collection+JSON](http://amundsen.com/media-types/collection/), and [Siren](https://github.com/kevinswiber/siren). Continuing on his work in this blog I review a fifth one: [JSON API](http://jsonapi.org/). Furthermore I want to compare what sets these five different hypermedia types apart to aid you in selecting your preferred hypermedia type or perhaps designing your own.

## What is Hypermedia?

I won't explain Hypermedia in detail, others can do that much better; I particularly like the article of Martin Fowler on [Richardson's REST Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). In this model the most matured REST API designs include what is referred to as **Hypermedia Controls**. Hypermedia Controls tell the service consumer what it can or should do next.

For example, instead of:

	GET /person/494135
	{
		"firstName": "John"
	}

You might get:

	GET /person/494135
	{
		"firstName": "John",
		"links": [
			"self": { "href": "/person/494135" },
			"manager": { "href": "/person/24678" }
		]
	}

Note the added `links` which describes the document `self` and a manager-reletionship.

The advantage of these hypermedia controls is the API becomes more easily discoverable; effectively it becomes self-documenting. Smart clients can make use of these controls and walk through all resources without additional logic.

## The example model

In this blogpost I continue with the design of [Kevin](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/). who used simple player-model to demonstrate the differences between various hypermedia types. The player-representation of this model looks like this (this is taken directly from Kevin's blogpost):

	GET https://api.example.com/player/1234567890

	{
		"playerId": "1234567890",
   	 	"alias": "soofaloofa",
    	"displayName": "Kevin Sookocheff",
    	"profilePhotoUrl": "https://api.example.com/player/1234567890/avatar.png"
	}

A collection of players may look like this:

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

Checkout the following Gist to compare implementations of this model in JSON-LD, HAL, Collection+JSON and Siren: [https://gist.github.com/soofaloofa/9350847](https://gist.github.com/soofaloofa/9350847).

## JSON API

JSON API is a hypermedia specification that works best for smart clients able to cache documents to prevent redundant requests. This requires more logic on the client side but fortunately JSON API has decent tool support for [many languages](http://jsonapi.org/examples/).

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

Similar to Collection+JSON the player model is wrapped in an array the same way a collection resource would be:

	"players": [{
		...
	}]

The advantage of this is the client parser can parse single resources the same way it parses collection resources. The disadvantage is it feels a bit odd to represent a resource in an array if you know there is at most one single resource within an array.

### Resource identity

A key requirement of any hypermedia type is to be able to link to other resources. JSON API forces you to identify resources with the reserved keyword `id`; as a result in our player model the attribute `playerId` was replaced by `id`.

Is this a problem? It might.

Often you cannot represent a resource using a single [idempotent](http://en.wikipedia.org/wiki/Idempotence) [business/natural key](http://en.wikipedia.org/wiki/Natural_key). For example, you might represent comments on a blogpost as follows:

	GET https://api.example.com/post/51/comments/1

    {
        "comments": [{
            "id": "1",
            "blogId": "51",
            "message": "This is the first comment"
        }]
    }

In this example the `comment` maintains a reference to the blogpost it was posted in and the `id` is a sequential number incremented every time a comment is added to the blogpost. While you can argue whether this is good design or not; in practice such relationships are fairly common.

The comment can only be identified by the combination of `id` and `blogId` and forms a compound key. This is incompatible with a single `id`-attribute. To adapt to JSON API you might change `id` to `commentId` and substitute `id` with a [surrogate key](http://en.wikipedia.org/wiki/Surrogate_key).

Also, when using an UUID as an ID supporting requests like `GET http://api.example.com/persons/{id},{id},{id}` might cause you to hit the [2000-character limit](http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers) for an URL.

So while the `id` in JSON API might appear simple and elegant, its use might be limiting in advanced use cases.

### JSON API collection


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
- *Pagination*: whether pagination has been specified. To fully support this feature the response should include a size or total so the client knows how many pages are available. If the specification only lists the use of `next/prev`-relationships this is marked as `minimal` supprt.
- *Sorting*: whether a collection sort standard is specified (e.g. `/persons/?sort=name`).
- *Error*: whether a standard error format is specified.
- *Patch*: whether PATCH-requests are supported. PATCH requests allow partial updates of a resource.
- *Query*: whether the client can determine which queries are supported on a collection resource.
- *Partial result*: whether the client can filter the result to specific fields.
- *Matches original*: a subjective measure that expresses how much the hypermedia type resembles the original (vanilla) model specified in the beginning.
- *Complexity*: a subjective measure that expresses how difficult it is to implement a client and server implementation of the standard.

<table class="table table-striped">
  <tr>
    <th>Hypermedia Type</th>
	<th>Primary keywords</th>
	<th>Embedded resources</th>
	<th>Single object wrapper</th>
	<th>Pagination</th>
	<th>Sorting</th>
	<th>Error</th>
	<th>Patch</th>
	<th>Query</th>
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
	<td>Yes</td>
	<td>Yes</td>
	<td>Yes</td>
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
	<td>Minimal</td>
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
	<td>Yes</td>
	<td>No</td>
	<td>Yes</td>
	<td>No</td>
	<td>2/5</td>
	<td>Medium</td>
  </tr>
  <tr>
	<td>Siren</td>
	<td>class, properties, entities, links, actions, title, rel, href, type</td>
	<td>Yes</td>
	<td>In properties</td>
	<td>Minimal</td>
	<td>No</td>
	<td>No</td>
	<td>No</td>
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
	<td>3/5</td>
	<td>High</td>
  </tr>
</table>

In this table I did not include possible extensions to the hypermedia type; Collection + JSON in particular provides many of the above features using [extensions](https://github.com/collection-json/extensions).

#### JSON API 
JSON API is the only type specifying how to sort, do partial result requests and support PATCH-requests, but it doesn't specify pagination nor querying. So despite JSON-API formalizes a lot other specifications don't, it is not complete.

What sets JSON-API apart from the other specifications is it focusses heavily on an `id`-property.

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

Which hypermedia type works for you depends on your use case. In its core a hypermedia type should tell what the client can do next. JSON-LD is the most pure of 

Some hypermedia types go one step further and allow embedding resources within requests to improve efficiency (HAL, JSON-API and Siren). Some types go further still and define how your API should look like (JSON-API, Collection+JSON, Siren); however none of these do so completely and are no substitute for API documentation. 

Siren serves a niche by focussing on representing entities; if you want to hydrate JSON response directly to a persistable entity this might be a good option.

Collection+JSON focusses on a queryable collection which may work for you if your API focusses heavily on search and want to flexibly add new search capabilities.

When designing an API that is going to be consumed by a lot of different types of consumers you likely want to use HAL. HAL leaves most of the original model intact making it easiest to adopt.

Public adoption of hypermedia types has been poor at best. While HAL has been most popular thus far, JSON API provides tool support for [several languages](http://jsonapi.org/examples/). It is unlikely that any of the above hypermedia types offers signficant advantages in most use cases unless you know who the API consumer is and tools are available to both generate and consume that hypermedia type.

If any of the above contexts applies to you and you see significant advantage in using them, go ahead. If not, plain old JSON with proper API documentation works well too.