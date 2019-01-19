---
title: Is TDD Dead?
description: Is TDD Dead?
date: 2014-04-27
tags:
  - Testing
layout: layouts/post.njk
---

There has been some debate going on about whether Test Driven Development is dead (or dieing):

- http://david.heinemeierhansson.com/2014/tdd-is-dead-long-live-testing.html
- http://rubylove.io/2014/04/24/TDD-isnt-dead-because-DHH-cant-do-it/

Here's my two cents.

I'm a big fan of TDD. The first properly developed (PHP) software project I encountered was in 2005 or 2006 and it was also the first project I discovered that had unit tests.

At the time I hadn't got the faintest idea what their use might be. Why take the effort to test behavior that you can simply verify hitting F5 in a browser? The reasons I thought this were

1. most of the projects I had done were small one-man projects
2. I had never worked with proper QA
3. PHP is extremely quick to deploy and run, and
4. I had yet to learn that software left untouched will start to smell and rot.

### TDD learning phases

Going from appreciating unit testing to actually using tests to drive your application development turned out to be quite a personal challenge that took me several years. I went through a couple of "phases":

1. **Learning to test**: unfamiliar with unit testing libraries, mocking, stubbing, spies, whitebox testing and all that, this is where you learn the necessary skills for automated testing.
2. **Test after code**: tests are written only after the code is written. The primary goal is to get a satisfactory level of test coverage. You start to appreciate how these tests cause code refactoring to happen and improve your code quality.
3. **Testing in parallel**: appreciating the idea of how tests can drive your development you try to write tests before writing the code, but fail often in doing so. Particularly when you're unsure how to solve a particular problem you start writing tests parallel to your code; sometimes you change code first and sometimes test first depending on the context and complexity of the use case (and perhaps most importantly, your emotions).
4. **Test before code**: you are writing tests before coding and feel very comfortable refactoring code and tests whenever it feels right. Every code change you consider ought to break a test or -when it doesn't- will cause you to add the missing tests scenarios. Whenever you manually verify behavior it starts feeling dirty; you shouldn't need to.

Phase (1) took me a couple of months when I first started coding, (2) took roughly 2-3 years, (3) took almost 1.5 years until I reached phase (4). So in total it took almost 5(!) years before I found myself doing TDD for most of my development work.

### Acceptance-Test Driven Development

More recently I find myself doing less TDD and focusing more on automating functional/API tests instead.

While working with Symfony 2 (a PHP framework) I adopted the view that controllers (in a classic MVC framework) are not worth unit testing; controllers are light weight and designed to glue the components together. As such Symfony 2 promotes writing functional tests rather than unit tests for controllers. Doing so I started to appreciate testing with real context and using a real rather than a mocked database; I found it to be a better predictor whether my software would actually work.

Another reason I started focussing more on functional tests is that many testers are very bad at automating tests. Poor configuration, code duplication, hard data dependencies, poor test descriptions, unclear test dependencies, even manual setup steps (!) in "automated" tests. Soon the effort to maintain their automated tests will take a significant portion of their -and possibly your- time.

Considering the four phases discussed earlier, I might add a fifth:

- **Functional test before coding**: the main focus of your test-driven approach moves from unit testing to automated functional testing. Any unit test whose behavior is properly represented in the functional test is removed to limit test maintenance. Stubbing out dependencies becomes less important.

In essence I have come to favour [ATDD](https://en.wikipedia.org/wiki/Acceptance_test%E2%80%93driven_development) over TDD.

I do admit this acceptance-test first approach requires a certain environment, particularly one that is very fast to deploy and run; and with fast I mean all test cases having run within 10 seconds or so.

So does this mean TDD dieing for me as well? No; when building a library, algorithm or utility I'll still employ TDD. But in practice for a lot of software I've come to favour ATDD instead of (not in addition to) TDD.
