import * as E from 'fp-ts/Either';
import {router} from "../src/router";
import {APIGatewayEvent} from "aws-lambda";
import {unsafeUnwrap, unsafeUnwrapLeft} from "fp-ts-std/Either";

const fooFunction = () => E.right('Foo');
const barFunction = () => E.left('Bar');

describe('router tests', () => {
    test('should return a left for a missing path', () => {
        const dict = {
            '/foo': fooFunction,
        };
        const eventWithoutPath = {} as APIGatewayEvent;

        const routerForDict = router(dict, String);

        const result = unsafeUnwrapLeft(
            routerForDict(eventWithoutPath),
        );

        expect(result).toEqual('No route found for path undefined');
    });

    test('should call right function for simple path', () => {
        const dict = {
            '/foo': fooFunction,
            '/bar': barFunction,
        };
        const exampleEvent = {
            path: '/foo',
        } as APIGatewayEvent;

        const routerForDict = router(dict, String);

        const result = unsafeUnwrap(
            routerForDict(exampleEvent)
        );

        expect(result).toEqual('Foo');
    });
});
