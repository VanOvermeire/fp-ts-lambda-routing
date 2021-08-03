import type { TaskEither } from 'fp-ts/TaskEither';
import type {APIGatewayEvent} from "aws-lambda";
import * as TE from 'fp-ts/TaskEither';

// TODO also offer Either? further abstract concrete monad type?
// TODO other locations for lambda path?

export type RouterFunction<T, R> = (e: APIGatewayEvent) => TaskEither<T, R>;

const matchRoute = (path: string) => (route: string) => {
    const routeWithForwardSlash = route.startsWith("/") ? route : `/${route}`;
    const pathWithForwardSlash = path.startsWith("/") ? route : `/${path}`;

    if (routeWithForwardSlash.endsWith("*")) {
        return pathWithForwardSlash.startsWith(routeWithForwardSlash.replace("*", ""));
    }
    return routeWithForwardSlash === path;
}

const findApp = <T, R>(path: string) => (endpoints: Record<string, RouterFunction<T, R>>): RouterFunction<T, R> | undefined => {
    const matchRouteForPath = matchRoute(path);

    Object.entries(endpoints)
        .filter(routeMapping => matchRouteForPath(routeMapping[0]))
        .reduce((acc: RouterFunction<T, R>[], curr) => {
            if(acc.length === 0) {
                acc.push(curr[1]);
            }

            return acc;
        }, [])
        // .map(routeMapping => routeMapping[1])
        .shift();

    return Object.entries(endpoints)
        .filter(routeMapping => matchRouteForPath(routeMapping[0]))
        .map(routeMapping => routeMapping[1])
        .shift();
    // instead: reduce
}


const internalRouter = <T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T) => (event: APIGatewayEvent): TaskEither<T, R> => {
    const path = event.path ?? 'undefined';
    const rightEndpoint = findApp(path)(endpoints);

    return rightEndpoint ? rightEndpoint(event) as TaskEither<T, R> : TE.left(errorConstructor(`No route found for path ${path}`)); // is this assertion necessary?
};

export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T): (event: APIGatewayEvent) => TaskEither<T, R>;
export function router<T, R>(endpoints: Record<string, RouterFunction<T, R>>, errorConstructor: (err: string) => T) {
    return internalRouter(endpoints, errorConstructor);
}
