import type {AnyApiGatewayEvent, HTTP_METHOD} from "./types";
import type {APIGatewayProxyEventV2} from "aws-lambda";
import * as O from 'fp-ts/Option';
import {PathAndMethod} from "./types";

const isApiGatewayEventV2 = (event: any): event is APIGatewayProxyEventV2 => {
    return !event.path && !!event.requestContext?.http?.path;
}

export const findPathInEvent = (event: AnyApiGatewayEvent): O.Option<PathAndMethod> => {
    if (isApiGatewayEventV2(event)) {
        return event.requestContext?.http?.path && event.requestContext?.http?.method ? O.fromNullable({
            path: event.requestContext.http.path,
            method: event.requestContext.http.method as HTTP_METHOD,
        }) : O.none;
    }
    return event.path && event.httpMethod ? O.fromNullable({
        path: event.path,
        method: event.httpMethod as HTTP_METHOD,
    }) : O.none;
};
