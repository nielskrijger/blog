---
title: API vs Domain-Driven Architectures
description: API vs Domain-Driven Architectures
date: 2017-06-05
tags:
  - Architecture
layout: layouts/post.njk
---

I tend to categorize backend architectures into two types:

1. Domain-Driven Systems
2. API-Driven Systems

While these types are by no means exclusive, and in fact can be complimentary, in practice most backend systems I've seen tend to favour one or the other.

## Domain-Driven Architecture (DDA)

A Domain-Driven Architecture models the business environment within the application in what is often referred to as the "business layer" or "domain layer". This layer contains type-based objects such as a "User" with methods to mutate their state and enforce business logic.

Typically after all business logic of an API request has been resolved the final state is persisted using an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) or [ODM](https://stackoverflow.com/questions/12261866/what-is-the-difference-between-an-orm-and-an-odm) implementing a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html).

This domain-drive architecture is prevalent in Java and C#, and most other programming languages offer frameworks supporting such an architecture. Many [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)-type frameworks fall into this category.

**Strong points:**

- Domain objects and their relationship are clearly defined in code
- Multiple mutations can easily be combined into a single transaction
- Complex business logic can be centrally enforced

**Weak points:**

- An ORM/ODM abstracts away data mutation logic, making it difficult to debug or predict
- Potential side-effects are hard to predict when mutating a shared core with both domain properties and business logic
- Moves focus away from the API to the business domain model

## API-driven Architecture (ADA)

An API-Driven Architecture focuses on the request/response (usually HTTP, RPC or pubsub msg) and the side-effect it wants to achieve.

The ADA is characterized by a lack of abstractions and a strong focus on the communication protocol. It uses plain SQL or NoSQL calls and makes no or little attempt to capture domain entities and their relationships within application code.

These backend services are usually smallen and adopt microframeworks (e.g. [Sinatra](http://www.sinatrarb.com/), [Flask](http://flask.pocoo.org/) or [Express.js](https://expressjs.com/)) or no framework at all.

**Strong points:**

- Focus on the API and protocol fundamentals
- The flow through the application is simpler with less moving parts making (i.e. less magic involved)
-

**Weak points:**

- Difficult to enforce business logic in the entire application
- More code duplication and boilerplate, particularly in large codebases
- The domain model is often unclear from code alone (particularly in a dynamically typed languages), one has to look at the database schema or documentation

## When to prefer API-Driven Architectures

#### Limited state

Small API services (microservices in particular) tend to separate their requests into multiple resources and require little state from the database or third-party services to process a single request. For example `GET /users/{id}` might return the user and the `group_id`'s a user belongs to, but not the entire group object graph.

#### When there is a strong API-focus

For me the usual order of priority when building a backend API server is (1) **API** (most important), (2) **side-effects**, (3) **API/integration tests** and (4) **code** (least important). The reason for this order has to do with changeability:

1. Changing **code** is usually fairly easy when (functional) automated testing is in place.
2. **API/integrations tests** allow you to change with confidence the service's behaviour remains backwards compatible.
3. Changing **side-effects** is difficult and painful, requiring migration scripts to be run on production systems and lots of testing.
4. Changing **API**'s' is by far the most painful because all clients depending on that contract will need to change too, often during a (long) migration period if the app is already in production.

Domain-Driven Architectures tend to focus the application design on the domain model (e.g. [DDD](https://en.wikipedia.org/wiki/Domain-driven_design)) thus focus on a model layer within the application code rather than the data store or the API.

#### Limit complexity

Domain-Driven Architectures introduce a third model that you have to reason about. Assume a webshop receives a request `POST /orders { ... }` and persists this order to a database. In a domain context you'd consider the following models:

1. **REQ**: the request object (JSON/XML/...) that is being received.
2. **DB**: the order is stored in the database, decreasing stock levels and such.
3. **DOM**: captures relationships between domain object (for example, between a `User` and the `Order`) in the application code.

Now the developer is faced with the challenge to translate **REQ** to **DOM** to **DB**... and back again. Commonly "controllers" are used to direct this process. How best to develop controllers has always been a tricky issue evidenced by the numerous discussions on '[Fat](http://blog.joncairns.com/2013/04/fat-model-skinny-controller-is-a-load-of-rubbish/) [models](https://stackoverflow.com/questions/14044681/fat-models-and-skinny-controllers-sounds-like-creating-god-models) [and](https://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc) [skinny](http://robdvr.com/fat-models-skinny-controllers-skinny-models-skinny-controllers/) [controllers](http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model)'.

A third model makes it less clear where code responsibilities lie. Some examples:

- Input validation can be part of **REQ** or enforced centrally in **DOM**
- An email being unique can only be truly guaranteed by **DB** whereas you might expect such logic in **DOM**
- For one request you know immediately upon receiving **REQ** the client is not authorized, whereas for another request domain objects must be retrieved to establish authorization, a responsibility of **APP**.

Despite the introduction of a third model you will find a lot of shared code does not fit well anywhere and ends up in separate internal services.

A software design with just **REQ** and **DB** is more straightforward, in essence becoming a set of procedural scripts referred to as request handlers where each handles one type of request.

#### Testability

While working on API-driven Architectures I noticed writing fewer unit tests and more API and integration tests compared to DDA's; to the point where I write hardly any unit tests for a basic backend CRUD API.

API/integration tests provide a lot more confidence that the backend application is actually behaving correctly, has better code coverage and are easier to write. This I could do because of two reasons:

1. ADA's are fairly simple to debug, there are few interacting code-paths that may fail in some unexpected way
2. I switched to languages and tools that make running and developing such tests very fast

In contrast, DDA's have more shared pieces of interacting code (e.g. services and models) which require the developer to treat them as an internal API that must remain fairly stable. Hence the need to add unit tests and mock for those.

## Why keep using Domain-Driven Architectures

#### Good framework support

There are plenty of frameworks supporting the domain-driven design with which developers are familiar. Prevalent languages in business software (Java and C#) have ecosystems that have evolved to accommodate the domain-driven architecture extremely well.

Using an opinionated framework allows you to get quicker onboard and not waste time on blogs and stackoverflow figuring out how to design stuff.

#### When focus is on the business logic

Most business software is written with models in the vocabularly of functional analysts. These models and vocabularly are not Request-Response but rather Domain-centric. Functional analysts will discuss business constraints and logic; the home of the domain layer in an application. They have little knowledge of REST, RPC or messaging contracts.

#### When output cannot be broken down into small requests

Many backend servers produce server-side rendered HTML which changes the context completely; any homepage will have multiple subcomponents which require state from different domain contexts. Loading this state into memory with all relationships efficiently is a difficult programming challenge; the reason why we adopted MVC and component-based frameworks in the first place.

When executing requests that stretch multiple domain contexts within a single application a domain-driven design usually works really well.

#### When building a monolith

DDA's are a complex solution to solve an even more complex problem; large enterprise backend apps ten to grow beyond 100k lines of code which must all work together. It is only natural to try and establish some law and order in such an application, the domain model layer is ideal for that.

For a long time it was too cumbersome and complex to split such an application into smaller applications and deploy, test and operate them together. If you find microservices too complex (which is completely reasonable) the domain-focus remains a good solution to keep your monolith from becoming a big ball of mud.
