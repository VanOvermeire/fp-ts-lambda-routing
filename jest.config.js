module.exports = {
    roots: [
        '<rootDir>',
    ],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx)',
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};
