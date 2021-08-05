import {Endpoints, FunctionPerMethod, HTTP_METHOD, PathAndMethod, RouterFunction} from "./types";
import * as O from "fp-ts/Option";
import {pipe} from "fp-ts/function";

const getBestMatchingPath = <T, R>(acc: [string, FunctionPerMethod<T, R>], curr: [string, FunctionPerMethod<T, R>]) => {
    if(!acc) {
        acc = curr;
    } else if (!curr[0]?.includes('*')) {
        acc = curr;
    } else if (curr[0]?.length > (acc[0]?.length ?? 0)) {
        acc = curr;
    }
    return acc;
}

const matchSingleRoute = <T, R>(path: string) => (route: string) => {
    const pathWithForwardSlash = path.startsWith("/") ? path : `/${path}`;
    const routeWithForwardSlash = route.startsWith("/") ? route : `/${route}`;

    if (routeWithForwardSlash.endsWith("*")) {
        return pathWithForwardSlash.startsWith(routeWithForwardSlash.replace("*", ""));
    }
    return routeWithForwardSlash === pathWithForwardSlash;
}

const matchMethod = <T, R>(method: HTTP_METHOD) => (functionPerMethod: FunctionPerMethod<T, R>): O.Option<RouterFunction<T, R>> => {
    return O.fromNullable(
        Object.entries(functionPerMethod)
        .filter(entry => entry[0] === method)
        .map(entry => entry[1])
        .shift()
    );
};

const getFunctionPerMethod = <T, R>(bestResult: [string, FunctionPerMethod<T, R>]): FunctionPerMethod<T, R> => {
    return bestResult[1];
};

const matchRoute = <T, R>(path: string) => (endpoints: Endpoints<T, R>): O.Option<[string, FunctionPerMethod<T, R>]> => {
    const matchRouteForEvent = matchSingleRoute(path);

    const result = Object.entries(endpoints)
        .filter(endpoint => matchRouteForEvent(endpoint[0]))
        .reduce(getBestMatchingPath, [] as unknown as [string, FunctionPerMethod<T, R>]);

    return result[0] ? O.fromNullable(result) : O.none
};

export const searchEndpoints = <T, R>(endpoints: Endpoints<T, R>) => (pathAndMethod: PathAndMethod): O.Option<RouterFunction<T, R>> => {
    return pipe(
        matchRoute(pathAndMethod.path)(endpoints),
        O.map(res => getFunctionPerMethod(res as [string, FunctionPerMethod<T, R>])), // TODO figure out why generics become <unknown, unknown>
        O.chain(matchMethod(pathAndMethod.method))
    );
};
