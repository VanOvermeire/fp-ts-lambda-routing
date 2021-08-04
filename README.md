# fp-ts-lambda-routing

This library offers some simple routing capabilities for AWS Lambda using the fp-ts library. 

You pass in a list of functions that return a TaskEither. The router will return that TaskEither if a route is found. Else, it will return an TaskEither `left`.

## Requirements

The fp-ts library should be installed.

## Examples

Also see the project unit tests.

### Simple Examples

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('OK');
const handleSecondRoute = () => TE.left('Error');

const endpoints = {
    '/one': handleFirstRoute,
    '/two': handleSecondRoute,
};

// can also be a V2 event
const event = {
    path: '/one',
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither containing 'OK'
const result = routerForDict(event);
```

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('OK');

const endpoints = {
    '/one': handleFirstRoute,
};

const event = {
    path: '/fake',
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither left containing an error message
const result = routerForDict(event);
```

```typescript
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import {pipe} from "fp-ts/function";
import { router } from 'fp-ts-lambda-routing';

const endpoints = {
    '/foo': () => TE.right('OK')
};
const ourRouter = router(endpoints, String);

const example = () => {
    return pipe(
        ourRouter({path: '/foo'} as any),
        TE.getOrElse((r) => T.of(`Got back some error: ${r}`))
    )();
};

// prints 'OK'
example().then(console.log);
```

### Wildcards

Endpoints can end with a wildcard.

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('OK');

const endpoints = {
    '/one/*': handleFirstRoute,
};

const event = {
    path: '/one/two',
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither containing 'OK'
const result = routerForDict(someAWSLambdaEvent);
```

However, endpoints without wildcard are preferred.

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('wildcard');
const handleSecondRoute = () => TE.left('no wildcard');

const endpoints = {
    '/one/*': handleFirstRoute,
    '/one/two': handleSecondRoute,
};

const event = {
    path: '/one/two',
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither containing 'no wildcard'
const result = routerForDict(someAWSLambdaEvent);
```

## Custom Error Constructor

There is a default error constructor, but it can be overwritten by passing a second argument to the `router`.

This second argument should be a function that takes a string:

```typescript
// ...

const errorConstructor = (path: string) => {
    return {
        status: 400,
        message: path,
    }
}

// any errors will now return an object with status and message
const routerForDict = router(dict, errorConstructor);
```

## TODOs

- should ideally also support other monads, definitely `Either`
