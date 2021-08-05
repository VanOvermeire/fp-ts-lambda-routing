# fp-ts-lambda-routing

This library offers some simple routing capabilities for AWS Lambda using the fp-ts library.

Its primary use case is when you have an API Gateway that forwards all calls to a single ('fat') Lambda.
There are bigger, more complex libraries to serve this purpose (lambda-api, serverless-express) - 
but most of them have the (Express) habit of passing on additional parameters (request, response, next), something
I prefer to avoid.

## How it works

You pass in a list of functions that return a TaskEither. The router will return that TaskEither if a route is found. 

Else, it will return an TaskEither `left` with a (customizable) error.

## Examples

Also see the project unit tests.

Simple example:

```typescript
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import {pipe} from "fp-ts/function";
import type {APIGatewayEvent} from "aws-lambda";
import { router } from 'fp-ts-lambda-routing';

const endpoints = {
    '/foo': {
        'POST': () => TE.right('OK')
    }
};
const ourRouter = router(endpoints);

const example = () => {
    return pipe(
        ourRouter({path: '/foo', httpMethod: 'POST'} as APIGatewayEvent),
        TE.getOrElse((r) => T.of(`Got back some error: ${r}`))
    )();
};

// prints 'OK'
example().then(console.log);
```

The code will also work with the more recent event payloads (`APIGatewayProxyEventV2`).

```typescript
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import {pipe} from "fp-ts/function";
import type {APIGatewayEvent} from "aws-lambda";
import { router } from 'fp-ts-lambda-routing';

const endpoints = {
    '/foo': {
        'POST': () => TE.right('OK')
    }
};

const exampleEvent = {
    requestContext: {
        http: {
            path: '/foo',
            method: 'POST',
        }
    }
} as APIGatewayProxyEventV2;

const ourRouter = router(endpoints);

const example = () => {
    return pipe(
        ourRouter({path: '/foo', httpMethod: 'POST'} as APIGatewayEvent),
        TE.getOrElse((r) => T.of(`Got back some error: ${r}`))
    )();
};

// prints 'OK'
example().then(console.log);
```

A left is returned if there is an error.

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('OK');

const endpoints = {
    '/one': {
        'POST': handleFirstRoute,
    },
};

const event = {
    path: '/fake',
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither left containing an error message
const result = routerForDict(event);
```

Endpoints can end with a wildcard.

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('OK');

const endpoints = {
    '/one/*': {
        'POST': handleFirstRoute,
    },
};

const event = {
    path: '/one/two',
    httpMethod: 'POST',
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither containing 'OK'
const result = routerForDict(event);
```

Endpoints without wildcard are preferred above those with a wildcard.

```typescript
import * as TE from 'fp-ts/TaskEither';
import { router } from 'fp-ts-lambda-routing';

const handleFirstRoute = () => TE.right('wildcard');
const handleSecondRoute = () => TE.left('no wildcard');

const endpoints = {
    '/one/*': {
        'POST': handleFirstRoute,
    },
    '/one/two': {
        'POST': handleSecondRoute,
    },
};

const event = {
    path: '/one/two',
    httpMethod: '/one/two'
    // other properties
};

const routerForDict = router(endpoints);

// will return TaskEither containing 'no wildcard'
const result = routerForDict(event);
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

// any errors will now return an object with status 400 and a message
const routerForDict = router(dict, errorConstructor);
```

## Requirements

fp-ts is used both within the library and as part of the types.

## Possible improvements

- should ideally also support other monads, definitely `Either`
- allow 'ANY' as a catch-all http method
