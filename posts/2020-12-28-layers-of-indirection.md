---
title: Layers of Indirection
description: Layers of Indirection
date: 2020-12-28
permalink: /posts/2020-12-25/layers-of-indirection/index.html
tags:
- Control flow
- Python
- Layering
- Indirection
layout: layouts/post.njk
---

Recently a developer asked me what was meant with the following quote:

> All problems in computer science can be solved by another level of indirection, except for the problem of too many layers of indirection.
> 
> *David J. Wheeler*

There are many aspects to this, so I'll split this article in three sections:

1. Software layering
2. Indirection
3. Too many indirections

I'll illustrate the topics by using a Python example.

Let's assume you're implementing a  function that validates and stores a user's name and email address in a database. A basic implementation could look like this:

```python
# user.py
import database_lib
import config

def save_user(name, email):
    if name is None:
        raise Exception("Name is missing")
    if email is None:
        raise Exception("Email is missing")

    conn = database_lib.connect(config("database"))
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (c1, c2) VALUES(%s, %s)", (name, email))
    cursor.close()
    conn.close()
```

## 1. Software layering

Layering your codebase tends to become more useful when software starts to grow, so let's assume our example has undergone some changes over time. The `save_user` function now looks like this:

````python
# user.py
def save_user(name, email):
    if name is None:
        raise Exception("Name is missing")
    if email is None:
        raise Exception("Email is missing")

    conn = None
    user_id = None
    try:
        conn = database_lib.connect(config("database"))
        cur = conn.cursor()
        cur.execute("INSERT INTO users (name, email) VALUES(%s, %s)", (name, email))
        user_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
    except Exception as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()

    return user_id
  
def update_user(user_id, name, email):
  # ... very similar to save_user
  
def delete_user(user_id):
  # ... very similar to save_user
````

Code was added to fetch the generated `user_id` that the database automatically generated and the error handling was improved. On top of that the functions `update_user(user_id)` and `delete_user(user_id)` which contain a very similar sets of code. 

### Problem

Your code contains a lot of repetitive database code. Changes to database structure and logic requires updating multiple parts of the codebase which is time-consuming and error-prone.

### Solution

Concentrate all database logic in a dedicated set of files, separate from the rest of the code. These files will act as a database access layer; all communication to the database is done strictly through this software module and access to the database anywhere else is avoided.

### Example solution

After moving and cleaning up your database handling logic within a separate `user_db` module your `save_user` function now looks like this:

```python
# user.py
from db_store import insert_user

def save_user(name, email):
    if name is None:
        raise Exception("Name is missing")
    if email is None:
        raise Exception("Email is missing")

    return insert_user(name, email)
```

```python
# user_db.py
from db import query

def create_user(name, email):
    return query("INSERT INTO users (c1, c2) VALUES(%s, %s)", (name, email))
    
def update_user(user_id, name, email):
    # ...

def delete_user(user_id):
    # ...
```

### Discussion

It is not uncommon for a codebase to be completely separated in layers where each piece of code is part of a dedicated software layer. A popular high-level architecture layering model was described by [Martin Fowler](https://martinfowler.com/bliki/PresentationDomainDataLayering.html):

- Presentation Layer - anything that provides the interaction of your software system to a client/consumer. This might be generated HTML, a JSON API, RMI or any other type of external interface.
- Domain Layer - contains your business rules and logic.
- Data Layer - this contains any data mapping (ORM) and data sources (database, file system etc)

To maintain a layered architecture developers should avoid leaking responsibilities from one layer to the next. In practice this is often a point of discussion or ignored completely. Some issues might be

	1. layers are poorly defined in code and groupmind, where something belongs has become vague;
 	2. developers had to bypass a layer because the layer below it is too slow or difficult to change
 	3. developers didn't value maintaining an architecture layer for a particular system. 

Software layers are a great way to organize code but it requires vision and discipline to introduce and maintain them.

## 2. Indirection

Continuing with our `save_user`-example, at some point one of your software's customers wants to store the user data in a file rather than in a database. After you failed to convince the customer this is a really bad idea, you reluctantly implement the change.

You decide to use the config module to make the user storage configurable. Your handlercode now looks something like this:

```python
from db_store import insert_db_user, update_db_user, delete_db_user
from file_store import insert_file_user, update_file_user, delete_file_user
import config

def save_user(name, email):
    # ...
    storage = config("userStorage")
    if storage == "file":
        insert_file_user(name, email);
    elif storage == "database":
        insert_db_user(name, email)
    else:
        raise Exception("Unknown user storage")
        
def update_user(user_id, name, email):
    # ...
    storage = config("userStorage")
    if storage == "file":
        update_file_user(name, email);
    elif storage == "database":
        update_db_user(name, email)
    else:
        raise Exception("Unknown user storage")
  
def delete_user(user_id):
    # ...
    storage = config("userStorage")
    if storage == "file":
        delete_file_user(name, email);
    elif storage == "database":
        delete_db_user(name, email)
    else:
        raise Exception("Unknown user storage")
```

### Problem

Your user code is strictly coupled to concrete implementations of `*_db_user` and `*_file_user` making it difficult to 

### Solution 1: Indirect Function Calls

The function signatures of `*_db_user(...)` and `*_file_user(...)` share identical arguments which enables us to store references to those functions:

```python
from db_store import insert_db_user, update_db_user, delete_db_user
from file_store import insert_file_user, update_file_user, delete_file_user
import config

# insert/update/delete hold references to the real storage functions
insert, update, delete = None, None, None
if config("userStorage") == "file":
    insert = insert_db_user
    update = update_db_user
    delete = delete_db_user
elif config("userStorage") == "database":
    insert = insert_file_user
    update = update_file_user
    delete = delete_file_user
else:
    raise Exception("Unknown user storage")

def save_user(name, email):
    # ...
    insert(name, email);
        
def update_user(user_id, name, email):
    # ...
    update(name, email)
  
def delete_user(user_id):
    # ...
    delete(name, email)
```

Using a list of global variables like this is not particularly elegant but it does remove the repetitive if/elif/else storage checks.

This way of referencing some other function is usually referred to as "Function Pointers" because pointers are the most common form of indirection you'll see in code. Python however does not use pointers; instead we're using three variables `insert`, `update` and `delete` that refer to objects (python functions are first-class objects). In practical terms however the behaviour is similar to that of a function pointer in other programming languages.

### Solution 2: Dynamic Dispatch

This solution consists of two parts: first we ensure that our DB and File storage implementations work in the exact same way, and second we add a global variable that keeps a reference to the correct storage engine. In practice indirection and abstractions often go hand-in-hand like this.

Let's start with abstracting our storage solution; in our original solution we used different names for the same functions (`insert_db_user` vs `insert_file_user`), let's change this:

```python
# user_db.py
class UserDBStorage(UserStorageInterface):
    def create(self, name, email):
        db_query("INSERT INTO users (c1, c2) VALUES(%s, %s)", (name, email))

    def update(self, user_id, name, email):
        # ...

    def delete(self, user_id):
        # ...
```

```python
# user_file.py
class UserFileStorage:
    def create(self, name, email):
        with open("users.csv", "a") as userfile:
            userfile.write(f"{name};{email}")

    def update(self, user_id, name, email):
        # ...

    def delete(self, user_id):
        # ...
```

Now that we we've ensured both database and file storage have identical method signatures we can use a single global variable to clean up our main file:

```python
from db_store import UserDBStorage
from file_store import UserFileStorage
import config

# Setup the file or database storage
storage = None
if config("userStorage") == "file":
    storage = UserDBStorage()
elif config("userStorage") == "database":
    storage = UserFileStorage()
else:
    raise Exception("Unknown user storage")

def save_user(name, email):
    # ...
    storage.create(name, email) 

def update_user(user_id, name, email):
    # ...
    storage.update(user_id, name, email)
  
def delete_user(user_id):
    # ...
    storage.delete(user_id)
```

The main change here is the setup code for the `storage` variable. This global `storage` variable is instantiated with the configured storage engine when the file is first imported.

We use this `storage` variable to store the user rather than calling `UserDBStorage().create(name, email)` directly. This is what indirection is; we use an intermediary to do the work for us rather than calling anything directly.

**Discussion**

In our example the `handlers.py`-file still has dependencies to both `db_store` and `file_store`. These can be moved outside the module by using [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection), but DI is not a requirement for indirection but more like an enhancement thereof.

This solution is called "Dynamic" because the storage type is resolved at run-time. If the storage type is resolved at compile-time the solution is referred to as "Static dispatch". Common implementations of static dispatch are [generics](https://en.wikipedia.org/wiki/Generic_programming) and [function overloading](https://en.wikipedia.org/wiki/Function_overloading); but due to their dependency on typing information those patterns are not available in dynamically-typed languages.

Dynamic dispatch is a common pattern in object-oriented programming. The abstraction we've used here is usually enforced by explicit interfaces and/or abstract classes, in our example we could have implemented our storage contract as follows:

```python
# user_storage.py
class UserStorageInterface(ABC):
    @abstractmethod
    def create(self, name, email):
        return
      
		@abstractmethod
    def update(self, user_id, name, email):
        return

    @abstractmethod
    def delete(self, user_id):
        return
```

```python
# db_store.py
from user_storage import UserStorageInterface

class UserDBStorage(UserStorageInterface):
	# Python throws an error if any of the @abstractmethods is missing
```

### Solution 3: Events

In this solution we'll use events published on an event bus to trigger all data changes. The event bus acts as a mediator between our user api handlers and the database layer.

```python
# events.py
class EventBus:
    listeners = {}

    def on(self, event_name, callback):
        if event_name not in self.listeners:
            self.listeners[event_name] = [callback]
        else:
            self.listeners[event_name].append(callback)

    def emit(self, event_name, *event_args):
        if event_name in self.listeners:
            for callback in self.listeners[event_name]:
                callback(*event_args)
                
event_bus = EventBus()
```

```python
# user_db.py
def create_db_user(name, email):
    query("INSERT INTO users (c1, c2) VALUES(%s, %s)", (name, email))

def update_db_user(user_id, name, email):
    # ...

def delete(user_id):
    # ...
    
def init(event_bus):
  event_bus.on("create_user", create_db_user)
  event_bus.on("update_user", update_db_user)
  event_bus.on("delete_user", delete_db_user)
```

```python
# file_store.py
def create_file_user(name, email):
    with open("users.csv", "a") as userfile:
        userfile.write(f"{name};{email}")

def update_file_user(user_id, name, email):
    # ...

def delete_file_user(user_id):
    # ...
    
def init(event_bus):
  event_bus.on("create_user", create_db_user)
  event_bus.on("update_user", update_file_user)
  event_bus.on("delete_user", delete_file_user)
```

```python
# handlers.py
from events import event_bus
from db_store import insert_db_user

def save_user(name, email):
    if name is None:
        raise Exception("Name is missing")
    if email is None:
        raise Exception("Email is missing")

    event_bus.emit("create_user", name, email)

def update_user(user_id, name, email):
    # ...
    event_bus.emit("update_user", user_id, name, email)
  
def delete_user(user_id):
    # ...
    event_bus.emit("delete_user", user_id, name, email)
```

```python
# main.py
import db_store
import file_store
import handlers
from events import event_bus

if config("userStorage") == "file":
    file_store.init(event_bus)
elif config("userStorage") == "database":
    db_store.init(event_bus)
else:
    raise Exception("Unknown user storage")
```

