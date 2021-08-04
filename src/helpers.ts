import {AnyApiGatewayEvent} from "./types";
import {APIGatewayProxyEventV2} from "aws-lambda";
import * as O from 'fp-ts/Option';

const isApiGatewayEventV2 = (event: any): event is APIGatewayProxyEventV2 => {
    return !event.path && !!event.requestContext?.http?.path;
}

export const findPathInEvent = (event: AnyApiGatewayEvent): O.Option<string> => {
    if (isApiGatewayEventV2(event)) {
        return O.fromNullable(event.requestContext?.http?.path);
    }
    return O.fromNullable(event.path);
};
