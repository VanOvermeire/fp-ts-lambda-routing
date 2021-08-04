import type {APIGatewayEvent, APIGatewayProxyEventV2} from "aws-lambda";
import type {TaskEither} from "fp-ts/TaskEither";

export type Accumulated<T, R> = {
    path: string,
    function: RouterFunction<T, R>
};

export type AnyApiGatewayEvent = APIGatewayEvent | APIGatewayProxyEventV2;

export type RouterFunction<T, R> = (e: AnyApiGatewayEvent) => TaskEither<T, R>;
