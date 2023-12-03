export default () => {
    return {
        include: ['test/**/request.ts'],
        exclude: [],
        debug: false,
        server: {
            port: 5073,
        },
    };
};
