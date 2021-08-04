import type {TaskEither} from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import {Accumulated, AnyApiGatewayEvent, RouterFunction} from "./types";
import {findPathInEvent} from "./helpers";
import {pipe} from "fp-ts/function";

const defaultErrorConstructor = <T>(path: string) => (`No route found for ${path}` as unknown as T);

const matchRoute = (path: string) => (route: string) => {
    const routeWithForwardSlash = route.startsWith("/") ? route : `/${route}`;
    const pathWithForwardSlash = path.startsWith("/") ? path : `/${path}`;

    if (routeWithForwardSlash.endsWith("*")) {
        return pathWithForwardSlash.startsWith(routeWithForwardSlash.replace("*", ""));
    }
    return routeWithForwardSlash === pathWithForwardSlash;
}

const getBestPath = <T, R>(acc: Accumulated<T, R>, curr: Accumulated<T, R>) => {
    if (!acc) {
        acc = curr;
    } else if (!curr.path?.includes('*')) {
        acc = curr;
    } else if (curr.path?.length > (acc.path?.length ?? 0)) {
        acc = curr;
    }
    return acc;
};

const searchEndpoints = <T, R>(endpoints: Record<string, RouterFunction<T, R>>) => (path: string): O.Option<RouterFunction<T, R>> => {
    const matchRouteForPath = matchRoute(path);

    const t = Object.entries(endpoints)
        .filter(routeMapping => matchRouteForPath(routeMapping[0]))
        .map(routeMapping => ({path: routeMapping[0], function: routeMapping[1]}))
        .reduce(getBestPath, {} as Accumulated<T, R>);

    return O.fromNullable(t.function);
};

const internalRouter = <T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (path: string) => T) => (event: AnyApiGatewayEvent): TaskEither<T, R> => {
    const searchGivenEndpoints = searchEndpoints(endpoints);

    return pipe(
        findPathInEvent(event),
        O.chain(searchGivenEndpoints),
        O.map(endpoint => endpoint(event)),
        O.getOrElse(() => TE.left(
            errorConstructor(
                O.getOrElse(() => 'undefined')(findPathInEvent(event))
            ))
        ),
    );
};

export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor?: (err: string) => T): (event: AnyApiGatewayEvent) => TaskEither<T, R>;
export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T = defaultErrorConstructor) {
    return internalRouter(endpoints, errorConstructor);
}
