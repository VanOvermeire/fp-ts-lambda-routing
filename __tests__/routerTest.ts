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
            '/foo': fooFunction,
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
            '/foo': fooFunction,
        };
        const exampleEvent = {
            path: '/bar'
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent),
        );

        expect(result).toEqual('No route found for /bar');
    });

    test('should return a left for an unknown in a v2 event', async () => {
        const dict = {
            '/foo': fooFunction,
        };
        const exampleEvent = {
            requestContext: {
                http: {
                    path: '/bar',
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
            '/foo': fooFunction,
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
            '/foo': fooFunction,
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
            '/foo': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            requestContext: {
                http: {
                    path: '/foo',
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
            '/foo': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function when endpoint is missing forward slash', async () => {
        const dict = {
            'foo': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function when path is missing forward slash', async () => {
        const dict = {
            '/foo': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: 'foo',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function when path and endpoint are missing forward slash', async () => {
        const dict = {
            'foo': fooFunction,
            'bar': barFunction,
        };
        const exampleEvent = {
            path: 'foo',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should call right function when path ends with wildcard', async () => {
        const dict = {
            '/foo/*': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo/bar',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should prefer an exact match', async () => {
        const dict = {
            '/foo/*': fooAltFunction,
            '/foo/bar': fooFunction,
        };
        const exampleEvent = {
            path: '/foo/bar',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should prefer a longer path', async () => {
        const dict = {
            '/foo/*': fooAltFunction,
            '/foo/more/specific/*': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo/more/specific/path',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    test('should prefer a longer path regardless of when it appears', async () => {
        const dict = {
            '/foo/more/specific/*': fooFunction,
            '/foo/*': fooAltFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo/more/specific/path',
        } as APIGatewayEvent;

        const routerForDict = router(dict);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });
});
