export default () => {
    return {
        include: ['test/**/{axios.ts,utils.ts}'],
        exclude: [],
        debug: false,
        server: {
            port: 5073,
        }
    };
};
