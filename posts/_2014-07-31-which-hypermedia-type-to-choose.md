# Which Hypermedia type to choose? JSON-LD, HAL, Collection+JSON, Siren and JSON API.

This post is inspired by a blogpost of Kevin Sookocheff on [choosing a hypermedia types](http://sookocheff.com/posts/2014-03-11-on-choosing-a-hypermedia-format/). Kevin compares four hypermedia types: [JSON-LD](http://json-ld.org/), [HAL](http://stateless.co/hal_specification.html), [Collection+JSON](http://amundsen.com/media-types/collection/), and [Siren](https://github.com/kevinswiber/siren). Continuing on his work in this blog I review a fifth one: [JSON API](http://jsonapi.org/). Furthermore I want to compare what sets these five different hypermedia types apart to aid you in selecting your preferred hypermedia type or perhaps designing your own.

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

A key requirement for any hypermedia type is to be able to link to other resources. JSON API forces you to identify resources with the reserved keyword `id`; as a result in our player model the attribute `playerId` was replaced by `id`.

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

In this example the combination of `id` and `blogId` would represent a compound key; only combined they identify the resource. To adapt to JSON API you might change `id` to `commentId` and substitute `id` with a [surrogate key](http://en.wikipedia.org/wiki/Surrogate_key).

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


- Actions
- Collection metadata
- Sorting
- Pagination
- Keyword style


<table class="table table-striped">
  <tr>
    <th>Hypermedia Type</th>
	<th>Links</th>
	<th>Metadata</th>
	<th>Keyswords</th>
	<th>Object wrapper</th>
	<th>Pagination</th>
	<th>Sorting</th>
	<th>Error</th>
	<th>Matches original</th>
  </tr>
  <tr>
	<td>JSON API</td>
	<td>Yes</td>
	<td>No specifics</td>
	<td>Normal</td>
	<td>In array</td>
	<td>No</td>
	<td>Yes</td>
	<td>Yes</td>
	<td>4/5</td>
  </tr>
</table>
