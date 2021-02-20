---
title: API vs Domain-Centric Systems
description: API vs Domain-Centric Systems
date: 2017-06-05
permalink: /posts/2017-06-05/api-vs-domain-centric-architectures/index.html
tags:
  - API
  - Architecture
layout: layouts/post.njk
---

I tend to categorize backend software into two broad categories:

1. Domain-Centric Systems
2. API-Centric Systems

While these styles are by no means exclusive, and in fact can be complimentary, in practice most backend systems tend to favour one style over the other.

## Domain-Centric Systems

A Domain-Centric System models the business environment within the application in a business or domain layer. This layer contains type-based objects such as a "User" with methods to mutate their state and enforce business logic. Typically after all business logic has been resolved the mutated state is persisted using an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) or [ODM](https://stackoverflow.com/questions/12261866/what-is-the-difference-between-an-orm-and-an-odm) implementing a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html).

Characteristic of these types of systems is the external API is a second-class citizen in the overall design. Sometimes the API is generated from the domain model itself or just a very thin layer on top of the domain.

Domain-Driven Design is a popular pattern language which has become the template of modern domain-centric development. If you search through [the DDD book](http://dddcommunity.org/book/evans_2003/) you'll have a difficult time finding any mention of "API". The core of DDD is modelling the business domain within a monolithic application.

This domain-centric development is prevalent in Java and C#, and most other programming languages offer frameworks supporting such an architecture. Many [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)-type frameworks fall into this category.

**Strong points:**

- Domain objects and their relationship are clearly defined in code.
- Multiple mutations can easily be combined into a single transaction.
- Complex business logic can be centrally enforced.

**Weak points:**

- A heavy-weight ORM/ODM abstracts away data mutation logic, making it difficult to debug or predict.
- Potential side-effects are hard to predict when mutating a shared core with both domain properties and business logic.
- Moves focus away from the API to the business domain model.

## API-Centric Systems

An API-Centric System focuses on the request/response (usually HTTP, RPC or pubsub messages).

These systems are characterized by a lack of abstractions and have a strong focus on the communication protocol. They often use plain SQL or NoSQL calls and make little attempt to capture domain entities and their relationships within the application code.

These backend systems are usually smaller and adopt microframeworks (e.g. [Sinatra](http://www.sinatrarb.com/), [Flask](http://flask.pocoo.org/) or [Express.js](https://expressjs.com/)) or no framework at all.

**Strong points:**

- Focus on the API and protocol fundamentals.
- The flow through the application is simpler with less moving parts.
- Well-suited for small applications (e.g. microservices).

**Weak points:**

- Difficult to enforce business logic in the entire application.
- Usually more code duplication and boilerplate.
- The domain entities are often unclear from code alone; particularly in a dynamically typed language you have to look at the database schema or documentation.

## When to prefer API-Centric Systems?

#### When the API is important

As a rough rule of thumb the order of priority I use when building a backend API server is (1) **API**, (2) **side-effects**, (3) **API/integration tests** and (4) **code** (least important). The reason for this order has to do with changeability:

1. Changing **API**s is by far the most painful because all clients depending on that contract will need to change too, often during a (long) migration period if the app is already in production. Usually you're stuck with organizational constraints and slow third parties to update their clients to use the new API.
2. Changing **side-effects** is difficult and painful, requiring migration scripts to be run on production systems and lots of testing. Compared to API's though you often have full control.
3. **API/integrations tests** allows you to change with confidence the service's behaviour. Unit tests tend to be too brittle when doing structural refactoring.
4. Changing **code** is usually fairly easy when automated testing is in place. Even if the code smells badly you can still clean it if the other points are taken care of.

#### When your backend service is developed within a single team

API-Centric development works best in smaller systems. Domain-centric development pays off when a single system grows sufficiently large and involves multiple teams at which point communication issues become more prominent.

Crafting the domain model properly is a significant effort requiring a lot of thought. Assume a webshop receives a `POST /orders { ... }`-request and persists this order to a database. In a domain context you'd consider the following models:

1. **API**: the request object (JSON/XML/...) that is being received.
2. **DB**: the order is stored in the database, decreasing stock levels and such.
3. **DOMAIN**: captures relationships between domain object (for example, between a `User` and the `Order`) in the application code.

Now the developer must translate **API** → **DOMAIN** → **DB** and back again. Commonly controllers are used to direct this process. How best to develop controllers has always been a tricky issue evidenced by the numerous discussions on [fat](http://blog.joncairns.com/2013/04/fat-model-skinny-controller-is-a-load-of-rubbish/) [models](https://stackoverflow.com/questions/14044681/fat-models-and-skinny-controllers-sounds-like-creating-god-models) [and](https://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc) [skinny](http://robdvr.com/fat-models-skinny-controllers-skinny-models-skinny-controllers/) [controllers](http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model). In practice I've never seen anyone pull that off in a large codebase. On top of that a lot of shared code doesn't fit well nicely in either of those three layers and ends up in separate services.

Getting your Domain-Centric software "right" is a tough challenge, requiring significant skill in abstract problem solving, discipline, communication and refactoring. A positive return on all that effort only occurs in systems with multiple development teams working on the same system.

A software design with just an **API** and **DB** is more straightforward, in essence becoming a set of procedural scripts (request handlers) where each script processes only one type of request.

#### When you prefer system/integration tests over unit tests

While working on API-Centric System I started writing fewer unit tests and more API / integration tests compared to Domain-Centric systems; to the point where I hardly write any unit tests for a basic backend CRUD API.

API/integration tests provide a lot more confidence that the backend application is actually behaving correctly, has better code coverage and are easier to write. This I could do because of two reasons:

1. API-Centric systems are fairly simple to debug, there are few interacting code-paths that could fail
2. I switched to languages and toolsets that make running and developing such tests very fast

In contrast, Domain-Driven systems have more shared pieces of interacting code (structured in services and layers) which require the developer to treat them more as an internal API. In that case unit tests and mocks enable you to better gradually build up your system.

## When to prefer Domain-Centric Systems?

#### When your team/organization uses DDD-inspired frameworks

There are plenty of frameworks supporting the domain-driven design with which developers are already familiar. C# and Java in particular have ecosystems that have evolved to accommodate the domain-driven architecture well.

Investing in a new (more basic) tech-stack may not be worthwhile if all developers feel more comfortable with one of those frameworks.

#### When focus is on the business logic

Most business software is designed with the help of functional analysts. Their vocabularly and designs are not API but Domain-centric. Functional analysts will discuss business constraints and logic; the home of the domain layer in an application. Even many enterprise and solution architects have little knowledge of REST, RPC or messaging contracts but rather tend to focus on the domain and system behaviour primarily instead of the API. This makes sense in a single large application where API clients are few or non-existent.

#### When output cannot be broken down into small requests

Many backend servers produce server-side rendered HTML which changes the context completely; any homepage will have multiple subcomponents which require state from different domain contexts. Loading this state into memory with all relationships efficiently is a difficult programming challenge; the reason why we adopted MVC and component-based frameworks in the first place.

When executing requests that stretch multiple domain contexts within a single application a domain-driven design usually works really well.

#### When building a monolith

Domain-Driven systems are a complex solution to solve an even more complex problem; large enterprise backend apps ten to grow and all that code must work together. It is only natural to try and establish some law and order in such an application, the domain model layer is ideal for that.

For a long time it was too cumbersome and complex to split such an application into smaller applications and deploy, test and operate them together. If you find microservices too complex (which is completely reasonable) the domain-focus remains a good solution to keep your monolith from becoming a big ball of mud.
