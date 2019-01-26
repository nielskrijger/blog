---
title: API vs Domain-Driven Architecture
description: API vs Domain-Driven Architecture
date: 2017-06-05
permalink: /posts/2017-06-05/api-vs-domain-driven-architectures/index.html
tags:
  - API
  - Architecture
layout: layouts/post.njk
---

I tend to categorize backend architectures into two types:

1. Domain-Driven Architecture
2. API-Driven Architecture

While these types are by no means exclusive, and in fact can be complimentary, in practice most backend systems I've seen tend to favour one style over other.

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

## API-Driven Architecture (ADA)

An API-Driven Architecture focuses on the request/response (usually HTTP, RPC or pubsub messages).

The ADA is characterized by a lack of abstractions and a stronger focus on the communication protocol. It uses plain SQL or NoSQL calls and makes no or little attempt to capture domain entities and their relationships within application code.

These backend services are usually smallen and adopt microframeworks (e.g. [Sinatra](http://www.sinatrarb.com/), [Flask](http://flask.pocoo.org/) or [Express.js](https://expressjs.com/)) or no framework at all.

**Strong points:**

- Focus on the API and protocol fundamentals
- The flow through the application is simpler with less moving parts (i.e. less magic involved)

**Weak points:**

- Difficult to enforce business logic in the entire application
- Usually more code duplication and boilerplate
- The domain entities are often unclear from code alone; particularly in a dynamically typed language you have to look at the database schema or documentation

## When to prefer API-Driven Architectures

#### Limited entangled state

Most API backends these days separate their requests into multiple resources and require little state from the database or third-party services to process a single request. For example `GET /users/{id}` might return the user and the `group_id`'s a user belongs to, but not the entire object graph.

#### If there is a strong focus on the API

For me the usual order of priority when building a backend API server is (1) **API**, (2) **side-effects**, (3) **API/integration tests** and (4) **code** (least important). The reason for this order has to do with changeability:

1. Changing **API**s is by far the most painful because all clients depending on that contract will need to change too, often during a (long) migration period if the app is already in production. Usually you're stuck with organizational constraints and slow third parties to update their clients.
2. Changing **side-effects** is difficult and painful, requiring migration scripts to be run on production systems and lots of testing. Compared to API's though you often have full control.
3. **API/integrations tests** allows you to change with confidence the service's behaviour. Unit tests tend to be too brittle when doing structural refactoring.
4. Changing **code** is usually fairly easy when automated testing is in place. Even if the code smells really bad you can still clean it up with confidence if the other points are taken care of.

#### Limit code complexity

Domain-Driven Architectures introduce a third model that you have to reason about. Assume a webshop receives a request `POST /orders { ... }` and persists this order to a database. In a domain context you'd consider the following models:

1. **API**: the request object (JSON/XML/...) that is being received.
2. **DB**: the order is stored in the database, decreasing stock levels and such.
3. **DOMAIN**: captures relationships between domain object (for example, between a `User` and the `Order`) in the application code.

Now the developer must translate **API** → **DOMAIN** → **DB** and back again. Commonly "controllers" are used to direct this process. How best to develop controllers has always been a tricky issue evidenced by the numerous discussions on '[Fat](http://blog.joncairns.com/2013/04/fat-model-skinny-controller-is-a-load-of-rubbish/) [models](https://stackoverflow.com/questions/14044681/fat-models-and-skinny-controllers-sounds-like-creating-god-models) [and](https://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc) [skinny](http://robdvr.com/fat-models-skinny-controllers-skinny-models-skinny-controllers/) [controllers](http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model)'.

A third model makes it less clear where code responsibilities lie. Some examples:

- Input validation can be part of **API** or enforced centrally in **DOMAIN**
- An email being unique can only be truly guaranteed by **DB** whereas you might expect such logic in **DOMAIN**
- For one request you know immediately upon receiving **API** the client is not authorized, whereas for another request domain objects must be retrieved first to establish authorization, a responsibility of **APP**.

Even despite the introduction of a third model you will find a lot of shared code does not fit well in either of these which ends up in separate internal services.

A software design with just **API** and **DB** is more straightforward, in essence becoming a set of procedural scripts (request handlers) where each scripts processes only one type of request.

#### Testability

While working on API-Driven Architectures I noticed writing fewer unit tests and more API / integration tests compared to DDA's; to the point where I write hardly any unit tests for a basic backend CRUD API.

API/integration tests provide a lot more confidence that the backend application is actually behaving correctly, has better code coverage and are easier to write. This I could do because of two reasons:

1. ADA's are fairly simple to debug, there are few interacting code-paths that may fail in some unexpected way
2. I switched to languages and tools that make running and developing such tests very fast

In contrast, DDA's have more shared pieces of interacting code (structured in services and layers) which require the developer to treat them more as an internal API. In that case unit tests and mocks enable you to better gradually build up your system.

## When to prefer Domain-Driven Architectures

#### Good framework support

There are plenty of frameworks supporting the domain-driven design with which developers are usually familiar. Prevalent languages in business software (Java and C#) have ecosystems that have evolved to accommodate the domain-driven architecture extremely well.

Using an full-featured opinionated framework allows you to onboard quicker and not waste time on blogs and stackoverflow figuring out how to design stuff.

#### When focus is on the business logic

Most business software is written with models in the vocabularly of functional analysts. These models and vocabularly are not API but rather Domain-centric. Functional analysts will discuss business constraints and logic; the home of the domain layer in an application. Even many enterprise and solution architects have little knowledge of REST, RPC or messaging contracts but rather tend to focus on the domain and system behaviour primarily; not the API.

#### When output cannot be broken down into small requests

Many backend servers produce server-side rendered HTML which changes the context completely; any homepage will have multiple subcomponents which require state from different domain contexts. Loading this state into memory with all relationships efficiently is a difficult programming challenge; the reason why we adopted MVC and component-based frameworks in the first place.

When executing requests that stretch multiple domain contexts within a single application a domain-driven design usually works really well.

#### When building a monolith

DDA's are a complex solution to solve an even more complex problem; large enterprise backend apps ten to grow beyond 100k lines of code which must all work together. It is only natural to try and establish some law and order in such an application, the domain model layer is ideal for that.

For a long time it was too cumbersome and complex to split such an application into smaller applications and deploy, test and operate them together. If you find microservices too complex (which is completely reasonable) the domain-focus remains a good solution to keep your monolith from becoming a big ball of mud.
