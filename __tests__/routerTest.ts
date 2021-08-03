import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import {router} from "../src/router";
import {APIGatewayEvent} from "aws-lambda";
import {pipe} from "fp-ts/function";

const fooFunction = () => TE.right('Foo');
const barFunction = () => TE.left('Bar');

const unWrapper = <R, S>(t: TE.TaskEither<R, S>) =>
    pipe(
        t,
        TE.getOrElseW((err) => T.of(`Error: ${err}`)),
    )();

describe('router tests',  () => {
    test('should return a left for a missing path', async () => {
        const dict = {
            '/foo': fooFunction,
        };
        const eventWithoutPath = {} as APIGatewayEvent;

        const routerForDict = router(dict, String);

        routerForDict(eventWithoutPath)

        const result = await unWrapper(
            routerForDict(eventWithoutPath),
        );

        expect(result).toEqual('Error: No route found for path undefined');
    });

    test('should call right function for simple path', async () => {
        const dict = {
            '/foo': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo',
        } as APIGatewayEvent;

        const routerForDict = router(dict, String);

        const result = await unWrapper(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });

    // TODO more complex paths
    //  -> /foo/* = anything starting with foo
    //  prefer an exact match
    //  what about multiple matches? should that be allowed? i.e. /foo/* versus /foo/more/specific/*
});
