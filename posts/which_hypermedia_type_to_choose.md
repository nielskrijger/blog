# Which Hypermedia type to choose? JSON-LD, HAL, Collection+JSON, Siren and JSON API.

This post is inspired by a blogpost of Kevin Sookocheff on different hypermedia types. He compares four hypermedia types: JSON-LD, HAL, Collection+JSON, and Siren. Continuing on his work in this blog I review a fifth one: JSON API. Furthermore I want to detail better what sets these five different hypermedia types apart which may guide you better into selecting your preferred hypermedia type or aid you in designing your own.

## The model

Kevin uses a small player-model you might find in a game. The resource player representation looks like this (this is directly taken from Kevin's blogpost):

	GET https://api.example.com/player/1234567890
	
	{
		"playerId": "1234567890",
   	 	"alias": "soofaloofa",
    	"displayName": "Kevin Sookocheff",
    	"profilePhotoUrl": "https://api.example.com/player/1234567890/avatar.png" 
	}
	
A collectin of players looks like this:

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
    
This simple player representation is the basis for the comparison Kevin made between four different hypermedia types, you should definitely check out his Gist: [https://gist.github.com/soofaloofa/9350847](https://gist.github.com/soofaloofa/9350847).

## JSON API

JSON API is a hypermedia specification that works best for smart clients able to cache documents to prevent redundant requests. This requires more logic on the client's side but fortunately JSON API has decent tool support for [many languages](http://jsonapi.org/examples/).

The single player model would look like this using JSON API:

	GET https://api.example.com/player/1234567890
	
    {
        "players": [{
            "id": "1234567890",
            "alias": "soofaloofa",
            "displayName": "Kevin Sookocheff",
            "profilePhotoUrl": "href": "https://api.example.com/player/1234567890/avatar.png"
        }]
    }
    
Similar to Collection+JSON the player model is wrapped in an array the same way a collection resource would be:

	"players": [{
		...
	}]
	
The advantage of this is the client parser can parse single resources the same way it parses collection resources. The disadvantage is it feels a bit odd to represent a resource in an array if you know there is at most one single resource in it.

A key requirement for any hypermedia type is to be able to link to other resources. JSON API really pushes you to identify resources with the reserved keyword `id`; as a result in the player model `playerId` was renamed `id`.
