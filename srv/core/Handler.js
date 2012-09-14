define(['js/core/Component'], function(Component) {
    return Component.inherit('srv.core.Handler', {

        defaults: {
            path: "/",
            route: null
        },

        _initializationComplete: function() {
            if (!this.$.path) {
                throw new Error("Relative path for module missing");
            }
        },

        isResponsibleForRequest: function(context) {

            // Check path
            var path = context.request.urlInfo.pathname;

            if (path.indexOf(this.$.path) === 0) {
                // path matches
                if (this.$.route !== null) {
                    return (new RegExp(this.$.route, "i")).test(path);
                }

                return true;
            }

            return false;
        },

        /***
         * returns an handler instance to process the request
         * @return {srv.core.Handler}
         */
        getHandlerInstance: function() {
            return this;
        },

        /***
         * handles the request
         * @param {srv.core.ServerContext} context
         */
        handleRequest: function(context) {
            throw new Error("Abstract method processRequest");
        }
    })
});