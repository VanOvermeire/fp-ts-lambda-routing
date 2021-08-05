import type {APIGatewayEvent, APIGatewayProxyEventV2} from "aws-lambda";
import type {TaskEither} from "fp-ts/TaskEither";

export type AnyApiGatewayEvent = APIGatewayEvent | APIGatewayProxyEventV2;

export type HTTP_METHOD = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD' | 'PATCH' | 'OPTIONS';

export type Accumulated<T, R> = {
    path: string,
    function: RouterFunction<T, R>
};

export type PathAndMethod = {
    path: string,
    method: HTTP_METHOD,
};

export type Endpoints<T, R> = Record<string, FunctionPerMethod<T, R>>;

export type FunctionPerMethod<T, R> = Partial<Record<HTTP_METHOD, RouterFunction<T, R>>>

export type RouterFunction<T, R> = (e: AnyApiGatewayEvent) => TaskEither<T, R>;
