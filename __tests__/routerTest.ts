import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import {APIGatewayEvent, APIGatewayProxyEventV2} from "aws-lambda";
import {pipe} from "fp-ts/function";
import {router} from "../src";

const fooFunction = () => TE.right('Foo');
const fooAltFunction = () => TE.right('FooAlt');
const barFunction = () => TE.left('Bar');

const unWrapper = <R, S>(t: TE.TaskEither<R, S>) =>
    pipe(
        t,
        TE.getOrElseW((err) => T.of(err)),
    )();

describe('router tests',  () => {
    test('should return a left for a missing path', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
        };
        const eventWithoutPath = {} as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(eventWithoutPath),
        );

        expect(result).toEqual('No route found for undefined');
    });

    test('should return a left for an unknown path', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
        };
        const exampleEvent = {
            path: '/bar',
            httpMethod: 'POST',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent),
        );

        expect(result).toEqual('No route found for /bar');
    });

    test('should return a left for an unknown in a v2 event', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
        };
        const exampleEvent = {
            requestContext: {
                http: {
                    path: '/bar',
                    method: 'POST',
                }
            }
        } as APIGatewayProxyEventV2;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent),
        );

        expect(result).toEqual('No route found for /bar');
    });

    test('should return a left for a missing path with custom error constructor', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
        };
        const eventWithoutPath = {} as APIGatewayEvent;

        const routerForDict = router(dict, (path) => `Great, no endpoint for ${path}`);

        const result = await unWrapper(
            routerForDict(eventWithoutPath),
        );

        expect(result).toEqual('Great, no endpoint for undefined');
    });

    test('should return a left for a missing path with more complex custom error constructor', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
        };
        const eventWithoutPath = {} as APIGatewayEvent;
        const errorConstructor = (path: string) => {
            return {
                status: 400,
                message: path,
            }
        }

        const routerForDict = router(dict, errorConstructor);

        const result: any = await unWrapper(
            routerForDict(eventWithoutPath),
        );

        expect(result.status).toEqual(400);
        expect(result.message).toEqual('undefined');
    });

    test('should call right function for simple path', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
            '/bar': {
                'GET': barFunction,
            },
        };
        const exampleEvent = {
            requestContext: {
                http: {
                    path: '/foo',
                    method: 'POST'
                }
            }
        } as APIGatewayProxyEventV2;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function for simple path in a V2 event', async () => {
        const dict = {
            '/foo': {
                'POST': fooFunction
            },
            '/bar': {
                'GET': barFunction,
            },
        };
        const exampleEvent = {
            path: '/foo',
            httpMethod: 'POST',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function when path and endpoint are missing forward slash', async () => {
        const dict = {
            'foo': {
                'POST': fooFunction
            },
            'bar': {
                'GET': barFunction,
            },
        };
        const exampleEvent = {
            path: 'foo',
            httpMethod: 'POST',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function when path ends with wildcard', async () => {
        const dict = {
            '/foo/*': {
                'POST': fooFunction
            },
            '/bar': {
                'GET': barFunction,
            },
        };
        const exampleEvent = {
            path: '/foo/bar',
            httpMethod: 'POST',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should prefer an exact match', async () => {
        const dict = {
            '/foo/*': {
                'POST': fooAltFunction
            },
            '/foo/bar': {
                'GET': fooFunction,
            },
        };
        const exampleEvent = {
            path: '/foo/bar',
            httpMethod: 'GET',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });
});
