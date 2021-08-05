import type {TaskEither} from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import type {AnyApiGatewayEvent, Endpoints} from "./types";
import * as O from 'fp-ts/Option';
import {pipe} from "fp-ts/function";
import {findPathInEvent} from "./helpers";
import {searchEndpoints} from "./routeFinder";

const defaultErrorConstructor = <T>(path: string) => (`No route found for ${path}` as unknown as T);

const getPathForErrorConstructor = (event: AnyApiGatewayEvent) => {
    return pipe(
        findPathInEvent(event),
        O.map(result => result.path),
        O.getOrElse(() => 'undefined')
    );
};

const internalRouter = <T, R>(endpoints: Endpoints<T, R>, errorConstructor: (path: string) => T) => (event: AnyApiGatewayEvent): TaskEither<T, R> => {
    const searchGivenEndpoints = searchEndpoints(endpoints);

    return pipe(
        findPathInEvent(event),
        O.chain(searchGivenEndpoints),
        O.map(endpoint => endpoint(event)),
        O.getOrElse(() => TE.left(
            errorConstructor(
                getPathForErrorConstructor(event),
            ))
        ),
    );
};

export function router<T, R>(endpoints: Endpoints<T, R>, errorConstructor?: (err: string) => T): (event: AnyApiGatewayEvent) => TaskEither<T, R>;
export function router<T, R>(endpoints: Endpoints<T, R>, errorConstructor: (err: string) => T = defaultErrorConstructor) {
    return internalRouter(endpoints, errorConstructor);
}
