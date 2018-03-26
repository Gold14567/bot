class Route {
	constructor (router, route, middleware, controller, method, type) {
		const mw = require("../middleware");

		// Set parameters
		this.router = router;
		this.route = route;
		this.controller = controller;
		this.isAPI = type === "api";
		this.isStatic = type === "static";
		this.state = "open";

		// Create wrapper for error handling
		this.wrapper = async (req, res, next) => {
			try {
				await this.controller(req, res, next);
			} catch (err) {
				winston.warn(`An error occurred during a ${req.protocol} ${req.method} request on ${req.path} 0.0\n`, { params: req.params, query: req.query }, err);
				require("../helpers").renderError(res, "Something went wrong!");
			}
		};

		this.middleware = [mw.populateRequest(this), ...middleware, this.wrapper];

		// Register middleware to route in router
		router[method || "get"](route, this.middleware);
	}
}

class DashboardRoute extends Route {
	constructor (router, route, middleware, middlewarePOST, controller, controllerPOST) {
		const mw = require("../middleware");

		// Prepare Dashboard Middleware
		middleware = [mw.authorizeDashboardAccess, ...middleware];
		middlewarePOST = [mw.authorizeDashboardAccess, ...middlewarePOST];
		super(router, route, middleware, controller, "get", "dashboard");

		// Create final Middleware passed to the router, and cache it for hot reloading
		this.postMiddleware = [mw.populateRequest(this), ...middlewarePOST, controllerPOST];

		// Register middleware to route in router
		router.post(route, this.postMiddleware);
	}
}

class ConsoleRoute extends Route {
	constructor (router, route, permission, middleware, middlewarePOST, controller, controllerPOST) {
		const mw = require("../middleware");

		middleware = [mw.authorizeConsoleAccess, ...middleware];
		middlewarePOST = [mw.authorizeConsoleAccess, ...middlewarePOST];
		super(router, route, middleware, controller, "get", "console");
		this.perm = permission;
		this.advanced = true;

		this.postMiddleware = [mw.populateRequest(this), ...middlewarePOST, controllerPOST];

		router.post(route, this.postMiddleware);
	}
}

module.exports = {
	Route,
	DashboardRoute,
	ConsoleRoute,
};