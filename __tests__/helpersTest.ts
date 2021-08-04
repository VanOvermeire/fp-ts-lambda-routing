import {findPathInEvent} from "../src";
import {APIGatewayEvent, APIGatewayProxyEventV2} from "aws-lambda";
import * as O from 'fp-ts/Option';

describe('helpers test', () => {
    it('should find the path in a V2 event', () => {
        const event = {
            requestContext: {
                http: {
                    path: '/bar',
                }
            }
        } as APIGatewayProxyEventV2;


        const path = O.getOrElseW(() => 'ERROR')(
            findPathInEvent(event)
        );

        expect(path).toBe('/bar');
    });

    it('should find the path in a normal event', () => {
        const event = {
            path: '/bar'
        } as APIGatewayEvent;


        const path = O.getOrElseW(() => 'ERROR')(
            findPathInEvent(event)
        );

        expect(path).toBe('/bar');
    });

    it('should fail if the path is missing', () => {
        const event = {} as APIGatewayEvent;

        const path = O.getOrElseW(() => 'ERROR')(
            findPathInEvent(event)
        );

        expect(path).toBe('ERROR');
    });

    it('should fail if the path is missing for a V2 event', () => {
        const event = {
            requestContext: {},
        } as APIGatewayProxyEventV2;

        const path = O.getOrElseW(() => 'ERROR')(
            findPathInEvent(event)
        );

        expect(path).toBe('ERROR');
    });
});
