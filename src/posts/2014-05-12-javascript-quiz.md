# Javascript Quiz
Do you know JavaScript well? This small JavaScript quiz is designed to challenge your knowledge of the more intricate details of JavaScript.

All questions are multiple choice and often have **multiple correct answers**. If you select all the correct answers you get 1 point for that question. If at least one answer is incorrect you get 0 points for the entire question.

You can assume all JavaScript code snippets are syntactically correct and are executed in global scope.

### Question 1
Consider the following code snippet:

	function foo() {
		console.log('Global foo');
	}

	function bar() {
		console.log('Global bar');
	}

	function container() {
		foo(); // X
		bar(); // Y

		function foo() {
		   	console.log('Local foo');
		}

		var bar = function bar() {
			console.log('Local bar');
		};
	}

Which of the following are correct?

	A) X prints "Global foo"
	B) X prints "Local foo"
	C) X throws a TypeError "foo is not a function"
	D) Y prints "Global bar"
	E) Y prints "Local bar"
	F) Y throws a TypeError "bar is not a function"

### Question 2
Consider the following code snippet:

	'use strict';

	function Person() {
		this.firstName = 'John';
	}

	var person1 = new Person();
	console.log(person1.firstName); // W

	var person2 = Person(); // X
	console.log(typeof person2); // Y
	console.log(firstName); // Z

Which of the following are correct?

	A) W prints "John"
	B) W prints "undefined"
	C) X throws a TypeError
	D) Y prints "object"
	E) Y prints "undefined"
	F) Z prints "John"

### Question 3
Consider the following code snippet:

	var s1 = new String('S2');
	s1.foo = 'S1 foo';
	console.log(s1.foo); // X

	var s2 = 'S2';
	s2.foo = 'S2 foo'; // Y
	console.log(s2.foo); // Z

Which of the following are correct?

	A) X prints "S1 foo"
	B) X prints "undefined"
	C) Z prints "S2"
	D) Z prints "S2 foo"
	E) Z prints "undefined"
	F) An error is thrown

### Question 4
Consider the following code snippet:

	var Person = function(name) {
		this.name = name;
		this.sayName = function() {
			return this.name;
		};
		return this; // X
	};

	function Person2(name) {
		this.name = name;
	};

	Person2.prototype.sayName = function() {
		return this.name;
	};

	var john = new Person('John');
	var frank = new Person('Frank');
	console.log(john.sayName() + frank.sayName()); // Y

	var jeff = new Person2('Jeff');
	var albert = new Person2('Albert');
	console.log(jeff.sayName() + albert.sayName()); // Z

Which of the following are correct?

	A) Using 'Person' is more memory-efficient compared to using 'Person2'.
	B) Using 'Person' is less memory-efficient compared to using 'Person2'.
	C) Memory-wise it does not matter if you use 'Person' or 'Person2'.
	D) By removing line X the behavior of this code snippet is changed.
	E) Y prints "Frank Frank"
	F) Z prints "Albert Albert"

### Question 5
Consider the following code snippet:

	var hello = function () {
	    console.log("Hello");
 	    hello = function () {
 	        console.log("World");
 	    }
	}

	hello.property = "New property";

	var newHello = hello;
	newHello(); // Prints "Hello"
	newHello(); // X

	hello(); // Y
	console.log(hello.property); // Z

Which of the following are correct?

	A) X prints "Hello"
	B) X prints "World"
	C) Y prints "Hello"
	D) Y prints "World"
	E) Z prints "New property"
	F) Z prints "Undefined"

### Question 6
Consider the following code snippet:

	'use strict';

	var person = {}
    person.name = 'Frank';
    person.sayName = function () {
        console.log(this.name);
    }

    var cb = function (callback) {
        if (typeof callback === 'function') {
            callback();
        } else {
            console.log('Callback is not a function')
        }
    }

    cb(person.sayName); // X

    person.name = 'John';

    cb(person.sayName); // Y

Which of the following are correct?

	A) X prints "Frank"
	B) X prints "Undefined"
	C) X prints "Callback is not a function"
	D) Y prints "John"
	E) Y prints "Undefined"
	F) Y prints "Callback is not a function"
	G) An error is thrown.

### Question 7
Consider the following code snippet:

	var result = NaN;
	console.log('Result: ' + (result) ? 'true' : 'false'); // X
	console.log('Result: ' + ((result) ? 'true' : 'false')); // Y

Which of the following are correct?

	A) X prints "Result: true"
	B) X prints "Result: false"
	C) X prints "true"
	D) X prints "false"
	E) Y prints "Result: true"
	F) Y prints "Result: false"

### Question 8
Consider the following code snippet:

    function Parser(text, postfix) {
        this.text = text;
        this.postfix = postfix;
    }

    Parser.prototype.parse = function () {
        var lines = this.text.split(/\n/);
        return lines.map(function (line) {
            return line.trim() + this.postfix;
        }); // X
    };

    var myParser = new Parser(' 1 \n2 \n 3\t  \n 4', 'a');
    var result = myParser.parse();
    console.log(result); // Y

Which of the following are correct?

	A) Y prints "[ '1a', '2a', '3a', '4a' ]"
	B) Y prints " 1 \n2 \n 3\t  \n 4a"
	C) Y prints "[ '1a', '2\ta', '3a', '4a' ]"
	D) Y prints "[ '1undefined', '2undefined', '3undefined', '4undefined' ]"
	E) X throws a TypeError

### Question 9
Assume using ECMAScript 6, consider the following code snippet:

	function User(name) {
        this.name = name
    }

    User.prototype.sayName = function () {
        console.log('Hi, my name is ' + this.name);
    };

    User.sayName = function () {
        console.log('I am ' + this.name);
    };

    User.sayName(); // X
    User.prototype.sayName(); // Y

Which of the following are correct?

	A) X prints "I am Frank"
	B) X prints "I am User"
	C) X prints "I am undefined"
	D) Y prints "Hi, my name is Frank"
	E) Y prints "Hi, my name is User"
	F) Y prints "Hi, my name is undefined"
	G) Y throws a TypeError

# Answers

1. B and F are correct. B is correct because the global `foo()` declaration is overridden by a local `foo()` declaration and function hoisting ensures the local `foo()` is already callable within `container()` before it has been declared. F is correct because the function expression `var bar = function()` within `container()` overrides the global `bar()` declaration but because it is a function *expression*, not a function *declaration*, the local `bar()` definition is not hoisted. [Subject: Function hoisting]
2. A and C are correct. A is a correct because `person1` is initialized with `new` and is a valid object. C is correct because `person2` is not initialized with `new` and due to `'use strict'` the variable `this` is `undefined`. If `'use strict'` was ommitted the answers A, D and F would be correct. [Subject: Constructors + strict mode]
3. A and E are correct. A is correct because setting a property on a String object is allowed (altough considered bad practice). E is correct because when setting a property on a primitive it is autoboxed to its primitive wrapper and unboxed back to a primitive immediately afterwards. Due to the unboxing the new property is lost. [Subject: primitives]
4. B is correct. B is correct because for each time `Person` is instantiated a new object is created in memory while for `Person2` the `sayName()` method can be reused for all instances. D is incorrect because if `this` is not returned it is returned implicitly.
5. A, D and F are correct. A is correct because every time `newHello()` is called it overwrites the global `hello` definition but `newHello` itself keeps pointing to the old definition thus printing "Hello" every time. D and F are correct because when `hello()` is called it has already been redefined by using `newHello()`, overwriting any old properties that may have been assigned. [Subject: lazy initialization]
6. G is correct. G is correct because `person.sayName` references `this` and when `person.sayName` is used as a callback `this` no longer references the inner scope of `person`. In non-strict mode `this` would fallback to the global scope and in strict mode `this` is undefined causing a TypeError. If `'use strict'` were not set B and E would be correct. [Subject: strict mode + callbacks]
7. C and F are correct. C is correct because expressions are evaluated from left-to-right, line X should be read as `console.log(('Result: ' + (result)) ? 'true' : 'false');`. F is correct because `NaN` is evaluated as `false`. [Subject: expressions]
8. D is correct. D is correct because `this` within `function (line)` resolves to the local function scope which has no `this.postfix` defined. To make this code work `this` should be added as a second argument to the `map` function: `lines.map(function (line) { return line.trim() + this.postfix }, this)`.
9. B and F are correct. B is correct because `User.sayName()` is a static method and `this.name` in ECMAScript 6 defaults to the function's name. F is correct because `User.prototype.sayName()` invokes an instance method without any properties.
