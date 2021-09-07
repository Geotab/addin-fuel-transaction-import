// Mocks of MyGeotab objects, these not the full objects, only what we need for our tests
var server = 'www.myaddin.com',
	user = {
		id: 'b1',
		language: 'en',
        firstName: 'Zom',
		lastName: 'Bie',
		name: 'zombie@underworld.dead',
		password: 'eat-the-living'
	},
	login = {
		userName: user.name,
		password: user.password,
		database: 'zombie',
		server: server
	},
	credentials = {
		credentials: {
			database: login.database,
			sessionId: '3225932739582116430',
			userName: login.user,
			server: 'ThisServer'
		}
	};

module.exports = {
	server: server,
	login: login,
	user: user,
	credentials: credentials
};
