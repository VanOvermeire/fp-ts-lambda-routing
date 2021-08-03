import type { TaskEither } from 'fp-ts/TaskEither';
import type {APIGatewayEvent} from "aws-lambda";
import * as TE from 'fp-ts/TaskEither';

// TODO also offer Either? further abstract concrete monad type?

export type RouterFunction<T, R> = (e: APIGatewayEvent) => TaskEither<T, R>;

const internalRouter = <T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T) => (event: APIGatewayEvent): TaskEither<T, R> => {
    const path = event.path;
    const rightEndpoint = endpoints[path];

    return rightEndpoint ? rightEndpoint(event) : TE.left(errorConstructor(`No route found for path ${path}`));
};

export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T): (event: APIGatewayEvent) => TaskEither<T, R>;
export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T) {
    return internalRouter(endpoints, errorConstructor);
}
