# TDD is Dead. Or is it?

There has been some debate going on about whether Test Driven Development is dead (or dieing):

- http://david.heinemeierhansson.com/2014/tdd-is-dead-long-live-testing.html
- http://rubylove.io/2014/04/24/TDD-isnt-dead-because-DHH-cant-do-it/

Here's my two cents.

I'm a big fan of TDD. The first properly developed (PHP) software project I encountered was in 2005 or 2006 and it was also the first project I discovered that had unit tests. I remember thinking; "Unit tests, what are those?"

That might be a bizarre question these days, but at the time I hadn't got the faintest idea what their use might be. Why take the effort to test behavior that you can simply verify hitting F5 in a browser? The reasons I thought this were 1) most of the projects I had done were small one-man projects, 2) I had never worked with proper QA, 3) PHP is extremely quick to deploy and run, and 4) I had yet to learn that software left untouched will start to smell and rott.

### TDD Adoption Phases

Going from appreciating unit testing to actually using tests to drive your application development turned out to be quite a personal challenge. I went through a couple of "phases":

1. **Learning to test**: unfamilair with unit testing libraries, mocking, stubbing, spies, whitebox testing and all that, this is where you adopt the necessary skills to write a concise unit test independent of its context. 

2. **Test after code**: tests are written only after the code is written. The primary goal is to get a satisfactory level of test coverage. You start to appreciate how these tests cause code refactoring to happen and improve your code quality.

3. **Test in parallel**: appreciating the idea of how tests can drive your development you try to write tests before writing the code, but fail often in doing so. Particularly when you're unsure how to solve a particular problem you start writing tests parallel to your code; sometimes you change code first and sometimes test first depending on the context and complexity of the use case (and perhaps most importantly, your emotions).

4. **Test before code**: you are writing tests before coding and feel very comfortable refactoring code and tests whenever it feels right. Every code change you consider ought to break a test or -when it doesn't- will cause you to add the missing tests scenarios. Whenever you manually verify behavior it starts feeling dirty; you shouldn't need to.

Phase (1) took me a couple of months to complete, (2) took roughly 3-4 years, and (3) took almost 1.5 years before I reached the final phase (4). That in total is almost 6(!) years before I considered myself skilled in TDD. I would have gone through those phases a lot quicker if I ever worked with anyone who pushed me to pursue those skills, but generally you're appreciated more for delivering software quickly rather than for its maintainability (I have yet to come across the first IT manager who will discuss your code quality during a performance review).

While in phase (2) and (3) I still didn't write unit tests for many one-off projects (including my own hobby projects). Only when I started to use tests to drive my development I adopted TDD for many of those one-off projects simply because the additional effort to do TDD diminished the better I got at it. 

These phases are not set in stone and I still exhibit different behaviors depending on the context. For example, I now find myself going through the all these four phases -albeit a lot quicker- while learning Golang. It will definitely take me two or three months before I'll test-drive my Golang development. Starting with TDD in a new ecosystem was holding me back; learning should be fun and exciting.

### Acceptance-Test Driven Development
These days however I find myself doing much less TDD than I used to, and focus more on automating integration tests instead.

While working with Symfony 2 (a PHP framework) I adopted the view that controllers (in a classic MVC framework) are not worth unit testing; controllers are light weight and designed to glue the components together. Controllers only make sense with a context. As such Symfony 2 promotes writing functional tests rather than unit tests for controllers. Doing so I started to appreciate testing with real context and using a real rather than a mocked database; it is so much simpler and quicker.

Later I started working with real QA. All of the QA I worked with had some experience with automating tests. Having worked as a tester myself in a test team for half a year, I learned one thing: the majority of testers are very bad at automating tests. Poor configuration, massive code duplication, hard data dependencies, poor test descriptions, unclear test dependencies, even manual setup steps (!) in "automated" tests... soon the effort to maintain the integration tests will take a significant portion of their -and possibly your- time.

As a result I recently started writing integration tests myself; ahead of QA. Independently QA comes up with the test scenarios of their own and, when finished, all QA's scenarios are compared to the integration tests I wrote. Some will be missing, some already exist and others the QA will have overlooked. Overall the test quality should be better than QA left to its own devices.

This also changed how I wrote my unit tests, in fact, it limited the number of unit tests and functional tests and moved a lot of test logic to the integration tests. Similar to Acceptance Test Driven Development or Behavior Driven Development; acceptance tests become the focus of development. To my original list of four phases I would add a fifth:

* **Acceptance test before coding**: the main focus of your test-driven approach moves from unit testing to automated acceptance testing. Any unit test whose behavior is properly represented in the acceptance test is removed to limit test maintenance. Stubbing out dependencies becomes much less important, most tests will have context.

For some time I considered unit testing more important than acceptance testing (being so used to TDD); however I found QA will want to test all scenarios anyway forcing you to automate every scenario regardless of your perfect unit test coverage. These days I use very few mocks and stubs and capture most behavior in acceptance tests. I still do unit testing but much less so than I used to. In fact, the percentage of unit-test-to-code LoC ratio (usually somewhere around 2:1) has not really changed since I started swapping out more and more unit tests for acceptance tests.

I do admit this acceptance-test first approach requires a certain environment, particularly one that is very fast to deploy and run; and with fast I want all tests to be run within 60 seconds. While this might be possible in a microservice particularly container and setup-heavy deployments may be too slow to accomodate such an approach. 

So is TDD dieing? No, I definitely not, but I do think a more balanced view as to what and how to test might be more cost-effective in many use cases.