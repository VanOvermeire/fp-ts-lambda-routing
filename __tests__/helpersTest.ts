import * as O from 'fp-ts/Option';
import {APIGatewayEvent, APIGatewayProxyEventV2} from "aws-lambda";
import {findPathInEvent} from "../src/helpers";

const errorFallback = {
    path: 'ERROR',
    method: 'ERROR',
};

describe('helpers test', () => {
    it('should find the path in a V2 event', () => {
        const event = {
            requestContext: {
                http: {
                    method: 'POST',
                    path: '/bar',
                }
            }
        } as APIGatewayProxyEventV2;


        const result = O.getOrElseW(() => errorFallback)(
            findPathInEvent(event)
        );

        expect(result.path).toBe('/bar');
        expect(result.method).toBe('POST');
    });

    it('should find the path in a normal event', () => {
        const event = {
            path: '/bar',
            httpMethod: 'GET'
        } as APIGatewayEvent;


        const result = O.getOrElseW(() => errorFallback)(
            findPathInEvent(event)
        );

        expect(result.path).toBe('/bar');
        expect(result.method).toBe('GET');
    });

    it('should fail if the path is missing', () => {
        const event = {} as APIGatewayEvent;

        const result = O.getOrElseW(() => errorFallback)(
            findPathInEvent(event)
        );

        expect(result.path).toBe('ERROR');
    });

    it('should fail if the path is missing for a V2 event', () => {
        const event = {
            requestContext: {},
        } as APIGatewayProxyEventV2;

        const result = O.getOrElseW(() => errorFallback)(
            findPathInEvent(event)
        );

        expect(result.path).toBe('ERROR');
    });
});
