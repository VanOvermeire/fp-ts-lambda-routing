import type { Either } from 'fp-ts/Either';
import type { TaskEither } from 'fp-ts/TaskEither';
import type {APIGatewayEvent} from "aws-lambda";
import * as E from 'fp-ts/Either';

// TODO do both TaskEither and Either (at once preferably)

export type RouterFunction<T, R> = (e: APIGatewayEvent) => Either<T, R>;
export type TaskEitherRouterFunction<T, R> = (e: APIGatewayEvent) => TaskEither<T, R>;

const internalRouter = <T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T) => (event: APIGatewayEvent): Either<T, R> => {
    const path = event.path;
    const rightEndpoint = endpoints[path];

    return rightEndpoint ? rightEndpoint(event) : E.left(errorConstructor(`No route found for path ${path}`));
};

export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T): (event: APIGatewayEvent) => Either<T, R>;
export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T) {
    return internalRouter(endpoints, errorConstructor);
}
