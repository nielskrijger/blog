---
title: Some JAVA Strangeness
description: Some JAVA Strangeness
date: 2012-11-04
permalink: /posts/2012-11-04/some-java-peculiarities/index.html
tags:
  - Java
layout: layouts/post.njk
---

Currently I'm sharpening my Java skills for the OCP Java Programmer SE 6 exam (formarly SCJP) and as it turned out preparing for this exam turned out to be a lot of fun!

I wrote some code examples to show some of the peculiarities of Java that made me raise my eyebrows.

### Integer wrapper caching

```java
public class A
{
    public static void main(String[] args)
    {
        checkSimilarityInteger(127);
        System.out.println("------");
        checkSimilarityInteger(128);
    }

    public static void checkSimilarityInteger(int i)
    {
        Integer i1 = i;
        Integer i2 = i;
        if (i1 == i2) {
            System.out.println("Integer "+i+" == Integer "+i);
        } else {
            System.out.println("Integer "+i+" != Integer "+i);
        }
        if (i1.equals(i2)) {
            System.out.println("Integer "+i+" equals Integer "+i);
        } else {
            System.out.println("Integer "+i+" does NOT equal Integer "+i);
        }
    }
}
```

Output:

```text
Integer 127 == Integer 127
Integer 127 equals Integer 127
------
Integer 128 != Integer 128
Integer 128 equals Integer 128
```

_Why_: Integers from -128 to 127 are cached so return the same object every time.

### Pass by reference?

```java
public class A
{
    public static void main(String[] args)
    {
        Object x = null;
        populateString(x);
        System.out.println(x);
    }

    static void populateString(Object x2)
    {
        x2 = "This is a string";
    }
}
```

Output:

```text
null
```

_Why_:

One thing that I found surprising is `System.out.print(ln)` simply prints `null` for null references. One thing that might not surprise you, but perhaps should, is `x` has not been assigned the string `This is a string` because java does not pass by reference. I remember my Java teacher stressing this point a long time ago but I've never appreciated it really until now.

### Null array reference and evaluation

```java
public class A
{
    public static void main(String[] args)
    {
        int i = 1;
        try {
            getArray()[i = 2]++;
        } catch (Exception e) {
        }
        System.out.println("i = " + i);

        int j = 1;
        try {
            getDoubleArray()[getIntAndFail()][j = 2]++;
        } catch (Exception e) {
        }
        System.out.println("j = " + j);
    }

    public static int[] getArray()
    {
        return null;
    }

    public static int[][] getDoubleArray()
    {
        return null;
    }

    public static int getIntAndFail() throws Exception
    {
        if (true) throw new Exception("I failed");
        return 0;
    }
}
```

Output:

```text
i = 2
j = 1
```

_Why_:

In the first part of `main()` the `getArray()` causes a `NullPointerException`. This `NullPointerException` will not be detected until after the other operations within the array reference are evaluated. Hence, the assignment `i = 2` will be completed before the `NullPointerException` is thrown.

In the second part of `main()` the `getDoubleArray()` also causes a `NullPointerException` but before the assignment `i = 2` is evaluated another `Exception` is thrown. This `Exception` does halt the whole evaluation immediately and prevents `i = 2` from being evaluated.

### Null array reference and evaluation

```java
"String".replace('g','g') == new String("String").replace('g','g')
"String".replace('g','G') == "StrinG"
"String".replace('g','g') == "String"
```

Output:

```text
false
false
true
```

_Why_:

Java Strings are cached locally within a lookup table (= interning). All strings created in the language syntax "String" are automatically interned, whereas new String("String") are not.

`.replace(...)` returns a new String object (in fact it has to; strings are immutable).

But if `.replace(...)` always returns a new String object then why don't all three statements return `false`?

When `replace(...)` doesn't have to do anything it returns the original object rather than creating a new one which is why the last statement returns `true`.

Puzzling.
