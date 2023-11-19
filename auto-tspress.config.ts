export default () => {
    return {
        include: ['test/**/utils.ts'],
        exclude: [],
        debug: false,
        server: {
            port: 5074,
        }
    };
};
