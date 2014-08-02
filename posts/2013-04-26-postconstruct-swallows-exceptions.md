# @PostConstruct Swallows Exceptions; Catch and Log Them Instead

While troubleshooting a non-working web service that was deployed on WebLogic 10.3.6. no error was showing up in the logs. This webservice was implemented using an in-only message exchange pattern (e.g. fire & forget) so I didn't have a response message I could verify neither.

After a more careful look in the logs I noticed the logging completely stopped after the web service invoked a specific EJB. Unable to debug any further I changed the in-only MEP to an in-out MEP (request & response) and noticed the following error in the response message:

	ExceptionEJB Exception: com.oracle.pitchfork.interfaces.LifecycleCallbackException: Failure to invoke private void ... on bean class  ... with args: []

As it turns out the @PostConstruct in one of those EJB's was not working properly. It threw an exception.

If an exception thrown while executing @PostConstruct it swallowed by WebLogic. A quick search showed I am not [the](http://stackoverflow.com/questions/13140344/startup-singleton-postconstruct-giving-a-runtimeexception-could-not-invoke-p) [only](http://stackoverflow.com/questions/8740234/postconstruct-checked-exceptions) [one](http://www.eclipse.org/forums/index.php/mv/msg/389635/929236/) having this problem and similar behavior is observed in JBoss and GlassFish as well.

As a solution I wrapped the initialization code of the @PostConstruct in a try-catch block, logging any exception that occurs and rethrow the exception. Because I don't know what type of throwable I'm catching and the exception is lost anyway I rethrow the original exception wrapped in a `RuntimeException`; Checked exceptions are not allowed in methods annotated with @PostConstruct.

Example:

    @Stateless
    public class MyEJB implements MyEJBLocal {

        private static final Logger LOGGER = LoggerFactory.getLogger(MyEJB.class);

        @PostConstruct
        private void init() {
            try {
                // -- do stuff
            } catch (Throwable e) {
                LOGGER.error("Error occurred during initialization of MyEJB", e);
                throw new RuntimeException(e);
            }
        }
    }

Can't say I like it but it does the job.
