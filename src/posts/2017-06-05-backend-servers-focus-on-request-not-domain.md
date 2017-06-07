# Backend Servers: Focus on the request, not the domain

Allow me to categorize backend web application architectures into two types:

1. Domain-Driven Architectures
2. Protocol-Driven Architectures

This blog discusses the distinction between the two and my (current) position why you should consider protocol-based architectures most of the time.

## Domain-Driven Architecture (DDA)

A domain-driven architecture models the business environment within the application using a "business layer"; usually using class-based objects. This business layer might have a "User" object with properties such as "firstName", "roles" and provide methods to mutate the entity state.

Usually after a typical backend API request when all business logic has resolved the final state is persisted using an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) or [ODM](https://stackoverflow.com/questions/12261866/what-is-the-difference-between-an-orm-and-an-odm) implementing a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html).

This domain-drive architecture is prevalent in Java and C#, and most other programming languages offer frameworks supporting such an architecture. Many [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)-type frameworks fall into this category.

**Strong points:**

- Domain objects and their relationship are clearly defined in code
- Multiple mutations can easily be combined in a single transaction
- Complex business logic can be centrally enforced

**Weak points:**

- An ORM/ODM abstracts away data mutation logic, making it difficult to debug
- A shared core with both domain properties and business logic is inherently less stable over time than separating request logic
- Moves focus away from API to the business domain model (why this is bad I explain later)

## Protocol-Driven Architecture (PBA)

A protocol-based architecture focuses on the request/response (usually HTTP) and the side-effect it wants to achieve.

The PBA is characterized by a lack of abstractions and a strong focus on the communication protocol. It uses plain SQL or NoSQL calls and makes no attempt to capture domain entities and their relationships within application code.

Microframeworks (e.g. [Sinatra](http://www.sinatrarb.com/), [Flask](http://flask.pocoo.org/) or [Express.js](https://expressjs.com/)) usually fall into this category.

Interestingly these frameworks are more popular in dynamically typed languages and [Golang](https://golang.org/).

**Strong points:**

- Focus on API / contract
- Less complex and little shared code makes a request easier to debug and test
- Software changes are constrained to a limited surface area
- Performance much better than domain-driven frameworks ([src](https://www.techempower.com/benchmarks/))

**Weak points:**

- Difficult to enforce business logic in the entire application
- More code duplication and boilerplate
- The domain model is often unclear from code alone (particularly in a dynamically typed language), one has to look at the database schema or documentation

## Why I prefer Protocol-Based Architectures

For various reasons I have come to favour the protocol-based architecture over a domain-driven one in many -of not most- situations.

### API is number one

For me the order of priority when building a backend API server is (1) **API** (most important), (2) **data** and (3) **code** (least important). The reasoning for this order is one of adaptability.

  3) Changing **code** is usually fairly easy, particularly when automated testing is in place.

  2) Changing **data** is difficult and painful, requiring migration scripts to be run on production systems and lots of testing.

  1) Changing **API**'s' is by far the most painful because all clients depending on that contract will need to change too, often during a (long) migration period.

DDA's tend to focus the application design on the domain model (e.g. [DDD](https://en.wikipedia.org/wiki/Domain-driven_design)) thus focus on a model layer within the application code rather than the API (e.g. [REST](https://en.wikipedia.org/wiki/Representational_state_transfer)) or data store.

If I learned one thing at oracle (a period I don't like to talk about...), it's they are right in one thing: `business == data`. Don't underestimate how long data survives, applications usually don't. Take a 30-year perspective.

### Yet another model

DDA's introduce a third model that you have to reason about. Assume a webshop receives a request `POST /orders { ... }`, let's call the model of this request "**REQ**". Eventually the order is persisted in a database; model "**DB**". The DDA introduces a third model capturing relationships between domain object (for example, between a `User` and the `Order`) in the application code. Let's call this model "**APP**".

Now the developer is faced with the challenge to translate **REQ** to **APP** to **DB**... and back again. Commonly "controllers" are used to direct this process. How best to develop controllers has always been a tricky issue evidenced by the numerous discussions on '[Fat](http://blog.joncairns.com/2013/04/fat-model-skinny-controller-is-a-load-of-rubbish/) [models](https://stackoverflow.com/questions/14044681/fat-models-and-skinny-controllers-sounds-like-creating-god-models) [and](https://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc) [skinny](http://robdvr.com/fat-models-skinny-controllers-skinny-models-skinny-controllers/) [controllers](http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model)'.

A third model makes it less clear where code responsibilities lie. Some examples:

- Input validation can be part of **REQ** or enforced centrally in **APP**
- An email being unique can only be truly guaranteed by **DB** whereas you might expect such logic in **APP**
- For one request you know immediately upon receiving **REQ** the client is not authorized, whereas for another request domain objects must be retrieved to establish authorization, a responsibility of **APP**.

Despite the introduction of a third model you will find a lot of shared code does not fit well anywhere and ends up in separate "services".

A software design with just **REQ** and **DB** is more straightforward, in essence becoming a set of scripts, each handling it's own request.

### Testability

While working on PBA's I noticed writing fewer unit tests and more component and integration tests compared to DDA's; to the point where I write hardly any unit tests at all in backend code.

Component and integration tests provide a lot more confidence that the backend application is actually behaving correctly, with better code coverage in fewer lines of code. This I could do because of two reasons:

1. PBA's are fairly simple to debug, there are few interacting code-paths that may fail in some unexpected way
2. I switched to languages and tools that make running and developing such tests lightning fast

In contrast, DDA's have more shared pieces of interacting code (e.g. services and models) which require the developer to treat them as an internal API that must remain fairly stable and bugfree. Hence the need to add unit tests for those.

### Split into microservices

DDA's are a complex solution to solve an even more complex problem; huge applications with hundreds of thousands LoC that must all work together. It is only natural to try and establish some law and order in such an application, the domain model layer is ideal for that.

For a long time it was too cumbersome and complex to split such an application into smaller web applications and deploy and operate them together.

The more recent developments in containerization and cloud technologies to run them has changed this. When an application becomes too big and too complex there are few reasons to not try to split them it into multiple backend apps. PBA's are much easier to split up than DDA's.

## Why keep using Mobel-Based Architectures

### Good framework support

There are plenty of frameworks supporting the domain-driven design with which developers are familiar. Prevalent languages in business software (Java and C#) have ecosystems that have evolved to accomodate the domain-driven architecture extremely well.

Having to learn a new framework which is more opinionated allows you to get quicker onboard.

### Focus on business logic

Most business software is written with models in mind and the vocabularly of functional analysts is Domain, not Request-Response. Functional analysts will discuss business constraints and logic; the home of the domain layer in an application. They have little knowledge of REST or Queuing API contracts.

This focus on the business logic goes so far that most software architects developing business software I've met don't care much about API contracts. Going against the grain in such circumstances may be more effort than you'd ever gain.

### Not a real API server

Many backend servers also process HTML requests for some reason or other which changes the context completely; any homepage will have multiple subcomponents which require state from different domain contexts. Loading this state into memory with all relationships efficiently is a difficult programming challenge; the reason why we adopted MVC and component-based frontend frameworks in the first place.

When executing requests that stretch multiple domain contexts a domain-driven design works better.

## Conclusion

With the rise of microservices the need to centrally enforce business logic within an application has lessened. The microservice architectures in itself is a difficult and complex architecture, but a simpler one to evolve over time than the backend monolith.

The database abstractions and domain-based frameworks out there all promise you to "develop faster". They don't. They focus on developing nicely looking code and separation of concerns to more easily model a complex business environment. They don't focus on building an API. By separating requests in your application code (e.g. a simple `post-user.xyz` file) you establish the ultimate separation of concerns: *separation of request*.

### Note on frontend apps

I should clarify for frontend code I take a different view entirely, particularly for single-page applications (SPA's). Frontend apps differ from backend servers in several ways:

- A frontend model instance has a much longer lifespan (the duration of a session, minutes or even hours) compared to a brief stateless backend request (milliseconds).
- A frontend model usually resembles a ViewModel which has a limited application scope (think [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)).
- SPA's are difficult to split up, few will want to force the useragent to download multiple client apps.
- Abstractions for REST API's are not that common and those that exist are usually dreadful and useless (I'm looking at you [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource)!).
