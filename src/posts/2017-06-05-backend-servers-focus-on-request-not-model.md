# Backend Servers: Focus on the request, not the model

Allow me to divide backend web application architectures in two types:

1. Model-Based architectures
2. Request-Based architectures

This blog discusses the distinction between the two and my (current) position which to use in most scenarios.

## Model-Based Architecture (MBA)

A model-based architecture's models the business domain in an application layer usually using class-based objects. A user is represented as a "User" object with properties such as "firstName", "roles", etc and has methods to mutate its state. After all business logic has resolved for a request the final state is persisted usually using an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) or [ODM](https://stackoverflow.com/questions/12261866/what-is-the-difference-between-an-orm-and-an-odm) implementing a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html).

This model-based architecture is prevalent in Java and C#, and most other programming languages offer frameworks supporting such an architecture. Many [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)-type frameworks fall into this category.

Strong points:

- Domain objects and their relationship are clearly defined in code
- Multiple mutations can easily be combined in a single transaction
- Complex business logic can be centrally enforced

Weak points:

- An ORM/ODM abstracts away data mutation logic and may not be as efficient or as easy to debug as vanilla SQL or NoSQL alternative
- A shared core with both domain properties and business logic is inheritantly less stable over time than separating request logic
- Moves focus away from API to the business domain model

## Request-Based Architecture (RBA)

A request-based architecture focusses on the request/response (usually HTTP) and the side-effect it wants to achieve.

The RBA is characterized by a lack of abstractions and a strong focus on the communication protocol. It uses plain SQL and makes no attempt to capture domain entities and their relationships.

Microframeworks (e.g. Sinatra, Flask or Express.js) usually fall into this category and are more common and popular in dynamically typed languages and Golang.

Strong points:

- Focus on API / contract
- Less complex and shared code makes a request easier to debug and test
- Software changes are constrained to a fairly limited area of the application

Weak points:

- Difficult to enforce business logic in the entire application
- More code duplication and boilerplate
- The domain model is often unclear from code alone (particularly in a dynamically typed language), one has to look at the database schema or documentation

## Why I prefer Request-Based Architectures

For various reasons I have come to favour the request-based architecture over a model-based one in almost all situations, despite having spent more time developing MBA's than RBA's.

### API is number one

For me the order of priority when building a backend API server is (1) **API** (most important), (2) **data** and (3) **code** (least important). The reasoning for this order is one of adaptability.

Changing **code** is usually fairly easy, particularly when automated testing is in place. Changing **data** is difficult and painful, requiring migration scripts to be run on production systems and lots of testing. Changing **API** contracts however is by far the most painful because all clients depending on that contract will need to change too, often during a (long) migration period.

MBA's tend to focus the application design on the domain model (e.g. [DDD](https://en.wikipedia.org/wiki/Domain-driven_design)) thus focus on a model layer within the application code (least important) rather than the API (e.g. [REST](https://en.wikipedia.org/wiki/Representational_state_transfer).

### Yet another model

MBA's introduce a third model that you have to reason about. Assume a webshop receives a request `POST /orders { ... }`, let's call the model of this request "**REQ**". Eventually the order is persisted in a database; model "**DB**". Because object-oriented languages use objects and relationships in their application design it is intuitive to enforce the relationships between say a `User` and the `Order` in application code. Let's call this model "**APP**".

Now the developer is faced with the challenge to translate **REQ** to **APP** to **DB**... and back again. Commonly "controllers" are used to direct this process. How best to develop controllers has always been a tricky issue evidenced by the numerous discussions on '[Fat](http://blog.joncairns.com/2013/04/fat-model-skinny-controller-is-a-load-of-rubbish/) [models](https://stackoverflow.com/questions/14044681/fat-models-and-skinny-controllers-sounds-like-creating-god-models) [and](https://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc) [skinny](http://robdvr.com/fat-models-skinny-controllers-skinny-models-skinny-controllers/) [controllers](http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model)'.

A third model makes it less clear where code responsibilities lie. Is input validation part of **REQ** or enforced centrally in **APP**? An email being unique can only be truly guaranteed by **DB** whereas you might expect such logic in **APP**. For one request you may know immediately upon receiving **REQ** the client is not authorized, whereas for another request domain objects must be retrieved to establish authorization, a responsbility of **APP**.

A software design with just **REQ** and **DB** is more straightforward, in essence becoming a set of scripts, each handling it's own request.

### Testability

While working on RBA's I noticed writing fewer unit tests and more component and integration tests compared to MBA's; to the point where I write hardly any unit tests at all in backend code.

Component and integration tests provide a lot more confidence that the backend application is actually behaving correctly, with better code coverage in fewer lines of code. This I could do because of two reasons:

1. RBA's are fairly simple to debug, there are few interacting code-paths that may fail in some unexpected way
2. I switched to languages and tools that make running and developing such tests lightning fast

In contrast, MBA's have more shared pieces of interacting code (e.g. services and models) which require the developer to treat them as an internal API that must remain fairly stable and bugfree. Hence the need to add unit tests for those.

### Split into microservices

MBA's are a complex solution to solve an even more complex problem; huge applications with hundreds of thousands LoC that must all work together. It is only natural to try and establish some law and order in such an application, the domain model layer is ideal for that.

For a long time it was too cumbersome and complex to split such an application into smaller web applications and deploy and operate them together.

The more recent developments in containerization and cloud technologies to run them has changed this. When an application becomes too big and too complex there are few reasons to not try to split them it into multiple backend apps. RBA's are much easier to split up than MBA's.

## Why keep using Mobel-Based Architectures

### Good framework support

There are plenty of frameworks supporting the model-based approach with which developers are familair. Prevalent languages in business software (Java and C#) have made the model-based a defacto standard. Having to adopt a different style may feel awkward and is less opinionated than using a large framework with lots of documentation.

Even when developing an RBA there will be shared code (don't repeat yourself). How to structure that may become a point of discussion.

### Focus on business logic

Most business software is written with models in mind and the vocabularly of functional analists is Domain, not Request-Response. Business analists will discuss business constraints and logic; the home of the domain model layer within an app. They have little knowledge of REST or Queuing API contracts.

This focus on the business logic goes so far that most software architects developing business software I've met don't care much about API contracts. Going against the grain in such circumstances may be more effort than you'd ever gain.

## Conclusion

In the past model-based architectures have been useful very large applications where order must be centrally enforced. If your codebase truly grows to a size where that becomes necessity you're better of these days splitting the code into microservices. Microservice architectures in itself are a difficult and complex architecture, but a simpler one to evolve over time than the backend monolith.

The database abstractions and model-based focused frameworks out there all promise you to "develop faster". They don't. They focus on developing nicely looking code and separation of concerns, not building an API. Separate requests in your application code (a simple `post-user.xyz` file) and you have the ultimate separation of concerns: separation of requests.

### Note on front-end apps

I should clarify for front-end code I take a different view, particularly for single-page applications (SPA). Front-end apps differ from backend servers in several ways:

- A front-end model instance has a much longer lifespan (the duration of a session, minutes or even hours) compared to a brief stateless backend request (milliseconds).
- A front-end model usually resembles a ViewModel which has a limited application scope (think [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)).
- SPA's are difficult to split up, few will want to force the useragent to download multiple client apps.
- Abstractions for REST API's are not that common and those that exist are usually dreadful and useless (I'm looking at you [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource)!).
