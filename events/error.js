module.exports = {
    name: 'error',
    execute(error) {
        console.error('❌ Discord client error:', error);
    },
};
