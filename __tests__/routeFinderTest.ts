import {searchEndpoints} from "../src/routeFinder";
import * as TE from "fp-ts/TaskEither";
import * as O from 'fp-ts/Option';
import {PathAndMethod, router} from "../src";
import {APIGatewayEvent} from "aws-lambda";

const fooFunction = () => TE.right('Foo');
const fooAltFunction = () => TE.right('FooAlt');
const barFunction = () => TE.left('Bar');

describe('route finder test', () => {
    it('should return empty option for none-existing path', () => {
        const dict = {
            '/foo': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            'bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/fake',
            method: 'POST',
        }

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual('err');
    });

    it('should return empty option for none-existing method', () => {
        const dict = {
            '/foo': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            'bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo',
            method: 'HEAD',
        }

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual('err');
    });

    it('should return right function for existing path and method', () => {
        const dict = {
            '/foo': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            'bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo',
            method: 'POST',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooFunction);
    });

    it('should return right function for existing path and method with missing forward slash in route', () => {
        const dict = {
            'foo': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            'bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo',
            method: 'POST',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooFunction);
    });

    it('should return right function for existing path, with missing forward slash, and method, route', () => {
        const dict = {
            '/foo': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            'bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: 'foo',
            method: 'GET',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooAltFunction);
    });

    it('should return right function for existing path, with missing forward slash, and method, route, also with missing forward slash', () => {
        const dict = {
            'foo': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            'bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: 'foo',
            method: 'GET',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooAltFunction);
    });

    it('should return right function for existing path with wildcard', () => {
        const dict = {
            '/foo/*': {
                'POST': fooFunction,
                'GET': fooAltFunction,
            },
            '/bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo/one',
            method: 'POST',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooFunction);
    });

    it('should return right function for existing path, prefering non-wildcard', () => {
        const dict = {
            '/foo/*': {
                'POST': fooFunction,
            },
            '/foo/one': {
                'POST': fooAltFunction,
            },
            '/bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo/one',
            method: 'POST',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooAltFunction);
    });

    it('should return right function for existing path, prefering non-wildcard, wherever it appears', () => {
        const dict = {
            '/foo/one': {
                'POST': fooAltFunction,
            },
            '/foo/*': {
                'POST': fooFunction,
            },
            '/bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo/one',
            method: 'POST',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooAltFunction);
    });

    test('should prefer a longer path', async () => {
        const dict = {
            '/foo/*': {
                'POST': fooAltFunction,
            },
            '/foo/more/specific/*': {
                'POST': fooFunction,
            },
            '/bar': {
                'PUT': barFunction,
            }
        };
        const pathAndMethod: PathAndMethod = {
            path: '/foo/more/specific/path',
            method: 'POST',
        };

        const result = O.getOrElseW(() => 'err')(
            searchEndpoints(dict)(pathAndMethod)
        );

        expect(result).toEqual(fooFunction);
    });
});
